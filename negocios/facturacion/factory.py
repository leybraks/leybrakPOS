"""Selecciona las credenciales de Nubefact según el entorno del negocio."""
from django.conf import settings

from .nubefact_provider import NubefactProvider


def get_provider(negocio):
    """Demo → credenciales compartidas de settings; Producción → las del negocio."""
    if negocio.facturacion_entorno == 'produccion':
        return NubefactProvider(negocio.facturacion_ruta, negocio.facturacion_token)
    return NubefactProvider(
        getattr(settings, 'NUBEFACT_DEMO_RUTA', ''),
        getattr(settings, 'NUBEFACT_DEMO_TOKEN', ''),
    )
