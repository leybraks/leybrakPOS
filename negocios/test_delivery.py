"""
Tests de la Fase 1 de delivery (app del repartidor).
Flujo: listar disponibles → tomar → en camino → entregado, con sus permisos.
"""
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from negocios.models import (
    Negocio, Sede, Producto, Orden, DetalleOrden, Empleado, Rol,
)


def _hdr(emp):
    return {'HTTP_X_EMPLEADO_ID': str(emp.id)}


class DeliveryTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='dueno', password='x')
        self.negocio = Negocio.objects.create(
            propietario=self.user, nombre='Mi Negocio',
            fin_prueba=timezone.now() + timedelta(days=30))
        self.sede = Sede.objects.create(
            negocio=self.negocio, nombre='Principal', latitud=-12.0, longitud=-77.0)
        self.rol_rep  = Rol.objects.create(nombre='Repartidor', puede_repartir=True)
        self.rol_caja = Rol.objects.create(nombre='Cajero', puede_cobrar=True)
        self.driver = Empleado.objects.create(
            negocio=self.negocio, sede=self.sede, nombre='Moto', pin='1234', rol=self.rol_rep)
        self.cajero = Empleado.objects.create(
            negocio=self.negocio, sede=self.sede, nombre='Caja', pin='5678', rol=self.rol_caja)
        self.prod = Producto.objects.create(
            negocio=self.negocio, nombre='Pizza', precio_base=Decimal('30'))

    def _auth(self):
        self.client.force_authenticate(user=User.objects.get(pk=self.user.pk))

    def _pedido(self, estado_delivery='pendiente', repartidor=None):
        o = Orden.objects.create(
            sede=self.sede, tipo='delivery', estado_pago='pagado',
            total=Decimal('35'), costo_envio=Decimal('5'),
            direccion_entrega='Av. Siempreviva 123',
            latitud=Decimal('-12.05'), longitud=Decimal('-77.05'),
            estado_delivery=estado_delivery, repartidor=repartidor,
            cliente_nombre='Juan')
        DetalleOrden.objects.create(orden=o, producto=self.prod, cantidad=1, precio_unitario=Decimal('30'))
        return o

    # ── Listado ────────────────────────────────────────────────────
    def test_listar_disponibles(self):
        self._pedido()
        self._auth()
        r = self.client.get('/api/delivery/pedidos/', **_hdr(self.driver))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['pedidos']), 1)
        p = r.data['pedidos'][0]
        self.assertEqual(p['estado_delivery'], 'pendiente')
        self.assertEqual(p['latitud'], -12.05)
        self.assertEqual(p['items'][0]['nombre'], 'Pizza')

    def test_no_lista_entregados(self):
        self._pedido(estado_delivery='entregado')
        self._auth()
        r = self.client.get('/api/delivery/pedidos/', **_hdr(self.driver))
        self.assertEqual(len(r.data['pedidos']), 0)

    # ── Flujo completo ─────────────────────────────────────────────
    def test_tomar_y_avanzar(self):
        o = self._pedido()
        self._auth()
        r = self.client.post(f'/api/delivery/pedidos/{o.id}/tomar/', **_hdr(self.driver))
        self.assertEqual(r.status_code, 200)
        o.refresh_from_db()
        self.assertEqual(o.estado_delivery, 'asignado')
        self.assertEqual(o.repartidor_id, self.driver.id)

        r = self.client.post(f'/api/delivery/pedidos/{o.id}/estado/',
                             {'estado': 'en_camino'}, format='json', **_hdr(self.driver))
        self.assertEqual(r.status_code, 200)

        r = self.client.post(f'/api/delivery/pedidos/{o.id}/estado/',
                             {'estado': 'entregado'}, format='json', **_hdr(self.driver))
        self.assertEqual(r.status_code, 200)
        o.refresh_from_db()
        self.assertEqual(o.estado_delivery, 'entregado')
        self.assertEqual(o.estado, 'completado')   # cocina: entregado

    # ── Permisos ───────────────────────────────────────────────────
    def test_no_repartidor_no_puede_tomar(self):
        o = self._pedido()
        self._auth()
        r = self.client.post(f'/api/delivery/pedidos/{o.id}/tomar/', **_hdr(self.cajero))
        self.assertEqual(r.status_code, 403)
        o.refresh_from_db()
        self.assertEqual(o.estado_delivery, 'pendiente')

    def test_otro_repartidor_no_actualiza(self):
        otro = Empleado.objects.create(
            negocio=self.negocio, sede=self.sede, nombre='Moto2', pin='9999', rol=self.rol_rep)
        o = self._pedido(estado_delivery='asignado', repartidor=otro)
        self._auth()
        r = self.client.post(f'/api/delivery/pedidos/{o.id}/estado/',
                             {'estado': 'en_camino'}, format='json', **_hdr(self.driver))
        self.assertEqual(r.status_code, 403)

    def test_no_tomar_pedido_de_otro(self):
        otro = Empleado.objects.create(
            negocio=self.negocio, sede=self.sede, nombre='Moto2', pin='9999', rol=self.rol_rep)
        o = self._pedido(estado_delivery='asignado', repartidor=otro)
        self._auth()
        r = self.client.post(f'/api/delivery/pedidos/{o.id}/tomar/', **_hdr(self.driver))
        self.assertEqual(r.status_code, 409)
