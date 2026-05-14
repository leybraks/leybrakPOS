import hashlib
import hmac
import json
import logging
import requests
 
from django.db import transaction, IntegrityError
from django.views.decorators.csrf import csrf_exempt
 
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
 
from ..models import Pago, Orden
 
logger = logging.getLogger(__name__)
 
CULQI_ORDERS_URL  = 'https://api.culqi.com/v2/orders'
CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges'
 
 
def _headers_culqi(private_key: str) -> dict:
    return {
        'Authorization': f'Bearer {private_key}',
        'Content-Type':  'application/json',
    }
 
 
def _get_negocio(user):
    try:
        return user.negocio
    except Exception:
        return None
 
 
def _get_sesion_caja_activa(negocio):
    from .models import SesionCaja
    return SesionCaja.objects.filter(negocio=negocio, estado='abierta').first()
 
 
def _monto_restante(orden):
    """Calcula cuánto falta pagar de una Orden, desde la BD."""
    pagado = sum(
        p.monto for p in orden.pagos.filter(estado__in=['confirmado', 'manual'])
    )
    return orden.total - pagado
 
 
# ──────────────────────────────────────────────────────────────
# POST /api/culqi/generar-qr/
# Crea Order en Culqi + Pago pendiente en BD
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_qr_culqi(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)
    if not negocio.usa_culqi or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no está configurado en este negocio'}, status=400)
 
    orden_id    = request.data.get('orden_id')
    metodo      = request.data.get('metodo')
    descripcion = request.data.get('descripcion', 'Pago POS')
 
    if metodo not in ('yape', 'plin'):
        return Response({'error': 'Método inválido'}, status=400)
 
    # ✅ Monto desde la BD — nunca del frontend
    try:
        orden = Orden.objects.get(id=orden_id, negocio=negocio)
    except Orden.DoesNotExist:
        return Response({'error': 'Orden no encontrada'}, status=404)
 
    monto_restante = _monto_restante(orden)
    if monto_restante <= 0:
        return Response({'error': 'Esta orden ya está pagada'}, status=400)
 
    monto_centavos = int(monto_restante * 100)
 
    payload = {
        'amount':        monto_centavos,
        'currency_code': 'PEN',
        'description':   descripcion[:250],
        'order_number':  f'POS-{orden.id}-{negocio.id}',
        'client_details': {
            'first_name':   negocio.nombre[:50],
            'last_name':    'POS',
            'email':        f'pos@negocio{negocio.id}.brava.pe',
            'phone_number': (negocio.yape_numero or '999000000')[:15],
        },
        'expiration_date': 300,
        'confirm':         False,
    }
 
    try:
        res = requests.post(
            CULQI_ORDERS_URL,
            json=payload,
            headers=_headers_culqi(negocio.culqi_private_key),
            timeout=10,
        )
        data = res.json()
    except requests.Timeout:
        return Response({'error': 'Timeout conectando con Culqi'}, status=504)
    except Exception as e:
        logger.error(f'Culqi generar-qr: {e}')
        return Response({'error': str(e)}, status=500)
 
    if res.status_code not in (200, 201):
        logger.error(f'Culqi generar-qr {res.status_code}: {data}')
        return Response({'error': data.get('user_message', 'Error en Culqi')}, status=400)
 
    culqi_order_id = data.get('id', '')
    qr_url         = data.get('qr_url') or data.get('metadata', {}).get('qr_url', '')
 
    # ✅ Pago en BD en estado 'pendiente' — get_or_create evita duplicados si se reintenta
    sesion = _get_sesion_caja_activa(negocio)
    pago, _ = Pago.objects.get_or_create(
        culqi_order_id=culqi_order_id,
        defaults={
            'orden':       orden,
            'metodo':      metodo,
            'monto':       monto_restante,
            'sesion_caja': sesion,
            'estado':      'pendiente',
        }
    )
 
    return Response({
        'order_id':  culqi_order_id,
        'pago_id':   pago.id,
        'qr_url':    qr_url,
        'expira_en': 300,
        'monto':     float(monto_restante),
    })
 
 
# ──────────────────────────────────────────────────────────────
# GET /api/culqi/estado-orden/<order_id>/
# Polling: consulta si el QR fue pagado y confirma el Pago
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estado_orden_culqi(request, order_id):
    negocio = _get_negocio(request.user)
    if not negocio or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no configurado'}, status=400)
 
    # Si el webhook ya lo confirmó, respondemos directo sin llamar a Culqi
    try:
        pago = Pago.objects.get(culqi_order_id=order_id)
        if pago.estado == 'confirmado':
            return Response({'estado': 'pagado', 'pago_id': pago.id})
    except Pago.DoesNotExist:
        pago = None
 
    try:
        res = requests.get(
            f'{CULQI_ORDERS_URL}/{order_id}',
            headers=_headers_culqi(negocio.culqi_private_key),
            timeout=8,
        )
        data = res.json()
    except requests.Timeout:
        return Response({'error': 'Timeout'}, status=504)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
 
    if res.status_code != 200:
        return Response({'error': data.get('user_message', 'Error consultando orden')}, status=400)
 
    estado_culqi = data.get('state', '')
    pagado       = estado_culqi in ('paid', 'confirmed')
 
    if pagado and pago:
        # ✅ Confirmación atómica con select_for_update — evita race conditions
        with transaction.atomic():
            pago = Pago.objects.select_for_update().get(pk=pago.pk)
            if pago.estado != 'confirmado':
                pago.estado       = 'confirmado'
                pago.culqi_amount = data.get('amount')
                pago.save(update_fields=['estado', 'culqi_amount'])
 
        return Response({'estado': 'pagado', 'pago_id': pago.id})
 
    return Response({'estado': 'pendiente', 'estado_culqi': estado_culqi})
 
 
# ──────────────────────────────────────────────────────────────
# POST /api/culqi/cobrar-tarjeta/
# Cargo real con token de Culqi.js — atómico e idempotente
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cobrar_tarjeta_culqi(request):
    negocio = _get_negocio(request.user)
    if not negocio or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no configurado'}, status=400)
 
    token    = request.data.get('token')
    orden_id = request.data.get('orden_id')
 
    if not token or not orden_id:
        return Response({'error': 'token y orden_id son requeridos'}, status=400)
 
    # ✅ Monto desde la BD
    try:
        orden = Orden.objects.get(id=orden_id, negocio=negocio)
    except Orden.DoesNotExist:
        return Response({'error': 'Orden no encontrada'}, status=404)
 
    monto_restante = _monto_restante(orden)
    if monto_restante <= 0:
        return Response({'error': 'Esta orden ya está pagada'}, status=400)
 
    payload = {
        'amount':        int(monto_restante * 100),
        'currency_code': 'PEN',
        'email':         f'pos@negocio{negocio.id}.brava.pe',
        'source_id':     token,
        'description':   f'Pago POS orden #{orden_id}',
        'capture':       True,
    }
 
    try:
        res = requests.post(
            CULQI_CHARGES_URL,
            json=payload,
            headers=_headers_culqi(negocio.culqi_private_key),
            timeout=15,
        )
        data = res.json()
    except requests.Timeout:
        return Response({'error': 'Timeout procesando tarjeta'}, status=504)
    except Exception as e:
        logger.error(f'Culqi cobrar-tarjeta: {e}')
        return Response({'error': str(e)}, status=500)
 
    if res.status_code not in (200, 201):
        logger.error(f'Culqi cobrar-tarjeta error: {data}')
        return Response({'error': data.get('user_message', 'Cargo rechazado')}, status=400)
 
    cargo_id      = data.get('id')
    monto_cobrado = data.get('amount')
    sesion        = _get_sesion_caja_activa(negocio)
 
    # ✅ unique=True en culqi_charge_id → IntegrityError si se intenta cobrar dos veces
    try:
        with transaction.atomic():
            pago = Pago.objects.create(
                orden           = orden,
                metodo          = 'tarjeta',
                monto           = monto_restante,
                sesion_caja     = sesion,
                estado          = 'confirmado',
                culqi_charge_id = cargo_id,
                culqi_amount    = monto_cobrado,
            )
    except IntegrityError:
        logger.warning(f'Intento de doble cobro charge_id={cargo_id}')
        return Response({'ok': True, 'cargo_id': cargo_id, 'duplicado': True})
 
    return Response({'ok': True, 'cargo_id': cargo_id, 'pago_id': pago.id})
 
 
# ──────────────────────────────────────────────────────────────
# POST /api/culqi/webhook/
# Red de seguridad: Culqi avisa aunque el cajero cierre el modal.
# El secret es POR NEGOCIO — se lee de la BD, no de settings.py.
# ──────────────────────────────────────────────────────────────
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_culqi(request):
    try:
        body_bytes = request.body
        event      = json.loads(body_bytes)
    except Exception:
        return Response({'error': 'Body inválido'}, status=400)
 
    event_type = event.get('type', '')
    obj        = event.get('data', {}).get('object', {})
 
    # Identificar negocio por order_number: "POS-{orden_id}-{negocio_id}"
    order_number = obj.get('order_number', '')
    negocio_id   = None
    try:
        negocio_id = int(order_number.split('-')[-1])
    except (IndexError, ValueError):
        pass
 
    # ✅ Verificar HMAC con el secret del negocio específico
    secret = ''
    if negocio_id:
        try:
            from .models import Negocio as NegocioModel
            n      = NegocioModel.objects.get(id=negocio_id)
            secret = n.culqi_webhook_secret or ''
        except NegocioModel.DoesNotExist:
            pass
 
    if secret:
        signature = request.headers.get('X-Culqi-Signature', '')
        expected  = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            logger.warning(f'Webhook Culqi: firma inválida para negocio {negocio_id}')
            return Response({'error': 'Firma inválida'}, status=400)
 
    # Yape / Plin — order.status.changed (Culqi v2)
    # Solo confirmamos si el nuevo estado es 'paid' o 'confirmed'
    if event_type == 'order.status.changed':
        order_id     = obj.get('id')
        monto        = obj.get('amount')
        estado_order = obj.get('state', '')   # 'paid', 'confirmed', 'expired', etc.
 
        if order_id and estado_order in ('paid', 'confirmed'):
            try:
                with transaction.atomic():
                    pago = Pago.objects.select_for_update().get(culqi_order_id=order_id)
                    if pago.estado != 'confirmado':
                        pago.estado       = 'confirmado'
                        pago.culqi_amount = monto
                        pago.save(update_fields=['estado', 'culqi_amount'])
                        logger.info(f'Webhook: Pago #{pago.id} confirmado via order.status.changed (negocio {negocio_id})')
            except Pago.DoesNotExist:
                logger.warning(f'Webhook: order {order_id} no encontrada en BD')
 
    # Tarjeta — charge.creation.succeeded (Culqi v2)
    elif event_type == 'charge.creation.succeeded':
        charge_id = obj.get('id')
        monto     = obj.get('amount')
        if charge_id:
            try:
                with transaction.atomic():
                    pago = Pago.objects.select_for_update().get(culqi_charge_id=charge_id)
                    if pago.estado != 'confirmado':
                        pago.estado       = 'confirmado'
                        pago.culqi_amount = monto
                        pago.save(update_fields=['estado', 'culqi_amount'])
                        logger.info(f'Webhook: Charge #{pago.id} confirmado (negocio {negocio_id})')
            except Pago.DoesNotExist:
                logger.warning(f'Webhook: charge {charge_id} no encontrado en BD')
 
    return Response({'ok': True})