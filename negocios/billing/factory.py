"""
Selector de proveedor de cobro. Cambiar aquí para enchufar otra pasarela
o el cobro recurrente (preapproval) en el futuro.
"""
from .mercadopago_provider import MercadoPagoProvider


def get_provider():
    return MercadoPagoProvider()
