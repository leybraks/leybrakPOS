import hashlib
import hmac
import logging
import requests

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from ..models import Pago, Negocio

logger = logging.getLogger(__name__)


def _get_negocio(user):
    try:
        return user.negocio
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────
# POST /api/mp/webhook/
# MP llama aquí cuando un pago cambia de estado.
# URL que registras en el panel de MP → Notificaciones IPN/Webhooks
# ──────────────────────────────────────────────────────────────
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # MP llama sin JWT — la seguridad la hacemos con firma HMAC
def mp_webhook(request):
    # ── 1. Verificamos la firma HMAC de MP ──────────────────────
    # MP manda: x-signature: ts=TIMESTAMP,v1=HASH
    # y x-request-id en los headers
    signature_header = request.headers.get('x-signature', '')
    request_id       = request.headers.get('x-request-id', '')

    if signature_header:
        # Extraemos ts y v1 del header
        parts = {k: v for part in signature_header.split(',') for k, v in [part.split('=', 1)]}
        ts    = parts.get('ts', '')
        v1    = parts.get('v1', '')

        # El data_id viene en el query param ?data.id=
        data_id = request.query_params.get('data.id', '')

        # Construimos el manifest que MP firmó
        # Formato: id:[data.id];request-id:[x-request-id];ts:[ts];
        manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"

        # Buscamos el secret del negocio correcto.
        # Problema: el webhook llega sin saber a qué negocio pertenece todavía.
        # Solución A (simple, válida para empezar): un secret global en settings.
        # Solución B (avanzada): múltiples apps MP, una por negocio → más complejo.
        # Usamos Solución A: MP_WEBHOOK_SECRET en settings.py
        secret = getattr(settings, 'MP_WEBHOOK_SECRET', '')

        if secret:
            firma_esperada = hmac.new(
                secret.encode('utf-8'),
                manifest.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(firma_esperada, v1):
                logger.warning(f"MP Webhook: firma inválida. manifest={manifest}")
                return Response({'error': 'Firma inválida'}, status=401)

    # ── 2. Leemos el tipo de notificación ───────────────────────
    body      = request.data
    tipo      = body.get('type') or request.query_params.get('topic')
    data_id   = body.get('data', {}).get('id') or request.query_params.get('id')

    logger.info(f"MP Webhook recibido: tipo={tipo}, id={data_id}")

    # Solo nos importan los pagos
    if tipo not in ('payment', 'merchant_order'):
        return Response({'ok': True})  # Le decimos a MP que recibimos OK

    # ── 3. Consultamos el pago a MP para tener el estado real ───
    # (Nunca confíes solo en el webhook, siempre verifica con la API)
    if tipo == 'payment':
        _procesar_pago_mp(data_id)
    elif tipo == 'merchant_order':
        _procesar_merchant_order(data_id)

    # MP espera un 200 rápido — si tardas más de 5s reintenta
    return Response({'ok': True})


def _procesar_pago_mp(payment_id):
    """Consulta el pago a MP y actualiza la BD."""
    # Para validar el pago necesitamos el access_token del negocio dueño.
    # Lo buscamos por external_reference (que pusimos como POS-{orden_id}-{negocio_id})
    # Primero obtenemos el pago de MP con un token de app (no de usuario)
    # Alternativa: buscar el Pago en BD por mp_order_id y usar el token de ese negocio

    try:
        # Buscamos si tenemos ese payment_id en algún Pago pendiente
        # MP no nos manda el external_reference directamente en el webhook,
        # así que consultamos la API con el access_token correcto.
        # Estrategia: iteramos negocios con MP activo que tengan pagos pendientes
        # (En producción con muchos negocios: usar una app MP única con un token de aplicación)

        pago = Pago.objects.filter(
            estado='pendiente',
            metodo__in=['yape', 'plin', 'mercadopago'],
        ).select_related('orden__sede__negocio').first()

        # Mejor estrategia: consultar MP con el access_token del negocio
        # usando el external_reference que ya guardamos
        negocios_mp = Negocio.objects.filter(usa_mercado_pago=True, mp_access_token__isnull=False).exclude(mp_access_token='')

        for negocio in negocios_mp:
            res = requests.get(
                f"https://api.mercadopago.com/v1/payments/{payment_id}",
                headers={"Authorization": f"Bearer {negocio.mp_access_token}"},
                timeout=8,
            )
            if res.status_code == 200:
                data = res.json()
                _actualizar_pago_desde_mp(data, negocio)
                return
            # 401 = no es de este negocio, probamos el siguiente

    except Exception as e:
        logger.error(f"MP _procesar_pago_mp error: {e}")


def _procesar_merchant_order(order_id):
    """Procesa una merchant_order — contiene los payments dentro."""
    try:
        negocios_mp = Negocio.objects.filter(usa_mercado_pago=True, mp_access_token__isnull=False).exclude(mp_access_token='')

        for negocio in negocios_mp:
            res = requests.get(
                f"https://api.mercadopago.com/merchant_orders/{order_id}",
                headers={"Authorization": f"Bearer {negocio.mp_access_token}"},
                timeout=8,
            )
            if res.status_code == 200:
                order_data = res.json()
                # Una merchant_order puede tener múltiples pagos
                for payment in order_data.get('payments', []):
                    if payment.get('status') == 'approved':
                        _actualizar_pago_desde_external_ref(
                            external_ref=order_data.get('external_reference'),
                            negocio=negocio,
                            monto_pagado=payment.get('total_paid_amount', 0),
                        )
                return

    except Exception as e:
        logger.error(f"MP _procesar_merchant_order error: {e}")


def _actualizar_pago_desde_mp(payment_data, negocio):
    """Actualiza el modelo Pago basado en la respuesta de la API de MP."""
    external_ref = payment_data.get('external_reference', '')
    status       = payment_data.get('status')              # approved / rejected / pending
    status_detail = payment_data.get('status_detail', '')

    logger.info(f"MP pago external_ref={external_ref} status={status} ({status_detail})")

    try:
        pago = Pago.objects.select_related('orden').get(mp_order_id=external_ref)
    except Pago.DoesNotExist:
        logger.warning(f"MP Webhook: no encontré Pago con mp_order_id={external_ref}")
        return
    except Pago.MultipleObjectsReturned:
        pago = Pago.objects.filter(mp_order_id=external_ref).latest('id')

    if status == 'approved' and pago.estado == 'pendiente':
        pago.estado = 'confirmado'
        pago.save()
        _intentar_cerrar_orden(pago.orden)
        logger.info(f"✅ Pago #{pago.id} CONFIRMADO vía webhook MP")

    elif status in ('rejected', 'cancelled') and pago.estado == 'pendiente':
        pago.estado = 'fallido'
        pago.save()
        logger.info(f"❌ Pago #{pago.id} RECHAZADO vía webhook MP: {status_detail}")


def _actualizar_pago_desde_external_ref(external_ref, negocio, monto_pagado):
    """Versión simplificada para merchant_orders."""
    try:
        pago = Pago.objects.select_related('orden').get(mp_order_id=external_ref)
        if pago.estado == 'pendiente':
            pago.estado = 'confirmado'
            pago.save()
            _intentar_cerrar_orden(pago.orden)
            logger.info(f"✅ Pago #{pago.id} CONFIRMADO vía merchant_order MP")
    except Pago.DoesNotExist:
        logger.warning(f"MP Webhook: no encontré Pago con external_ref={external_ref}")


def _intentar_cerrar_orden(orden):
    """Si todos los pagos cubren el total, cierra la orden automáticamente."""
    from ..models import Pago as PagoModel
    total_pagado = sum(
        p.monto for p in PagoModel.objects.filter(
            orden=orden,
            estado__in=['confirmado', 'manual']
        )
    )
    if total_pagado >= orden.total and orden.estado not in ('pagada', 'cerrada'):
        orden.estado = 'pagada'
        orden.save()
        logger.info(f"🟢 Orden #{orden.id} cerrada automáticamente — total pagado: {total_pagado}")


# ──────────────────────────────────────────────────────────────
# GET /api/mp/estado-pago/<pago_id>/
# El frontend hace polling aquí cada 3s para saber si el QR fue pagado.
# Mismo patrón que ya usabas con Culqi.
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_estado_pago(request, pago_id):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)

    try:
        pago = Pago.objects.get(id=pago_id, orden__sede__negocio=negocio)
    except Pago.DoesNotExist:
        return Response({'error': 'Pago no encontrado'}, status=404)

    # Si el webhook ya lo marcó como confirmado → devolvemos confirmado
    if pago.estado == 'confirmado':
        return Response({'estado': 'confirmado', 'monto': float(pago.monto)})

    if pago.estado == 'fallido':
        return Response({'estado': 'fallido'})

    # Todavía pendiente → consultamos MP en tiempo real (por si el webhook tardó)
    if negocio.mp_access_token and negocio.mp_user_id:
        try:
            res = requests.get(
                f"https://api.mercadopago.com/v1/payments/search"
                f"?external_reference={pago.mp_order_id}&sort=date_created&criteria=desc&limit=1",
                headers={"Authorization": f"Bearer {negocio.mp_access_token}"},
                timeout=6,
            )
            if res.status_code == 200:
                results = res.json().get('results', [])
                if results:
                    mp_status = results[0].get('status')
                    if mp_status == 'approved' and pago.estado == 'pendiente':
                        pago.estado = 'confirmado'
                        pago.save()
                        _intentar_cerrar_orden(pago.orden)
                        return Response({'estado': 'confirmado', 'monto': float(pago.monto)})
                    elif mp_status in ('rejected', 'cancelled'):
                        pago.estado = 'fallido'
                        pago.save()
                        return Response({'estado': 'fallido'})
        except Exception as e:
            logger.warning(f"MP polling fallback error: {e}")

    return Response({'estado': 'pendiente'})
