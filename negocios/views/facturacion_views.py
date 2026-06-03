# ============================================================
# views/facturacion_views.py
# Emisión de comprobantes electrónicos (Boleta/Factura) a SUNAT vía Nubefact.
# Bajo demanda desde una orden PAGADA. Gate: negocio.facturacion_emision.
# ============================================================
import logging

from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..facturacion import get_provider
from ..facturacion.base import FacturacionProviderError
from ..facturacion.payload import calcular_montos, construir_payload

logger = logging.getLogger(__name__)

SERIE_DEFAULT = {'factura': 'F001', 'boleta': 'B001'}


def _serializar(comprobante):
    return {
        'id': comprobante.id,
        'tipo': comprobante.tipo,
        'serie': comprobante.serie,
        'numero': comprobante.numero,
        'estado_sunat': comprobante.estado_sunat,
        'aceptado_por_sunat': comprobante.aceptado_por_sunat,
        'enlace': comprobante.enlace,
        'enlace_pdf': comprobante.enlace_pdf,
        'total': str(comprobante.total),
        'sunat_description': comprobante.sunat_description,
        'creado_en': comprobante.creado_en.isoformat(),
    }


def _resolver_receptor(tipo, receptor):
    """Normaliza/valida los datos del receptor. Devuelve dict o (None, error)."""
    receptor = receptor or {}
    if tipo == 'factura':
        num = (receptor.get('num_doc') or '').strip()
        denom = (receptor.get('denominacion') or '').strip()
        direccion = (receptor.get('direccion') or '').strip()
        if len(num) != 11 or not num.isdigit():
            return None, 'La factura requiere un RUC válido de 11 dígitos.'
        if not denom:
            return None, 'La factura requiere la razón social del cliente.'
        return {
            'tipo_doc': '6', 'num_doc': num, 'denominacion': denom,
            'direccion': direccion, 'email': (receptor.get('email') or '').strip(),
        }, None
    # boleta
    num = (receptor.get('num_doc') or '').strip()
    denom = (receptor.get('denominacion') or '').strip()
    if num:   # boleta con DNI
        if len(num) != 8 or not num.isdigit():
            return None, 'El DNI debe tener 8 dígitos.'
        return {
            'tipo_doc': '1', 'num_doc': num,
            'denominacion': denom or 'Cliente', 'direccion': '',
            'email': (receptor.get('email') or '').strip(),
        }, None
    # boleta genérica (consumidor varios)
    return {
        'tipo_doc': '-', 'num_doc': '', 'denominacion': denom or 'Cliente varios',
        'direccion': '', 'email': (receptor.get('email') or '').strip(),
    }, None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def emitir_comprobante(request, orden_id):
    from ..models import Orden, Comprobante, SerieComprobante

    negocio = getattr(request.user, 'negocio', None)
    if negocio is None:
        return Response({'error': 'El usuario no tiene un negocio asociado.'},
                        status=status.HTTP_403_FORBIDDEN)

    # Gate del módulo
    if negocio.facturacion_emision == 'desactivado':
        return Response({'error': 'El módulo de facturación está desactivado.'},
                        status=status.HTTP_400_BAD_REQUEST)

    if not negocio.ruc or not negocio.razon_social:
        return Response({'error': 'Configura el RUC y razón social del negocio antes de emitir.'},
                        status=status.HTTP_400_BAD_REQUEST)

    orden = (Orden.objects
             .filter(id=orden_id, sede__negocio=negocio)
             .select_related('sede')
             .prefetch_related('detalles__producto')
             .first())
    if not orden:
        return Response({'error': 'Orden no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if orden.estado_pago != 'pagado':
        return Response({'error': 'La orden aún no está pagada.'}, status=status.HTTP_400_BAD_REQUEST)

    # MVP: bloquear órdenes con ajustes que descuadran línea-vs-total ante SUNAT
    if (orden.costo_envio or 0) > 0 or (orden.descuento_total or 0) > 0 or (orden.recargo_total or 0) > 0:
        return Response(
            {'error': 'Esta versión no factura órdenes con delivery, descuento o recargo.'},
            status=status.HTTP_400_BAD_REQUEST)

    # Idempotencia
    existente = Comprobante.objects.filter(orden=orden).first()
    if existente and existente.estado_sunat in ('pendiente', 'aceptado'):
        return Response(_serializar(existente), status=status.HTTP_200_OK)
    if existente:   # rechazado/anulado → re-emitir con nuevo correlativo
        existente.delete()

    tipo = request.data.get('tipo')
    if tipo not in ('boleta', 'factura'):
        return Response({'error': 'tipo debe ser "boleta" o "factura".'},
                        status=status.HTTP_400_BAD_REQUEST)

    receptor, err = _resolver_receptor(tipo, request.data.get('receptor'))
    if err:
        return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

    montos = calcular_montos(orden)
    if not montos['lineas']:
        return Response({'error': 'La orden no tiene ítems facturables.'},
                        status=status.HTTP_400_BAD_REQUEST)

    serie = (negocio.facturacion_serie_factura if tipo == 'factura'
             else negocio.facturacion_serie_boleta) or SERIE_DEFAULT[tipo]

    with transaction.atomic():
        serie_obj, _ = (SerieComprobante.objects
                        .select_for_update()
                        .get_or_create(negocio=negocio, tipo=tipo, serie=serie))
        numero = serie_obj.siguiente_numero()

        comprobante = Comprobante.objects.create(
            negocio=negocio, sede=orden.sede, orden=orden,
            tipo=tipo, serie=serie, numero=numero,
            fecha_emision=timezone.localdate(), moneda='PEN',
            emisor_ruc=negocio.ruc, emisor_razon_social=negocio.razon_social,
            receptor_tipo_doc=receptor['tipo_doc'], receptor_num_doc=receptor['num_doc'],
            receptor_denominacion=receptor['denominacion'],
            receptor_direccion=receptor['direccion'], receptor_email=receptor['email'],
            total_gravada=montos['total_gravada'], total_igv=montos['total_igv'], total=montos['total'],
            estado_sunat='pendiente',
        )
        payload = construir_payload(comprobante, montos)
        comprobante.payload_enviado = payload
        comprobante.save(update_fields=['payload_enviado'])

    # Llamada al PSE/OSE (fuera de la transacción de la BD)
    try:
        res = get_provider(negocio).emitir(payload)
    except FacturacionProviderError as e:
        comprobante.estado_sunat = 'rechazado'
        comprobante.sunat_description = str(e)
        comprobante.save(update_fields=['estado_sunat', 'sunat_description'])
        logger.error('Facturación: fallo del proveedor: %s', e)
        return Response({'error': str(e), 'comprobante': _serializar(comprobante)},
                        status=status.HTTP_502_BAD_GATEWAY)

    comprobante.estado_sunat = res['estado_sunat']
    comprobante.aceptado_por_sunat = res['aceptado']
    comprobante.enlace = res['enlace']
    comprobante.enlace_pdf = res['enlace_pdf']
    comprobante.codigo_hash = res['codigo_hash']
    comprobante.sunat_description = res['sunat_description']
    comprobante.respuesta = res['raw']
    comprobante.save()

    if not res['aceptado']:
        return Response({'error': res['sunat_description'] or 'SUNAT rechazó el comprobante.',
                         'comprobante': _serializar(comprobante)},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response(_serializar(comprobante), status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_comprobante(request, orden_id):
    from ..models import Comprobante

    negocio = getattr(request.user, 'negocio', None)
    if negocio is None:
        return Response({'error': 'Sin negocio.'}, status=status.HTTP_403_FORBIDDEN)

    comp = Comprobante.objects.filter(orden_id=orden_id, negocio=negocio).first()
    if not comp:
        return Response({'comprobante': None}, status=status.HTTP_200_OK)
    return Response(_serializar(comp), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_comprobantes(request):
    """Historial de comprobantes del negocio (los más recientes primero)."""
    from ..models import Comprobante

    negocio = getattr(request.user, 'negocio', None)
    if negocio is None:
        return Response({'error': 'Sin negocio.'}, status=status.HTTP_403_FORBIDDEN)

    qs = Comprobante.objects.filter(negocio=negocio)
    tipo = request.query_params.get('tipo')
    estado = request.query_params.get('estado')
    if tipo:
        qs = qs.filter(tipo=tipo)
    if estado:
        qs = qs.filter(estado_sunat=estado)

    comprobantes = [
        {**_serializar(c),
         'receptor_denominacion': c.receptor_denominacion,
         'receptor_num_doc': c.receptor_num_doc}
        for c in qs[:200]
    ]
    return Response({'comprobantes': comprobantes}, status=status.HTTP_200_OK)
