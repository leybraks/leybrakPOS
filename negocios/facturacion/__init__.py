"""
Paquete de facturación electrónica (SUNAT vía PSE/OSE).

Aísla la pasarela (Nubefact) detrás de una interfaz `FacturacionProvider`,
igual que `negocios/billing/` para los pagos. `get_provider(negocio)` elige
las credenciales (demo vs producción) según la config del negocio.
"""
from .factory import get_provider

__all__ = ['get_provider']
