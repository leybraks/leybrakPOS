# ============================================================
# fusionar_clientes.py
# Fusiona clientes DUPLICADOS por número de teléfono (mismos últimos 9 dígitos)
# dentro de cada negocio. Antes el POS creaba clientes con match exacto y el bot
# con icontains, así que un mismo número quedó en varios registros con los puntos
# repartidos. Este comando los junta en uno solo.
#
#   python manage.py fusionar_clientes            # aplica
#   python manage.py fusionar_clientes --dry-run  # solo muestra qué haría
#   python manage.py fusionar_clientes --negocio 3
# ============================================================
from collections import defaultdict
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from negocios.models import Cliente, CanjePuntos, FeedbackCliente


def _solo_digitos(tel):
    return ''.join(ch for ch in (tel or '') if ch.isdigit())


class Command(BaseCommand):
    help = 'Fusiona clientes duplicados por teléfono (últimos 9 dígitos) en cada negocio.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='No modifica nada; solo informa.')
        parser.add_argument('--negocio', type=int, default=None,
                            help='Limita la fusión a un negocio_id.')

    def handle(self, *args, **opts):
        dry = opts['dry_run']
        qs = Cliente.objects.all().order_by('id')
        if opts['negocio']:
            qs = qs.filter(negocio_id=opts['negocio'])

        # Agrupar por (negocio, sufijo de 9 dígitos)
        grupos = defaultdict(list)
        for c in qs:
            suf = _solo_digitos(c.telefono)[-9:]
            if len(suf) < 9:
                continue   # teléfonos basura: no se tocan
            grupos[(c.negocio_id, suf)].append(c)

        total_grupos = 0
        total_eliminados = 0

        for (negocio_id, suf), clientes in grupos.items():
            if len(clientes) < 2:
                continue
            total_grupos += 1

            # Canónico = el más antiguo (menor id). El resto se absorbe en él.
            canonico = clientes[0]
            duplicados = clientes[1:]

            puntos = sum((c.puntos_acumulados or 0) for c in clientes)
            pedidos = sum((c.cantidad_pedidos or 0) for c in clientes)
            gastado = sum((Decimal(str(c.total_gastado or 0)) for c in clientes), Decimal('0'))
            ultima = max((c.ultima_compra for c in clientes if c.ultima_compra), default=None)
            tags = []
            for c in clientes:
                for t in (c.tags if isinstance(c.tags, list) else []):
                    if t not in tags:
                        tags.append(t)
            nombre = next((c.nombre for c in clientes if c.nombre and c.nombre not in ('Cliente', 'Cliente POS')), canonico.nombre)
            email = next((c.email for c in clientes if c.email), canonico.email)
            nacimiento = next((c.fecha_nacimiento for c in clientes if c.fecha_nacimiento), canonico.fecha_nacimiento)

            ids_dup = [c.id for c in duplicados]
            self.stdout.write(
                f"negocio {negocio_id} - {suf}: {len(clientes)} -> 1 "
                f"(canonico #{canonico.id}, absorbe {ids_dup}) | puntos {puntos}, pedidos {pedidos}"
            )

            if dry:
                total_eliminados += len(duplicados)
                continue

            with transaction.atomic():
                # Reasignar las FKs de los duplicados al canónico ANTES de borrar.
                CanjePuntos.objects.filter(cliente_id__in=ids_dup).update(cliente=canonico)
                FeedbackCliente.objects.filter(cliente_id__in=ids_dup).update(cliente=canonico)

                # Volcar los agregados al canónico.
                canonico.puntos_acumulados = puntos
                canonico.cantidad_pedidos = pedidos
                canonico.total_gastado = gastado
                canonico.ultima_compra = ultima
                canonico.tags = tags
                canonico.nombre = nombre
                canonico.email = email
                canonico.fecha_nacimiento = nacimiento
                canonico.telefono = _solo_digitos(canonico.telefono) or canonico.telefono
                canonico.save()

                Cliente.objects.filter(id__in=ids_dup).delete()

            total_eliminados += len(duplicados)

        modo = '[DRY-RUN] ' if dry else ''
        self.stdout.write(self.style.SUCCESS(
            f"{modo}{total_grupos} grupos con duplicados · {total_eliminados} clientes "
            f"{'a eliminar' if dry else 'fusionados'}."
        ))
