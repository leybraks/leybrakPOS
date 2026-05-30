"""
Tests del cobro de suscripción (MercadoPago) y del arreglo del estado.

Cubre el plan de verificación:
  - El bug fix: un PagoSuscripcion 'pagado' reactiva el negocio y estado_suscripcion lo reporta 'activo'.
  - generar-pago crea un PagoSuscripcion 'pendiente' y devuelve el init_point.
  - El webhook: firma válida + pago aprobado -> 'pagado' + negocio reactivado.
  - Idempotencia (reintento de MercadoPago).
  - Validación de monto.
  - Firma inválida -> 403.
  - Pago rechazado -> 'fallido'.

El proveedor de MercadoPago se mockea: no se hace ninguna llamada de red real.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from negocios.models import Negocio, PagoSuscripcion, PlanSaaS

GENERAR_URL = '/api/negocio/suscripcion/generar-pago/'
WEBHOOK_URL = '/api/mp/webhook/'
ESTADO_URL = '/api/negocio/estado-suscripcion/'
PROVIDER_PATH = 'negocios.views.suscripcion_billing_views.get_provider'


class SuscripcionBillingTest(APITestCase):

    def setUp(self):
        cache.clear()  # throttle del webhook usa caché por IP
        self.user = User.objects.create_user(username='dueno', password='x')  # sin email -> sin envío
        self.plan = PlanSaaS.objects.create(nombre='Pro', precio_mensual=Decimal('99.00'))
        self.negocio = Negocio.objects.create(
            propietario=self.user,
            nombre='Mi Negocio',
            plan=self.plan,
            fin_prueba=timezone.now() - timedelta(days=1),  # prueba ya vencida
            activo=False,                                    # bloqueado por impago
        )

    def _pago_pendiente(self):
        pago = PagoSuscripcion.objects.create(
            negocio=self.negocio, plan=self.plan,
            monto=self.plan.precio_mensual, estado='pendiente',
        )
        pago.referencia_externa = f'sub-{pago.id}'
        pago.save(update_fields=['referencia_externa'])
        return pago

    def _mp(self, status='approved', amount=99.0, ref=None, ptype='account_money'):
        prov = MagicMock()
        prov.verify_webhook_signature.return_value = True
        prov.get_payment.return_value = {
            'status': status,
            'external_reference': ref,
            'transaction_amount': amount,
            'payment_type_id': ptype,
        }
        return prov

    # ── Bug fix: 'pagado' reactiva el negocio ───────────────────────
    def test_pago_pagado_reactiva_negocio(self):
        self.assertFalse(self.negocio.activo)
        PagoSuscripcion.objects.create(
            negocio=self.negocio, plan=self.plan,
            monto=self.plan.precio_mensual, estado='pagado',
        )
        self.negocio.refresh_from_db()
        self.assertTrue(self.negocio.activo)

    def test_estado_suscripcion_activo_tras_pago(self):
        PagoSuscripcion.objects.create(
            negocio=self.negocio, plan=self.plan,
            monto=self.plan.precio_mensual, estado='pagado',
            fecha_pago=timezone.now(),
        )
        # User fresco: en producción se carga del JWT en cada request, sin
        # la relación negocio cacheada con el activo=False viejo.
        user = User.objects.get(pk=self.user.pk)
        self.client.force_authenticate(user=user)
        resp = self.client.get(ESTADO_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['estado'], 'activo')
        self.assertTrue(resp.data['puede_operar'])

    # ── Generar pago ────────────────────────────────────────────────
    @override_settings(MP_SANDBOX=True)
    @patch(PROVIDER_PATH)
    def test_generar_pago_crea_pendiente(self, mock_get_provider):
        prov = MagicMock()
        prov.create_subscription_checkout.return_value = {
            'preference_id': 'pref-123',
            'init_point': 'https://mp/init',
            'sandbox_init_point': 'https://mp/sandbox',
        }
        mock_get_provider.return_value = prov

        self.client.force_authenticate(user=self.user)
        resp = self.client.post(GENERAR_URL)

        self.assertEqual(resp.status_code, 201)
        pago = PagoSuscripcion.objects.get(id=resp.data['pago_id'])
        self.assertEqual(pago.estado, 'pendiente')
        self.assertEqual(pago.preference_id, 'pref-123')
        self.assertEqual(pago.referencia_externa, f'sub-{pago.id}')
        # MP_SANDBOX=True por defecto -> devuelve el sandbox_init_point
        self.assertEqual(resp.data['init_point'], 'https://mp/sandbox')

    def test_generar_pago_requiere_autenticacion(self):
        resp = self.client.post(GENERAR_URL)
        self.assertIn(resp.status_code, (401, 403))

    # ── Webhook: aprobado ───────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_webhook_aprobado_confirma_y_reactiva(self, mock_get_provider):
        pago = self._pago_pendiente()
        mock_get_provider.return_value = self._mp(status='approved', ref=f'sub-{pago.id}')

        resp = self.client.post(f'{WEBHOOK_URL}?type=payment&data.id=PAY123')

        self.assertEqual(resp.status_code, 200)
        pago.refresh_from_db()
        self.assertEqual(pago.estado, 'pagado')
        self.assertEqual(pago.referencia_externa, 'PAY123')
        self.assertEqual(pago.metodo_pago, 'yape')   # account_money -> yape
        self.negocio.refresh_from_db()
        self.assertTrue(self.negocio.activo)

    # ── Webhook: idempotencia ───────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_webhook_idempotente(self, mock_get_provider):
        pago = self._pago_pendiente()
        mock_get_provider.return_value = self._mp(status='approved', ref=f'sub-{pago.id}')

        url = f'{WEBHOOK_URL}?type=payment&data.id=PAY123'
        self.client.post(url)
        resp2 = self.client.post(url)   # reintento de MercadoPago

        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(resp2.data.get('duplicate'))
        self.assertEqual(PagoSuscripcion.objects.filter(estado='pagado').count(), 1)

    # ── Webhook: firma inválida ─────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_webhook_firma_invalida(self, mock_get_provider):
        pago = self._pago_pendiente()
        prov = self._mp(ref=f'sub-{pago.id}')
        prov.verify_webhook_signature.return_value = False
        mock_get_provider.return_value = prov

        resp = self.client.post(f'{WEBHOOK_URL}?type=payment&data.id=PAY123')

        self.assertEqual(resp.status_code, 403)
        pago.refresh_from_db()
        self.assertEqual(pago.estado, 'pendiente')

    # ── Webhook: monto alterado ─────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_webhook_monto_no_coincide(self, mock_get_provider):
        pago = self._pago_pendiente()
        mock_get_provider.return_value = self._mp(status='approved', amount=1.0, ref=f'sub-{pago.id}')

        resp = self.client.post(f'{WEBHOOK_URL}?type=payment&data.id=PAY123')

        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data.get('amount_mismatch'))
        pago.refresh_from_db()
        self.assertEqual(pago.estado, 'pendiente')   # NO se confirma
        self.negocio.refresh_from_db()
        self.assertFalse(self.negocio.activo)         # NO se reactiva

    # ── Webhook: pago rechazado ─────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_webhook_rechazado(self, mock_get_provider):
        pago = self._pago_pendiente()
        mock_get_provider.return_value = self._mp(status='rejected', ref=f'sub-{pago.id}')

        resp = self.client.post(f'{WEBHOOK_URL}?type=payment&data.id=PAY999')

        self.assertEqual(resp.status_code, 200)
        pago.refresh_from_db()
        self.assertEqual(pago.estado, 'fallido')
        self.negocio.refresh_from_db()
        self.assertFalse(self.negocio.activo)

    # ── Webhook: ignora notificaciones que no son de pago ───────────
    @patch(PROVIDER_PATH)
    def test_webhook_ignora_no_payment(self, mock_get_provider):
        prov = MagicMock()
        prov.verify_webhook_signature.return_value = True
        mock_get_provider.return_value = prov

        resp = self.client.post(f'{WEBHOOK_URL}?type=merchant_order&data.id=1')

        self.assertEqual(resp.status_code, 200)
        prov.get_payment.assert_not_called()
