"""
Paquete de cobro de suscripción (Leybrak cobra a sus negocios cliente).

Aísla la pasarela de pago detrás de una interfaz `BillingProvider` para que
el cobro recurrente (preapproval) u otra pasarela se puedan enchufar después
sin tocar las vistas. Hoy solo existe MercadoPago Checkout Pro.
"""
from .factory import get_provider

__all__ = ['get_provider']
