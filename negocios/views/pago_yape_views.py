# ============================================================
# views/pago_yape_views.py
# ============================================================

import re
from decimal import Decimal

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


# ============================================================
# HELPERS DE PARSEO (Regex validados con pruebas reales)
# ============================================================

def _parsear_notificacion(texto: str) -> dict | None:
    """
    Parsea el texto crudo de la notificación push de Yape.
    Retorna un dict con los datos extraídos, o None si el texto no es válido.

    Formatos reales confirmados:
      YAPE: "Marco Per* te envió un pago por S/ 0.1. El cód. de seguridad es: 622"
      PLIN: "Yape! MARCO PEREZ te envió un pago por S/ 1"
    """
    if not texto:
        return None

    # --- Detectar tipo ---
    es_plin = 'cód. de seguridad' not in texto

    # --- Extraer monto ---
    match_monto = re.search(r'S/\s*([0-9]+(?:\.[0-9]+)?)', texto)
    if not match_monto:
        return None
    monto = Decimal(match_monto.group(1))

    # --- Extraer nombre ---
    if es_plin:
        # "Yape! MARCO PEREZ te envió"
        match_nombre = re.search(r'Yape!\s+(.*?)\s+te\s+envió', texto)
    else:
        # "Marco Per* te envió"
        match_nombre = re.search(r'^(.*?)\s+te\s+envió', texto)

    nombre = match_nombre.group(1).strip() if match_nombre else 'Desconocido'

    # --- Extraer código (solo Yape) ---
    codigo = None
    if not es_plin:
        match_codigo = re.search(r'seguridad\s+es:\s*(\d{3})', texto)
        codigo = match_codigo.group(1) if match_codigo else None

    return {
        'tipo':             'PLIN' if es_plin else 'YAPE',
        'monto':            monto,
        'nombre_cliente':   nombre,
        'codigo_seguridad': codigo,
    }


def _normalizar_nombre(texto: str) -> str:
    """Limpia un nombre para comparación: minúsculas, sin asterisco, sin espacios extra."""
    if not texto:
        return ''
    return ' '.join(texto.lower().replace('*', '').split())


def _nombres_coinciden(nombre_pos: str, nombre_notificacion: str) -> bool:
    """
    Doble coincidencia de nombres para el match automático.
    Cubre: nombre completo, nombre parcial (3 letras Yape), solo primer nombre.
    """
    pos  = _normalizar_nombre(nombre_pos)
    noti = _normalizar_nombre(nombre_notificacion)

    if not pos or not noti:
        return False

    # Coincidencia directa o contenida (cubre "marco per" dentro de "marco perez")
    if noti in pos or pos in noti:
        return True

    # Fallback: solo primer nombre
    if pos.split()[0] == noti.split()[0]:
        return True

    return False


# ============================================================
# ENDPOINT: La app Android hace POST aquí
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])  # La seguridad la hacemos con device_token
def recibir_notificacion_yape(request):
    """
    Recibe la notificación push capturada por la app Android del negocio.
    Autentica con device_token, parsea el texto, guarda en BD y dispara WebSocket.

    Body esperado:
    {
        "device_token": "abc123...",
        "texto_notificacion": "Marco Per* te envió un pago por S/ 25.0. El cód. de seguridad es: 847"
    }
    """
    from ..models import Negocio, NotificacionPago

    device_token       = request.data.get('device_token')
    texto_notificacion = request.data.get('texto_notificacion')

    # --- Validar campos mínimos ---
    if not device_token or not texto_notificacion:
        return Response(
            {'error': 'device_token y texto_notificacion son requeridos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # --- Autenticar el negocio por su token ---
    negocio = Negocio.objects.filter(device_token=device_token, activo=True).first()
    if not negocio:
        return Response(
            {'error': 'Token inválido.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # --- Parsear el texto de la notificación ---
    datos = _parsear_notificacion(texto_notificacion)
    if not datos:
        return Response(
            {'error': 'No se pudo parsear el texto de la notificación.'},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # --- Guardar en la base de datos ---
    notificacion = NotificacionPago.objects.create(
        negocio          = negocio,
        tipo             = datos['tipo'],
        monto            = datos['monto'],
        codigo_seguridad = datos['codigo_seguridad'],
        nombre_cliente   = datos['nombre_cliente'],
    )

    # --- Disparar el WebSocket al grupo del negocio ---
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"pagos_negocio_{negocio.id}",
        {
            'type':             'pago.recibido',   # → llama a pago_recibido() en el consumer
            'notificacion_id':  notificacion.id,
            'tipo':             notificacion.tipo,
            'monto':            str(notificacion.monto),
            'codigo_seguridad': notificacion.codigo_seguridad,
            'nombre_cliente':   notificacion.nombre_cliente,
        }
    )

    return Response({'ok': True, 'notificacion_id': notificacion.id}, status=status.HTTP_201_CREATED)


# ============================================================
# ENDPOINT: El cajero confirma el pago con un clic
# ============================================================

@api_view(['POST'])
def confirmar_pago_yape(request):
    """
    El cajero hizo clic en el botón de la pantalla del POS.
    Asocia la NotificacionPago a la Orden y crea el registro de Pago.

    Body esperado:
    {
        "notificacion_id": 42,
        "orden_id": 187
    }
    """
    from ..models import NotificacionPago, Orden, Pago, SesionCaja

    notificacion_id = request.data.get('notificacion_id')
    orden_id        = request.data.get('orden_id')

    if not notificacion_id or not orden_id:
        return Response(
            {'error': 'notificacion_id y orden_id son requeridos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # --- Validar que la notificación existe y aún es válida (5 min, no usada) ---
    notificacion = NotificacionPago.objects.filter(id=notificacion_id).first()
    if not notificacion:
        return Response({'error': 'Notificación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if not notificacion.es_valida:
        return Response(
            {'error': 'Esta notificación ya fue usada o expiró (5 minutos).'},
            status=status.HTTP_409_CONFLICT
        )

    # --- Validar que la orden existe y pertenece al mismo negocio ---
    orden = Orden.objects.filter(
        id=orden_id,
        sede__negocio=notificacion.negocio
    ).first()
    if not orden:
        return Response({'error': 'Orden no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if orden.estado_pago == 'pagado':
        return Response({'error': 'Esta orden ya fue pagada.'}, status=status.HTTP_409_CONFLICT)

    # --- Obtener la sesión de caja activa ---
    sesion_caja = SesionCaja.objects.filter(
        sede=orden.sede,
        estado='abierta'
    ).first()

    # --- Crear el Pago y marcar la notificación como usada ---
    metodo = 'yape' if notificacion.tipo == 'YAPE' else 'plin'

    Pago.objects.create(
        orden               = orden,
        metodo              = metodo,
        monto               = notificacion.monto,
        sesion_caja         = sesion_caja,
        estado              = 'confirmado',
        notificacion_origen = notificacion,
    )

    notificacion.usado = True
    notificacion.save(update_fields=['usado'])

    orden.estado_pago = 'pagado'
    orden.save(update_fields=['estado_pago'])

    return Response({'ok': True, 'orden_id': orden.id}, status=status.HTTP_200_OK)