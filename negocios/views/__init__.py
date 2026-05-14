# ============================================================
# views/__init__.py
#
# Re-exporta todo para que urls.py no necesite cambiar ni una línea.
# Django ve este package exactamente igual que el views.py original.
# ============================================================

from .helpers import (
    es_valor_nulo,
    get_empleado_desde_header,
    get_empleado_verificado,
)

from .negocio_views import (
    NegocioViewSet,
    SedeViewSet,
)

from .menu_views import (
    MesaViewSet,
    ProductoViewSet,
    CategoriaViewSet,
    GrupoVariacionViewSet,
    OpcionVariacionViewSet,
    RecetaOpcionViewSet,
    ModificadorRapidoViewSet,
)

from .orden_views import (
    OrdenViewSet,
    DetalleOrdenViewSet,
    PagoViewSet,
)

from .empleado_views import (
    RolViewSet,
    PinRateThrottle,
    EmpleadoViewSet,
)

from .caja_views import (
    SesionCajaViewSet,
    registrar_movimiento_caja,
    metricas_dashboard,
    configuracion_negocio,
)

from .inventario_views import (
    InsumoBaseViewSet,
    InsumoSedeViewSet,
    registrar_ingreso_maestro,
)

from .cliente_views import (
    ClienteViewSet,
    ZonaDeliveryViewSet,
    ReglaNegocioViewSet,
    calcular_distancia_km,
)
from .marketing_views import (
    MarketingGlobalView
)

from .publico_views import (
    health_check,
    menu_publico,
    orden_publica,
    verificar_sesion,
)
from .culqi_views import (
    webhook_culqi,
    cobrar_tarjeta_culqi,
    estado_orden_culqi,
    generar_qr_culqi,
)

from .suscripcion_views import (
    estado_suscripcion,
)
