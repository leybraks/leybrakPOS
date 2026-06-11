# ============================================================
# whatsapp_ticket.py
# Envío del ticket/boleta por WhatsApp al finalizar el cobro.
# El backend NO llama a Evolution directo: dispara un webhook de n8n
# (N8N_TICKET_WEBHOOK_URL) y n8n hace el envío vía Evolution API.
# Fire-and-forget: nunca rompe el flujo de cobro.
# ============================================================
import logging
from decimal import Decimal

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _normalizar_telefono(tel):
    """Deja solo dígitos y antepone 51 (Perú) si son 9 dígitos locales."""
    tel = ''.join(ch for ch in (tel or '') if ch.isdigit())
    if len(tel) == 9:
        tel = '51' + tel
    return tel


def _construir_texto_ticket(orden):
    """Recibo de consumo en texto (sin valor legal) para cuando no hay boleta."""
    negocio = orden.sede.negocio
    lineas = [f"🧾 *{negocio.nombre}*", "Comprobante de consumo", ""]
    for d in orden.detalles.all():
        if not d.activo:
            continue
        sub = Decimal(str(d.precio_unitario)) * d.cantidad
        lineas.append(f"{d.cantidad}x {d.producto.nombre}  —  S/ {sub:.2f}")
    lineas += ["", f"*Total: S/ {Decimal(str(orden.total)):.2f}*", "", "¡Gracias por tu visita! 🙌"]
    return "\n".join(lineas)


def enviar_ticket_whatsapp(orden, telefono, comprobante=None):
    """
    Despacha el ticket al webhook de n8n. Si hay `comprobante` con PDF, manda
    el documento; si no, manda el recibo de texto. Devuelve True si se despachó.
    """
    url = getattr(settings, 'N8N_TICKET_WEBHOOK_URL', '')
    if not url:
        return False

    tel = _normalizar_telefono(telefono)
    instancia = (orden.sede.whatsapp_instancia or '').strip()
    if not tel or not instancia:
        return False

    negocio = orden.sede.negocio
    payload = {
        'instancia': instancia,
        'telefono': tel,
        'negocio': negocio.nombre,
        'orden_id': orden.id,
    }
    if comprobante and comprobante.enlace_pdf:
        payload.update({
            'tipo': 'documento',
            'pdf_url': comprobante.enlace_pdf,
            'nombre_archivo': f"{comprobante.tipo}-{comprobante.serie}-{comprobante.numero}.pdf",
            'caption': f"¡Gracias por tu compra en {negocio.nombre}! Aquí está tu {comprobante.tipo}.",
        })
    else:
        payload.update({'tipo': 'texto', 'texto': _construir_texto_ticket(orden)})

    headers = {}
    token = getattr(settings, 'BOT_API_TOKEN', '') or getattr(settings, 'EVO_GLOBAL_KEY', '')
    if token:
        headers['X-Bot-Token'] = token

    try:
        requests.post(url, json=payload, headers=headers, timeout=8)
        return True
    except requests.RequestException as e:
        logger.warning('No se pudo despachar el ticket WhatsApp a n8n: %s', e)
        return False
