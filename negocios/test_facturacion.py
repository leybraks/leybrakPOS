"""
Tests del módulo de facturación electrónica (Nubefact).
El proveedor se mockea: no hay llamadas de red reales.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from negocios.models import (
    Negocio, Sede, Producto, Orden, DetalleOrden, Comprobante,
)
from negocios.facturacion.base import FacturacionProviderError
from negocios.facturacion.payload import calcular_montos

PROVIDER_PATH = 'negocios.views.facturacion_views.get_provider'


def _url(orden_id):
    return f'/api/ordenes/{orden_id}/emitir-comprobante/'


def _fake_provider(aceptado=True, errors=None):
    prov = MagicMock()
    prov.emitir.return_value = {
        'aceptado': aceptado,
        'estado_sunat': 'aceptado' if aceptado else 'rechazado',
        'enlace': 'https://nubefact.test/enlace',
        'enlace_pdf': 'https://nubefact.test/pdf',
        'codigo_hash': 'ABC123',
        'sunat_description': '' if aceptado else 'Comprobante rechazado',
        'errors': errors,
        'raw': {'ok': aceptado},
    }
    return prov


class FacturacionTest(APITestCase):

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='dueno', password='x')
        self.negocio = Negocio.objects.create(
            propietario=self.user, nombre='Mi Negocio',
            ruc='20123456789', razon_social='MI NEGOCIO SAC',
            fin_prueba=timezone.now() + timedelta(days=30),
            facturacion_emision='opcional', facturacion_entorno='demo',
        )
        self.sede = Sede.objects.create(negocio=self.negocio, nombre='Principal')
        self.producto = Producto.objects.create(
            negocio=self.negocio, nombre='Cerveza', precio_base=Decimal('11.80'))

    # ── helpers ────────────────────────────────────────────────────
    def _auth(self):
        # User fresco: evita la relación negocio cacheada (como en prod, viene del JWT).
        self.client.force_authenticate(user=User.objects.get(pk=self.user.pk))

    def _orden_pagada(self, precio='11.80', cantidad=1, estado_pago='pagado'):
        orden = Orden.objects.create(sede=self.sede, tipo='llevar', estado_pago=estado_pago)
        DetalleOrden.objects.create(
            orden=orden, producto=self.producto, cantidad=cantidad,
            precio_unitario=Decimal(precio))
        return orden

    # ── Math (unit) ────────────────────────────────────────────────
    def test_math_igv_desde_precio_bruto(self):
        orden = self._orden_pagada(precio='11.80', cantidad=1)
        m = calcular_montos(orden)
        self.assertEqual(m['total'], Decimal('11.80'))
        self.assertEqual(m['total_gravada'], Decimal('10.00'))
        self.assertEqual(m['total_igv'], Decimal('1.80'))
        self.assertEqual(m['lineas'][0]['valor_unitario'], 10.00)

    # ── Math con ajustes: descuento (puntos), delivery, recargo ────
    def test_math_descuento_prorrateado(self):
        # 2 × 11.80 = 23.60; descuento 3.60 → total ~20.00 (±céntimo por redondeo).
        orden = self._orden_pagada(precio='11.80', cantidad=2)
        orden.descuento_total = Decimal('3.60')
        orden.save()
        m = calcular_montos(orden)
        self.assertLessEqual(abs(m['total'] - Decimal('20.00')), Decimal('0.02'))
        # Las líneas siempre cuadran con el total (gravada + IGV == total).
        self.assertEqual(m['total_gravada'] + m['total_igv'], m['total'])

    def test_math_delivery_y_recargo_como_lineas(self):
        orden = self._orden_pagada(precio='11.80', cantidad=1)   # 11.80
        orden.costo_envio = Decimal('5.90')
        orden.recargo_total = Decimal('1.18')
        orden.save()
        m = calcular_montos(orden)
        self.assertEqual(m['total'], Decimal('18.88'))           # 11.80 + 5.90 + 1.18
        self.assertEqual(len(m['lineas']), 3)                    # producto + delivery + recargo
        self.assertEqual(m['total_gravada'] + m['total_igv'], m['total'])

    @patch(PROVIDER_PATH)
    def test_emitir_con_descuento_ok(self, mock_gp):
        # Antes se bloqueaba; ahora una orden con descuento (canje de puntos) emite.
        mock_gp.return_value = _fake_provider(aceptado=True)
        orden = self._orden_pagada(precio='11.80', cantidad=2)
        orden.descuento_total = Decimal('3.60')
        orden.save()
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['estado_sunat'], 'aceptado')

    # ── Emisión OK ─────────────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_emitir_boleta_ok(self, mock_gp):
        mock_gp.return_value = _fake_provider(aceptado=True)
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['estado_sunat'], 'aceptado')
        self.assertEqual(r.data['serie'], 'B001')
        self.assertEqual(r.data['numero'], 1)
        self.assertEqual(r.data['enlace_pdf'], 'https://nubefact.test/pdf')

    @patch(PROVIDER_PATH)
    def test_emitir_factura_ok(self, mock_gp):
        mock_gp.return_value = _fake_provider(aceptado=True)
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {
            'tipo': 'factura',
            'receptor': {'num_doc': '20123456789', 'denominacion': 'CLIENTE SAC', 'direccion': 'Av. X'},
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['serie'], 'F001')

    # ── Validaciones ───────────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_factura_sin_ruc(self, mock_gp):
        mock_gp.return_value = _fake_provider(True)
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'factura', 'receptor': {}}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Comprobante.objects.filter(orden=orden).exists())

    @patch(PROVIDER_PATH)
    def test_orden_no_pagada(self, mock_gp):
        mock_gp.return_value = _fake_provider(True)
        orden = self._orden_pagada(estado_pago='pendiente')
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual(r.status_code, 400)

    @patch(PROVIDER_PATH)
    def test_modulo_desactivado(self, mock_gp):
        mock_gp.return_value = _fake_provider(True)
        self.negocio.facturacion_emision = 'desactivado'
        self.negocio.save(update_fields=['facturacion_emision'])
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual(r.status_code, 400)

    # ── Idempotencia ───────────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_idempotencia(self, mock_gp):
        prov = _fake_provider(True)
        mock_gp.return_value = prov
        orden = self._orden_pagada()
        self._auth()
        self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        r2 = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(prov.emitir.call_count, 1)
        self.assertEqual(Comprobante.objects.filter(orden=orden).count(), 1)

    # ── SUNAT rechaza ──────────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_sunat_rechaza(self, mock_gp):
        mock_gp.return_value = _fake_provider(aceptado=False, errors='RUC del receptor no existe')
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {
            'tipo': 'factura',
            'receptor': {'num_doc': '20999999999', 'denominacion': 'X', 'direccion': 'Y'},
        }, format='json')
        self.assertEqual(r.status_code, 400)
        comp = Comprobante.objects.get(orden=orden)
        self.assertEqual(comp.estado_sunat, 'rechazado')

    # ── Error de proveedor (red/transitorio) ───────────────────────
    @patch(PROVIDER_PATH)
    def test_provider_error(self, mock_gp):
        prov = MagicMock()
        prov.emitir.side_effect = FacturacionProviderError('Timeout')
        mock_gp.return_value = prov
        orden = self._orden_pagada()
        self._auth()
        r = self.client.post(_url(orden.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        # 400 (no 502): un 5xx lo enmascara Cloudflare y el cajero no vería el motivo.
        self.assertEqual(r.status_code, 400)
        self.assertIn('error', r.data)
        comp = Comprobante.objects.get(orden=orden)
        self.assertEqual(comp.estado_sunat, 'rechazado')

    # ── Correlativo atómico ────────────────────────────────────────
    @patch(PROVIDER_PATH)
    def test_correlativo_incrementa(self, mock_gp):
        mock_gp.return_value = _fake_provider(True)
        o1 = self._orden_pagada()
        o2 = self._orden_pagada()
        self._auth()
        r1 = self.client.post(_url(o1.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        r2 = self.client.post(_url(o2.id), {'tipo': 'boleta', 'receptor': {}}, format='json')
        self.assertEqual({r1.data['numero'], r2.data['numero']}, {1, 2})
