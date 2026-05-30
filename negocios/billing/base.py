"""
Interfaz abstracta de proveedor de cobro de suscripción.
"""
from abc import ABC, abstractmethod


class BillingProviderError(Exception):
    """Error al comunicarse con la pasarela de pago."""


class BillingProvider(ABC):

    @abstractmethod
    def create_subscription_checkout(self, *, negocio, plan, periodo, external_reference, monto):
        """
        Crea un checkout de pago único para una mensualidad y devuelve:
            {
              'preference_id':       str,
              'init_point':          str,   # URL a la que se redirige al pagador
              'sandbox_init_point':  str,
            }
        """
        raise NotImplementedError

    @abstractmethod
    def get_payment(self, payment_id):
        """
        Consulta a la pasarela el detalle del pago. Devuelve el dict crudo
        (debe incluir al menos: status, transaction_amount, external_reference,
        payment_type_id).
        """
        raise NotImplementedError

    @abstractmethod
    def verify_webhook_signature(self, *, headers, query_params):
        """
        Valida la autenticidad de un webhook entrante. Devuelve True/False.
        """
        raise NotImplementedError
