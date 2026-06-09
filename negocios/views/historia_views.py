# ============================================================
# views/historia_views.py
# Historias (estados de WhatsApp) programadas.
#
# Flujo: el dueño programa la historia desde la web (imagen + texto + fecha).
# Un cron de n8n llama cada pocos minutos a /api/bot/historias-pendientes/,
# publica cada una vía Evolution API (sendStatus) con la instancia de la sede
# y reporta el resultado en /api/bot/historias-marcar/.
#
# Los endpoints del bot son AllowAny pero exigen el token compartido
# (settings.BOT_API_TOKEN, con fallback a EVO_GLOBAL_KEY) en el header
# X-Bot-Token — misma convención que el resto de vistas externas.
# ============================================================
import logging

from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import HistoriaProgramada, Sede

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────

def _get_negocio(request):
    try:
        return request.user.negocio
    except Exception:
        return None


def _serializar(h, request=None):
    imagen_url = ''
    if h.imagen:
        base = getattr(settings, 'BACKEND_URL', '') or ''
        if base:
            imagen_url = base.rstrip('/') + h.imagen.url
        elif request is not None:
            imagen_url = request.build_absolute_uri(h.imagen.url)
        else:
            imagen_url = h.imagen.url
    return {
        'id': h.id,
        'sede': h.sede_id,
        'sede_nombre': h.sede.nombre,
        'imagen': imagen_url,
        'texto': h.texto,
        'fecha_programada': h.fecha_programada.isoformat(),
        'estado': h.estado,
        'publicada_en': h.publicada_en.isoformat() if h.publicada_en else None,
        'error_msg': h.error_msg,
        'creado_en': h.creado_en.isoformat(),
    }


def _token_bot_valido(request):
    """Valida el token compartido del cron de n8n (header X-Bot-Token)."""
    esperado = getattr(settings, 'BOT_API_TOKEN', '') or getattr(settings, 'EVO_GLOBAL_KEY', '')
    if not esperado:
        return False    # sin token configurado no se expone nada
    recibido = request.headers.get('X-Bot-Token', '') or request.query_params.get('token', '')
    return recibido == esperado


# ─── Endpoints para la web (auth del dueño) ──────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def historias(request):
    """GET: lista las historias del negocio. POST: programa una nueva (multipart)."""
    negocio = _get_negocio(request)
    if negocio is None:
        return Response({'error': 'Sin negocio asociado.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        qs = HistoriaProgramada.objects.filter(sede__negocio=negocio).select_related('sede')[:100]
        return Response({'historias': [_serializar(h, request) for h in qs]})

    # POST — crear
    sede_id = request.data.get('sede')
    imagen = request.FILES.get('imagen')
    texto = (request.data.get('texto') or '').strip()
    fecha_raw = request.data.get('fecha_programada')

    if not (sede_id and imagen and fecha_raw):
        return Response({'error': 'Faltan datos: sede, imagen y fecha_programada son obligatorios.'},
                        status=status.HTTP_400_BAD_REQUEST)

    sede = Sede.objects.filter(id=sede_id, negocio=negocio).first()
    if not sede:
        return Response({'error': 'La sede no pertenece a tu negocio.'}, status=status.HTTP_400_BAD_REQUEST)
    if not sede.whatsapp_instancia:
        return Response({'error': 'Esa sede no tiene WhatsApp conectado. Conéctalo primero.'},
                        status=status.HTTP_400_BAD_REQUEST)

    from django.utils.dateparse import parse_datetime
    fecha = parse_datetime(fecha_raw)
    if fecha is None:
        return Response({'error': 'Fecha inválida.'}, status=status.HTTP_400_BAD_REQUEST)
    if timezone.is_naive(fecha):
        fecha = timezone.make_aware(fecha)
    if fecha < timezone.now() - timezone.timedelta(minutes=5):
        return Response({'error': 'La fecha programada ya pasó.'}, status=status.HTTP_400_BAD_REQUEST)

    h = HistoriaProgramada.objects.create(
        sede=sede, imagen=imagen, texto=texto, fecha_programada=fecha,
    )
    return Response(_serializar(h, request), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancelar_historia(request, historia_id):
    """Cancela una historia pendiente (no se borra, queda el registro)."""
    negocio = _get_negocio(request)
    if negocio is None:
        return Response({'error': 'Sin negocio asociado.'}, status=status.HTTP_403_FORBIDDEN)

    h = HistoriaProgramada.objects.filter(id=historia_id, sede__negocio=negocio).first()
    if not h:
        return Response({'error': 'Historia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    if h.estado != 'pendiente':
        return Response({'error': f'Solo se cancelan pendientes (está {h.estado}).'},
                        status=status.HTTP_400_BAD_REQUEST)

    h.estado = 'cancelada'
    h.save(update_fields=['estado'])
    return Response(_serializar(h, request))


# ─── Endpoints para el cron de n8n (token compartido) ────────

@api_view(['GET'])
@permission_classes([AllowAny])
def historias_pendientes_bot(request):
    """
    Devuelve las historias pendientes cuya hora ya llegó, con todo lo que n8n
    necesita para publicarlas (instancia + URL absoluta de la imagen + caption).
    Las de sedes sin instancia conectada se marcan como error.
    """
    if not _token_bot_valido(request):
        return Response({'error': 'Token inválido.'}, status=status.HTTP_403_FORBIDDEN)

    ahora = timezone.now()
    qs = (HistoriaProgramada.objects
          .filter(estado='pendiente', fecha_programada__lte=ahora)
          .select_related('sede')[:20])

    listas, sin_instancia = [], []
    for h in qs:
        if not h.sede.whatsapp_instancia:
            sin_instancia.append(h)
            continue
        data = _serializar(h, request)
        data['instancia'] = h.sede.whatsapp_instancia
        listas.append(data)

    for h in sin_instancia:
        h.estado = 'error'
        h.error_msg = 'La sede no tiene WhatsApp conectado.'
        h.save(update_fields=['estado', 'error_msg'])

    return Response({'historias': listas})


@api_view(['POST'])
@permission_classes([AllowAny])
def marcar_historia_bot(request):
    """n8n reporta el resultado de publicar: {id, resultado: 'publicada'|'error', error?}."""
    if not _token_bot_valido(request):
        return Response({'error': 'Token inválido.'}, status=status.HTTP_403_FORBIDDEN)

    historia_id = request.data.get('id')
    resultado = request.data.get('resultado')
    if resultado not in ('publicada', 'error'):
        return Response({'error': "resultado debe ser 'publicada' o 'error'."},
                        status=status.HTTP_400_BAD_REQUEST)

    h = HistoriaProgramada.objects.filter(id=historia_id).first()
    if not h:
        return Response({'error': 'Historia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    h.estado = resultado
    if resultado == 'publicada':
        h.publicada_en = timezone.now()
        h.save(update_fields=['estado', 'publicada_en'])
    else:
        h.error_msg = str(request.data.get('error') or 'Error al publicar.')[:1000]
        h.save(update_fields=['estado', 'error_msg'])

    return Response({'ok': True, 'estado': h.estado})
