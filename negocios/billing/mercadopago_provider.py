"""
Proveedor de cobro: MercadoPago Checkout Pro (pago único por mensualidad).

Usa la cuenta única de Leybrak (credenciales desde settings/env), NO OAuth por
negocio. Implementado con `requests` para mantener el patrón de
negocios/views/negocio_views.py (timeout, except requests.Timeout, logger).
"""
import hashlib
import hmac
import logging
import time

import requests
from django.conf import settings

from .base import BillingProvider, BillingProviderError

logger = logging.getLogger(__name__)

MP_API_BASE = 'https://api.mercadopago.com'
TIMEOUT = 10
# Tolerancia anti-replay para el timestamp de la firma del webhook (segundos)
SIGNATURE_MAX_AGE = 300


class MercadoPagoProvider(BillingProvider):

    def __init__(self):
        self.access_token = settings.MP_ACCESS_TOKEN
        self.webhook_secret = settings.MP_WEBHOOK_SECRET
        self.sandbox = settings.MP_SANDBOX

    @property
    def _headers(self):
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }

    # ──────────────────────────────────────────────────────────────
    # Crear preferencia (Checkout Pro)
    # ──────────────────────────────────────────────────────────────
    def create_subscription_checkout(self, *, negocio, plan, periodo, external_reference, monto):
        if not self.access_token:
            raise BillingProviderError('MP_ACCESS_TOKEN no está configurado.')

        body = {
            'items': [{
                'title': f'Suscripción {plan.nombre} - Leybrak',
                'quantity': 1,
                'unit_price': float(monto),
                'currency_id': 'PEN',
            }],
            'external_reference': external_reference,
            'notification_url': f'{settings.BACKEND_URL}/api/negocio/suscripcion/webhook/',
            'back_urls': {
                'success': f'{settings.FRONTEND_URL}/?status=success',
                'failure': f'{settings.FRONTEND_URL}/?status=failure',
                'pending': f'{settings.FRONTEND_URL}/?status=pending',
            },
            'auto_return': 'approved',
            'metadata': {
                'negocio_id': negocio.id,
                'plan_id': plan.id,
                'periodo': periodo,
            },
        }
        headers = {**self._headers, 'X-Idempotency-Key': external_reference}

        try:
            resp = requests.post(
                f'{MP_API_BASE}/checkout/preferences',
                json=body, headers=headers, timeout=TIMEOUT,
            )
        except requests.Timeout:
            logger.error('MP: timeout creando preferencia para %s', external_reference)
            raise BillingProviderError('Timeout al contactar MercadoPago.')
        except requests.RequestException as e:
            logger.error('MP: error de red creando preferencia: %s', e)
            raise BillingProviderError('Error de red con MercadoPago.')

        if resp.status_code not in (200, 201):
            logger.error('MP: preferencia rechazada (%s): %s', resp.status_code, resp.text)
            raise BillingProviderError('MercadoPago rechazó la creación del pago.')

        data = resp.json()
        return {
            'preference_id': data.get('id'),
            'init_point': data.get('init_point'),
            'sandbox_init_point': data.get('sandbox_init_point'),
        }

    # ──────────────────────────────────────────────────────────────
    # Consultar pago
    # ──────────────────────────────────────────────────────────────
    def get_payment(self, payment_id):
        try:
            resp = requests.get(
                f'{MP_API_BASE}/v1/payments/{payment_id}',
                headers=self._headers, timeout=TIMEOUT,
            )
        except requests.Timeout:
            logger.error('MP: timeout consultando pago %s', payment_id)
            raise BillingProviderError('Timeout al consultar el pago en MercadoPago.')
        except requests.RequestException as e:
            logger.error('MP: error de red consultando pago %s: %s', payment_id, e)
            raise BillingProviderError('Error de red con MercadoPago.')

        if resp.status_code != 200:
            logger.error('MP: pago %s no encontrado (%s): %s', payment_id, resp.status_code, resp.text)
            raise BillingProviderError('No se pudo consultar el pago en MercadoPago.')

        return resp.json()

    # ──────────────────────────────────────────────────────────────
    # Validar firma del webhook
    # ──────────────────────────────────────────────────────────────
    def verify_webhook_signature(self, *, headers, query_params):
        """
        Header x-signature: 'ts=<segundos>,v1=<hmac_hex>'.
        Manifest: 'id:{data.id};request-id:{x-request-id};ts:{ts};'
        (se omite el segmento cuyo valor falte).
        """
        if not self.webhook_secret:
            logger.warning('MP: MP_WEBHOOK_SECRET no configurado; rechazando webhook.')
            return False

        signature = headers.get('x-signature') or headers.get('X-Signature')
        request_id = headers.get('x-request-id') or headers.get('X-Request-Id')
        if not signature:
            return False

        ts = None
        v1 = None
        for part in signature.split(','):
            if '=' not in part:
                continue
            key, _, value = part.partition('=')
            key = key.strip()
            value = value.strip()
            if key == 'ts':
                ts = value
            elif key == 'v1':
                v1 = value

        if not ts or not v1:
            return False

        # Anti-replay
        try:
            if abs(time.time() - int(ts)) > SIGNATURE_MAX_AGE:
                logger.warning('MP: webhook con ts fuera de tolerancia (%s).', ts)
                return False
        except (TypeError, ValueError):
            return False

        data_id = query_params.get('data.id') or query_params.get('id')
        # MP recomienda usar el id en minúsculas si es alfanumérico
        if data_id and data_id.isalnum() and not data_id.isdigit():
            data_id = data_id.lower()

        manifest = ''
        if data_id:
            manifest += f'id:{data_id};'
        if request_id:
            manifest += f'request-id:{request_id};'
        manifest += f'ts:{ts};'

        computed = hmac.new(
            self.webhook_secret.encode(),
            manifest.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed, v1)
