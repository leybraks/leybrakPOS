# ============================================================
# views/suscripcion_billing_views.py
# Cobro de suscripción de Leybrak vía MercadoPago Checkout Pro.
#   - generar_pago_suscripcion: el dueño genera el link de pago.
#   - webhook_mercadopago: MercadoPago confirma el pago (fuente de verdad).
# ============================================================
import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import (
    api_view, permission_classes, throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework import status

from ..billing import get_provider
from ..billing.base import BillingProviderError

logger = logging.getLogger(__name__)


class MPWebhookThrottle(SimpleRateThrottle):
    """Limita el webhook por IP usando la tarifa 'mp_webhook' (settings)."""
    scope = 'mp_webhook'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }

# Mapea el tipo de pago de MercadoPago a METODO_CHOICES de PagoSuscripcion
_METODO_MAP = {
    'credit_card': 'tarjeta',
    'debit_card': 'tarjeta',
    'ticket': 'efectivo',          # PagoEfectivo / agentes
    'bank_transfer': 'transferencia',
    'account_money': 'yape',       # dinero en cuenta MP (incluye Yape vía MP)
}


# ============================================================
# El dueño genera el pago de su suscripción
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_pago_suscripcion(request):
    from ..models import PagoSuscripcion, PlanSaaS

    negocio = getattr(request.user, 'negocio', None)
    if negocio is None:
        return Response({'error': 'El usuario no tiene un negocio asociado.'},
                        status=status.HTTP_403_FORBIDDEN)

    # Plan: el del negocio, o uno explícito (upgrade) validado
    plan_id = request.data.get('plan_id')
    if plan_id:
        plan = PlanSaaS.objects.filter(id=plan_id).first()
        if not plan:
            return Response({'error': 'Plan no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        plan = negocio.plan
        if not plan:
            return Response({'error': 'El negocio no tiene un plan asignado. Elige uno.'},
                            status=status.HTTP_400_BAD_REQUEST)

    monto = plan.precio_mensual
    periodo = timezone.now().strftime('%B %Y')

    # 1) Crear el registro pendiente para obtener PK y referencia única
    pago = PagoSuscripcion.objects.create(
        negocio=negocio,
        plan=plan,
        monto=monto,
        estado='pendiente',
        metodo_pago='otro',
        periodo=periodo,
    )
    external_reference = f'sub-{pago.id}'

    # 2) Crear la preferencia en MercadoPago
    try:
        checkout = get_provider().create_subscription_checkout(
            negocio=negocio,
            plan=plan,
            periodo=periodo,
            external_reference=external_reference,
            monto=monto,
        )
    except BillingProviderError as e:
        pago.estado = 'fallido'
        pago.notas = f'Error al crear checkout: {e}'
        pago.save(update_fields=['estado', 'notas'])
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    # 3) Guardar referencias y devolver el init_point al frontend
    pago.preference_id = checkout['preference_id']
    pago.referencia_externa = external_reference
    pago.save(update_fields=['preference_id', 'referencia_externa'])

    from django.conf import settings
    init_point = checkout['sandbox_init_point'] if settings.MP_SANDBOX else checkout['init_point']

    return Response({
        'pago_id': pago.id,
        'preference_id': checkout['preference_id'],
        'init_point': init_point,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# Webhook de MercadoPago (fuente de verdad del pago)
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])           # autenticado por firma HMAC
@throttle_classes([MPWebhookThrottle])
def webhook_mercadopago(request):
    from ..models import PagoSuscripcion

    provider = get_provider()

    # 1) Verificar firma
    if not provider.verify_webhook_signature(
        headers=request.headers,
        query_params=request.query_params,
    ):
        logger.warning('MP webhook: firma inválida.')
        return Response({'error': 'Firma inválida.'}, status=status.HTTP_403_FORBIDDEN)

    # 2) Solo nos interesan notificaciones de pago
    tipo = request.query_params.get('type') or request.data.get('type')
    if tipo != 'payment':
        return Response({'ok': True, 'ignored': tipo}, status=status.HTTP_200_OK)

    payment_id = (
        request.query_params.get('data.id')
        or (request.data.get('data') or {}).get('id')
    )
    if not payment_id:
        return Response({'error': 'Falta data.id.'}, status=status.HTTP_400_BAD_REQUEST)

    # 3) Re-consultar el pago a MP (nunca confiar en el body)
    try:
        payment = provider.get_payment(payment_id)
    except BillingProviderError as e:
        # 5xx para que MP reintente
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    estado_mp = payment.get('status')
    external_reference = payment.get('external_reference') or ''
    transaction_amount = payment.get('transaction_amount')
    payment_type_id = payment.get('payment_type_id')

    if not external_reference.startswith('sub-'):
        # No es un pago de suscripción nuestro
        return Response({'ok': True, 'ignored': 'external_reference'}, status=status.HTTP_200_OK)

    # 4) Buscar el PagoSuscripcion (con bloqueo para serializar reintentos)
    with transaction.atomic():
        try:
            pago_id = int(external_reference.split('-', 1)[1])
        except (IndexError, ValueError):
            return Response({'ok': True, 'ignored': 'ref'}, status=status.HTTP_200_OK)

        pago = (PagoSuscripcion.objects
                .select_for_update()
                .filter(id=pago_id)
                .first())
        if not pago:
            logger.error('MP webhook: PagoSuscripcion %s no existe.', pago_id)
            return Response({'ok': True, 'ignored': 'not_found'}, status=status.HTTP_200_OK)

        # 5) Idempotencia: ya confirmado con el mismo pago → no-op
        if pago.estado == 'pagado' and pago.referencia_externa == str(payment_id):
            return Response({'ok': True, 'duplicate': True}, status=status.HTTP_200_OK)

        # 6) Validar monto contra el precio del plan
        if transaction_amount is None or Decimal(str(transaction_amount)) != pago.monto:
            logger.error(
                'MP webhook: monto no coincide para %s (MP=%s, esperado=%s).',
                external_reference, transaction_amount, pago.monto,
            )
            return Response({'ok': True, 'amount_mismatch': True}, status=status.HTTP_200_OK)

        # 7) Aplicar según estado del pago
        if estado_mp == 'approved':
            pago.estado = 'pagado'
            pago.fecha_pago = timezone.now()
            pago.referencia_externa = str(payment_id)
            pago.metodo_pago = _METODO_MAP.get(payment_type_id, 'otro')
            pago.save(update_fields=['estado', 'fecha_pago', 'referencia_externa', 'metodo_pago'])
            # El signal reactivar_negocio_al_pagar reactiva el negocio y envía email.
            logger.info('MP webhook: pago %s aprobado para %s.', payment_id, external_reference)
        elif estado_mp in ('rejected', 'cancelled'):
            pago.estado = 'fallido'
            pago.referencia_externa = str(payment_id)
            pago.save(update_fields=['estado', 'referencia_externa'])
        # pending / in_process: se deja 'pendiente' (ej. voucher PagoEfectivo sin pagar aún)

    return Response({'ok': True}, status=status.HTTP_200_OK)
