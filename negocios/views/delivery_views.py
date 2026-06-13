# ============================================================
# views/delivery_views.py
# Fase 1 — App del repartidor. El repartidor (Empleado con rol.puede_repartir)
# ve los pedidos de delivery de su sede, toma uno, navega (lat/lng) y marca el
# avance: asignado → en_camino → entregado. Sin tracking GPS en vivo (eso es Fase 2).
# ============================================================
import logging

from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .helpers import get_empleado_verificado, es_valor_nulo

logger = logging.getLogger(__name__)


def _serializar_pedido(orden):
    sede = orden.sede
    return {
        'id': orden.id,
        'cliente_nombre': orden.cliente_nombre or 'Cliente',
        'cliente_telefono': orden.cliente_telefono or '',
        'direccion': orden.direccion_entrega or '',
        'latitud':  float(orden.latitud)  if orden.latitud  is not None else None,
        'longitud': float(orden.longitud) if orden.longitud is not None else None,
        'total': float(orden.total),
        'costo_envio': float(orden.costo_envio or 0),
        'metodo_pago_esperado': orden.metodo_pago_esperado or '',
        'estado_pago': orden.estado_pago,            # pagado / pendiente (cobra al entregar)
        'estado_cocina': orden.estado,               # preparando / listo …
        'estado_delivery': orden.estado_delivery,    # pendiente / asignado / en_camino / entregado
        'repartidor_id': orden.repartidor_id,
        'repartidor_nombre': orden.repartidor.nombre if orden.repartidor else None,
        'sede_nombre': sede.nombre,
        'sede_lat': float(sede.latitud)  if sede.latitud  is not None else None,
        'sede_lng': float(sede.longitud) if sede.longitud is not None else None,
        'items': [
            {'cantidad': d.cantidad, 'nombre': d.producto.nombre}
            for d in orden.detalles.all() if d.activo
        ],
        'creado_en': orden.creado_en.isoformat(),
    }


def _repartidor_de(request):
    """Devuelve el Empleado-repartidor del header (validado contra el negocio del JWT)."""
    empleado = get_empleado_verificado(request)
    if empleado and empleado.rol and empleado.rol.puede_repartir:
        return empleado
    return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pedidos_delivery(request):
    """
    Lista los pedidos de delivery relevantes para el repartidor:
    los DISPONIBLES (sin asignar) de su sede + los que ÉL ya tomó (no entregados).
    """
    from ..models import Orden

    negocio = getattr(request.user, 'negocio', None)
    if negocio is None:
        return Response({'error': 'Sin negocio.'}, status=status.HTTP_403_FORBIDDEN)

    empleado = get_empleado_verificado(request)
    qs = (Orden.objects
          .filter(sede__negocio=negocio, tipo='delivery')
          .exclude(estado='cancelado')
          .exclude(estado_delivery='entregado')
          .select_related('sede', 'repartidor')
          .prefetch_related('detalles__producto'))

    # Filtra por la sede del repartidor (o por sede_id si lo mandan).
    sede_id = empleado.sede_id if empleado else request.query_params.get('sede_id')
    if not es_valor_nulo(sede_id):
        qs = qs.filter(sede_id=sede_id)

    # Disponibles (sin asignar) + los míos.
    if empleado:
        qs = qs.filter(Q(estado_delivery='pendiente') | Q(repartidor=empleado))
    else:
        qs = qs.filter(estado_delivery='pendiente')

    qs = qs.order_by('estado_delivery', 'creado_en')
    return Response({'pedidos': [_serializar_pedido(o) for o in qs]})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tomar_pedido(request, orden_id):
    """El repartidor toma un pedido disponible → estado_delivery='asignado'."""
    from ..models import Orden

    negocio = getattr(request.user, 'negocio', None)
    repartidor = _repartidor_de(request)
    if repartidor is None:
        return Response({'error': 'Solo un repartidor puede tomar pedidos.'},
                        status=status.HTTP_403_FORBIDDEN)

    orden = Orden.objects.filter(id=orden_id, sede__negocio=negocio, tipo='delivery').first()
    if not orden:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if orden.repartidor_id and orden.repartidor_id != repartidor.id:
        return Response({'error': 'Ese pedido ya lo tomó otro repartidor.'},
                        status=status.HTTP_409_CONFLICT)

    orden.repartidor = repartidor
    orden.estado_delivery = 'asignado'
    orden.save(update_fields=['repartidor', 'estado_delivery'])
    return Response(_serializar_pedido(orden), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def actualizar_estado_delivery(request, orden_id):
    """
    Avanza el estado del reparto: 'en_camino' o 'entregado'.
    Solo el repartidor asignado puede hacerlo. Al 'entregado' la orden se completa.
    """
    from ..models import Orden

    negocio = getattr(request.user, 'negocio', None)
    repartidor = _repartidor_de(request)
    if repartidor is None:
        return Response({'error': 'Solo un repartidor puede actualizar el reparto.'},
                        status=status.HTTP_403_FORBIDDEN)

    nuevo = (request.data.get('estado') or '').strip()
    if nuevo not in ('en_camino', 'entregado'):
        return Response({'error': "estado debe ser 'en_camino' o 'entregado'."},
                        status=status.HTTP_400_BAD_REQUEST)

    orden = Orden.objects.filter(id=orden_id, sede__negocio=negocio, tipo='delivery').first()
    if not orden:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if orden.repartidor_id != repartidor.id:
        return Response({'error': 'No sos el repartidor asignado a este pedido.'},
                        status=status.HTTP_403_FORBIDDEN)

    orden.estado_delivery = nuevo
    campos = ['estado_delivery']
    if nuevo == 'entregado' and orden.estado != 'cancelado':
        orden.estado = 'completado'   # cocina: entregado
        campos.append('estado')
    orden.save(update_fields=campos)

    # Al iniciar la ruta avisamos solos al cliente por WhatsApp (vía n8n → Evolution).
    if nuevo == 'en_camino' and orden.cliente_telefono:
        from ..whatsapp_ticket import enviar_mensaje_whatsapp
        texto = (f"🛵 ¡Tu pedido de *{orden.sede.negocio.nombre}* ya va en camino! "
                 f"El repartidor está saliendo hacia tu dirección.")
        enviar_mensaje_whatsapp(orden, orden.cliente_telefono, texto)

    return Response(_serializar_pedido(orden), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def avisar_cliente(request, orden_id):
    """El repartidor manda un WhatsApp al cliente desde la app (mensaje libre/preset)."""
    from ..models import Orden
    from ..whatsapp_ticket import enviar_mensaje_whatsapp

    negocio = getattr(request.user, 'negocio', None)
    repartidor = _repartidor_de(request)
    if repartidor is None:
        return Response({'error': 'Solo un repartidor puede avisar al cliente.'},
                        status=status.HTTP_403_FORBIDDEN)

    orden = (Orden.objects
             .filter(id=orden_id, sede__negocio=negocio, tipo='delivery')
             .select_related('sede', 'sede__negocio').first())
    if not orden:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if not orden.cliente_telefono:
        return Response({'error': 'El pedido no tiene teléfono del cliente.'},
                        status=status.HTTP_400_BAD_REQUEST)

    mensaje = (request.data.get('mensaje') or '').strip()[:500]
    if not mensaje:
        return Response({'error': 'Mensaje vacío.'}, status=status.HTTP_400_BAD_REQUEST)

    enviado = enviar_mensaje_whatsapp(orden, orden.cliente_telefono, mensaje)
    return Response({'enviado': enviado}, status=status.HTTP_200_OK)
