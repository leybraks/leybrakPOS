from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging
 
logger = logging.getLogger(__name__)
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estado_suscripcion(request):
    """
    Devuelve el estado de suscripción del negocio autenticado.
    El frontend usa esto para decidir si bloquear o mostrar alertas.
 
    Posibles estados:
      - 'activo'   → tiene plan y pago vigente
      - 'prueba'   → dentro del periodo de prueba
      - 'vencido'  → periodo de prueba expirado sin plan pagado
      - 'bloqueado'→ activo=False desde el admin
    """
    try:
        negocio = request.user.negocio
    except Exception:
        return Response({'error': 'Negocio no encontrado'}, status=404)
 
    ahora = timezone.now()
 
    # ── 1. Bloqueado manualmente por el admin ─────────────────
    if not negocio.activo:
        return Response({
            'estado':          'bloqueado',
            'mensaje':         'Tu cuenta ha sido suspendida. Contacta a soporte.',
            'dias_restantes':  0,
            'plan_nombre':     None,
            'puede_operar':    False,
        })
 
    # ── 2. Verificar si tiene un pago vigente ─────────────────
    # Un pago vigente = PagoSuscripcion confirmado en los últimos 31 días
    from .models import PagoSuscripcion
    ultimo_pago = PagoSuscripcion.objects.filter(
        negocio=negocio,
        estado='confirmado',
    ).order_by('-fecha_pago').first()
 
    if ultimo_pago:
        dias_desde_pago = (ahora - ultimo_pago.fecha_pago).days
        if dias_desde_pago <= 31:
            return Response({
                'estado':         'activo',
                'mensaje':        None,
                'dias_restantes': 31 - dias_desde_pago,
                'plan_nombre':    negocio.plan.nombre if negocio.plan else None,
                'puede_operar':   True,
                'ultimo_pago':    ultimo_pago.fecha_pago.isoformat(),
            })
 
    # ── 3. Dentro del periodo de prueba ──────────────────────
    if negocio.fin_prueba and ahora < negocio.fin_prueba:
        dias_restantes = (negocio.fin_prueba - ahora).days
        alerta = dias_restantes <= 3   # alerta cuando quedan 3 días o menos
 
        return Response({
            'estado':         'prueba',
            'mensaje':        f'Periodo de prueba: {dias_restantes} días restantes.' if alerta else None,
            'dias_restantes': dias_restantes,
            'plan_nombre':    negocio.plan.nombre if negocio.plan else None,
            'puede_operar':   True,
            'alerta':         alerta,
        })
 
    # ── 4. Periodo de prueba vencido y sin pago ───────────────
    return Response({
        'estado':         'vencido',
        'mensaje':        'Tu periodo de prueba ha vencido. Adquiere un plan para continuar.',
        'dias_restantes': 0,
        'plan_nombre':    negocio.plan.nombre if negocio.plan else None,
        'puede_operar':   False,
    })