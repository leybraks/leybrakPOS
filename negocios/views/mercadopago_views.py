import logging
import requests
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Pago, Orden

logger = logging.getLogger(__name__)

def _get_negocio(user):
    try:
        return user.negocio
    except Exception:
        return None

def _get_sesion_caja_activa(negocio):
    from ..models import SesionCaja
    # Cruzando por sede, como lo arreglamos antes
    return SesionCaja.objects.filter(sede__negocio=negocio, estado='abierta').first()

def _monto_restante(orden):
    """Calcula cuánto falta pagar de una Orden."""
    pagado = sum(
        p.monto for p in orden.pagos.filter(estado__in=['confirmado', 'manual'])
    )
    return orden.total - pagado


# ──────────────────────────────────────────────────────────────
# POST /api/pagos/generar-qr/
# Crea la orden en Mercado Pago y devuelve el string del QR
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_qr_mercadopago(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)
    
    # Validamos que tengan las credenciales de MP
    if not negocio.usa_mercado_pago or not negocio.mp_access_token or not negocio.mp_user_id:
        return Response({'error': 'Mercado Pago no está configurado en este negocio'}, status=400)

    orden_id = request.data.get('orden_id')
    metodo = request.data.get('metodo', 'yape') # Recibimos si el usuario eligió yape o plin
    
    try:
        orden = Orden.objects.get(id=orden_id, sede__negocio=negocio)
    except Orden.DoesNotExist:
        return Response({'error': 'Orden no encontrada'}, status=404)

    monto_restante = _monto_restante(orden)
    if monto_restante <= 0:
        return Response({'error': 'Esta orden ya está pagada'}, status=400)

    # Identificador único para Mercado Pago
    referencia_externa = f"POS-{orden.id}-{negocio.id}"
    caja_id = f"CAJA-{negocio.id}"

    # Endpoint de Mercado Pago Instore API
    url = f"https://api.mercadopago.com/instore/orders/qr/seller/collectors/{negocio.mp_user_id}/pos/{caja_id}/qrs"
    
    headers = {
        "Authorization": f"Bearer {negocio.mp_access_token}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "external_reference": referencia_externa,
        "title": f"Consumo en {negocio.nombre}",
        "description": "Pago desde Leybrak POS",
        "total_amount": float(monto_restante), # MP sí acepta decimales
        "items": [
            {
                "sku_number": f"ORD-{orden.id}",
                "category": "services",
                "title": "Total del consumo",
                "description": "Consumo de alimentos y bebidas",
                "unit_price": float(monto_restante),
                "quantity": 1,
                "unit_measure": "unit",
                "total_amount": float(monto_restante)
            }
        ],
        "cash_out": {
            "amount": 0
        }
    }

    try:
        res = requests.put(url, json=payload, headers=headers, timeout=10) # MP Instore usa PUT a veces para actualizar el QR de la caja
        if res.status_code == 405: 
            # Si PUT falla, hacemos fallback a POST
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            
        data = res.json()
    except requests.Timeout:
        return Response({'error': 'Timeout conectando con Mercado Pago'}, status=504)
    except Exception as e:
        logger.error(f'MP generar-qr: {e}')
        return Response({'error': str(e)}, status=500)

    if res.status_code not in (200, 201):
        logger.error(f'Error MP {res.status_code}: {data}')
        # MP manda el detalle del error en un array llamado "message" o "cause"
        mensaje_error = data.get('message', 'Revisa la terminal para ver el error exacto')
        return Response({'error': f'Error de MP: {mensaje_error}'}, status=400)

    # ¡LA MAGIA OCURRE AQUÍ! Extraemos el string EMVCo
    qr_data = data.get('qr_data')

    sesion = _get_sesion_caja_activa(negocio)
    
    # Creamos el pago en la BD en estado pendiente
    pago, _ = Pago.objects.get_or_create(
        mp_order_id=referencia_externa,
        defaults={
            'orden':       orden,
            'metodo':      metodo,
            'monto':       monto_restante,
            'sesion_caja': sesion,
            'estado':      'pendiente',
        }
    )

    return Response({
        'pago_id': pago.id,
        'qr_data': qr_data, # Esto es lo que React usará para dibujar el QR
        'monto':   float(monto_restante),
    })