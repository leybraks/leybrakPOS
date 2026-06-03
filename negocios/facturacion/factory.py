"""Selecciona las credenciales de Nubefact según el entorno del negocio."""
from django.conf import settings

from .nubefact_provider import NubefactProvider


def get_provider(negocio):
    """Usa las credenciales que el negocio configuró (sea cuenta demo o producción
    de Nubefact). Si no tiene, cae a las credenciales demo del sistema (settings)."""
    ruta = negocio.facturacion_ruta or getattr(settings, 'NUBEFACT_DEMO_RUTA', '')
    token = negocio.facturacion_token or getattr(settings, 'NUBEFACT_DEMO_TOKEN', '')
    return NubefactProvider(ruta, token)
