import requests
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
 
logger = logging.getLogger(__name__)
 
CULQI_ORDERS_URL  = 'https://api.culqi.com/v2/orders'
CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges'
 
 
def _headers_culqi(private_key: str) -> dict:
    return {
        'Authorization': f'Bearer {private_key}',
        'Content-Type':  'application/json',
    }
 
 
def _get_negocio(user):
    """Obtiene el negocio del usuario autenticado."""
    try:
        return user.negocio
    except Exception:
        return None
 
 
# ──────────────────────────────────────────────────────────────
# POST /api/culqi/generar-qr/
# Crea una Order en Culqi y devuelve el QR para Yape o Plin
# Body: { monto, metodo, orden_id, descripcion }
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_qr_culqi(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)
    if not negocio.usa_culqi or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no está configurado en este negocio'}, status=400)
 
    monto       = request.data.get('monto')        # en centavos (int)
    metodo      = request.data.get('metodo')        # 'yape' | 'plin'
    descripcion = request.data.get('descripcion', 'Pago POS')
    orden_id    = request.data.get('orden_id')
 
    if not monto or metodo not in ('yape', 'plin'):
        return Response({'error': 'Parámetros inválidos'}, status=400)
 
    # Culqi: tipo de QR según método
    # Docs: https://docs.culqi.com/es/documentacion/pagos/ordenes/
    tipo_qr = 'YAPE' if metodo == 'yape' else 'PLIN'
 
    payload = {
        'amount':           int(monto),
        'currency_code':    'PEN',
        'description':      descripcion[:250],
        'order_number':     f'POS-{orden_id or "0"}-{negocio.id}',
        'client_details': {
            'first_name':   negocio.nombre,
            'last_name':    '',
            'email':        f'pos@negocio{negocio.id}.com',
            'phone_number': negocio.yape_numero or '999000000',
        },
        'expiration_date': 300,   # 5 minutos en segundos
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
 
        if res.status_code not in (200, 201):
            logger.error(f'Culqi generar-qr error: {data}')
            return Response({'error': data.get('user_message', 'Error en Culqi')}, status=400)
 
        # Culqi devuelve el QR dentro de metadata o qr_url según el plan
        qr_url  = data.get('qr_url') or data.get('metadata', {}).get('qr_url', '')
        order_id = data.get('id', '')
 
        return Response({
            'order_id':  order_id,
            'qr_url':    qr_url,
            'expira_en': 300,
        })
 
    except requests.Timeout:
        return Response({'error': 'Timeout conectando con Culqi'}, status=504)
    except Exception as e:
        logger.error(f'Culqi generar-qr excepción: {e}')
        return Response({'error': str(e)}, status=500)
 
 
# ──────────────────────────────────────────────────────────────
# GET /api/culqi/estado-orden/<order_id>/
# Consulta si la order de Culqi ya fue pagada
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estado_orden_culqi(request, order_id):
    negocio = _get_negocio(request.user)
    if not negocio or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no configurado'}, status=400)
 
    try:
        res = requests.get(
            f'{CULQI_ORDERS_URL}/{order_id}',
            headers=_headers_culqi(negocio.culqi_private_key),
            timeout=8,
        )
        data = res.json()
 
        if res.status_code != 200:
            return Response({'error': data.get('user_message', 'Error consultando orden')}, status=400)
 
        # Culqi: estado 'confirmed' = pagado
        estado_culqi = data.get('state', '')
        pagado = estado_culqi in ('confirmed', 'paid')
 
        return Response({
            'estado':       'pagado' if pagado else 'pendiente',
            'estado_culqi': estado_culqi,
        })
 
    except requests.Timeout:
        return Response({'error': 'Timeout'}, status=504)
    except Exception as e:
        logger.error(f'Culqi estado-orden excepción: {e}')
        return Response({'error': str(e)}, status=500)
 
 
# ──────────────────────────────────────────────────────────────
# POST /api/culqi/cobrar-tarjeta/
# Hace el cargo real con el token generado por Culqi.js (tarjeta)
# Body: { token, monto, orden_id }
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cobrar_tarjeta_culqi(request):
    negocio = _get_negocio(request.user)
    if not negocio or not negocio.culqi_private_key:
        return Response({'error': 'Culqi no configurado'}, status=400)
 
    token    = request.data.get('token')
    monto    = request.data.get('monto')     # centavos
    orden_id = request.data.get('orden_id')
 
    if not token or not monto:
        return Response({'error': 'token y monto son requeridos'}, status=400)
 
    payload = {
        'amount':        int(monto),
        'currency_code': 'PEN',
        'email':         f'pos@negocio{negocio.id}.com',
        'source_id':     token,
        'description':   f'Pago POS orden #{orden_id}',
        'capture':       True,   # cobro inmediato
    }
 
    try:
        res = requests.post(
            CULQI_CHARGES_URL,
            json=payload,
            headers=_headers_culqi(negocio.culqi_private_key),
            timeout=15,
        )
        data = res.json()
 
        if res.status_code not in (200, 201):
            logger.error(f'Culqi cobrar-tarjeta error: {data}')
            return Response({
                'error': data.get('user_message', 'Cargo rechazado por Culqi')
            }, status=400)
 
        return Response({
            'ok':       True,
            'cargo_id': data.get('id'),
            'estado':   data.get('outcome', {}).get('type', 'venta_exitosa'),
        })
 
    except requests.Timeout:
        return Response({'error': 'Timeout procesando tarjeta'}, status=504)
    except Exception as e:
        logger.error(f'Culqi cobrar-tarjeta excepción: {e}')
        return Response({'error': str(e)}, status=500)