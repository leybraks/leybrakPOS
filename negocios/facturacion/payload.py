"""
Cálculo de montos (IGV) y construcción del payload JSON para Nubefact.

Los precios del POS YA incluyen IGV (estándar Perú). Por línea se extrae el IGV
(18%), se redondea a 2 decimales y luego se suman las líneas ya redondeadas
(estrategia que SUNAT tolera sin observaciones de descuadre).
"""
from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal('0.01')
IGV_FACTOR = Decimal('1.18')
PORCENTAJE_IGV = 18.00


def _q(valor):
    return Decimal(valor).quantize(CENT, rounding=ROUND_HALF_UP)


def calcular_montos(orden):
    """
    A partir de los detalles activos devuelve:
        { 'lineas': [...], 'total_gravada', 'total_igv', 'total' }   (Decimals)
    """
    lineas = []
    total_gravada = Decimal('0')
    total_igv = Decimal('0')
    total = Decimal('0')

    for d in orden.detalles.all():
        if not d.activo:
            continue
        precio_con_igv = Decimal(str(d.precio_unitario))
        cantidad = Decimal(str(d.cantidad))

        valor_unitario = _q(precio_con_igv / IGV_FACTOR)   # sin IGV
        linea_total    = _q(precio_con_igv * cantidad)     # con IGV
        linea_gravada  = _q(linea_total / IGV_FACTOR)
        linea_igv      = _q(linea_total - linea_gravada)

        lineas.append({
            'unidad_de_medida': 'NIU',
            'codigo': str(d.producto_id),
            'descripcion': d.producto.nombre,
            'cantidad': float(cantidad),
            'valor_unitario': float(valor_unitario),
            'precio_unitario': float(precio_con_igv),
            'tipo_de_igv': 1,            # 1 = Gravado - Operación Onerosa
            'igv': float(linea_igv),
            'total': float(linea_total),
        })
        total_gravada += linea_gravada
        total_igv += linea_igv
        total += linea_total

    return {
        'lineas': lineas,
        'total_gravada': _q(total_gravada),
        'total_igv': _q(total_igv),
        'total': _q(total),
    }


def construir_payload(comprobante, montos):
    """Arma el JSON que Nubefact espera (operacion=generar_comprobante)."""
    tipo_num = 1 if comprobante.tipo == 'factura' else 2   # 1=Factura, 2=Boleta
    return {
        'operacion': 'generar_comprobante',
        'tipo_de_comprobante': tipo_num,
        'serie': comprobante.serie,
        'numero': comprobante.numero,
        'sunat_transaction': 1,           # 1 = Venta interna
        'cliente_tipo_de_documento': comprobante.receptor_tipo_doc,   # '6'/'1'/'-'
        # Nubefact exige un número no vacío incluso para boletas "varios" → '0'.
        'cliente_numero_de_documento': comprobante.receptor_num_doc or '0',
        'cliente_denominacion': comprobante.receptor_denominacion,
        'cliente_direccion': comprobante.receptor_direccion or '',
        'cliente_email': comprobante.receptor_email or '',
        'fecha_de_emision': comprobante.fecha_emision.strftime('%d-%m-%Y'),
        'moneda': 1,                      # 1 = Soles (PEN)
        'porcentaje_de_igv': PORCENTAJE_IGV,
        'total_gravada': float(montos['total_gravada']),
        'total_igv': float(montos['total_igv']),
        'total': float(montos['total']),
        'enviar_automaticamente_a_la_sunat': True,
        'enviar_automaticamente_al_cliente': False,
        'items': montos['lineas'],
    }
