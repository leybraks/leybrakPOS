from django.contrib import admin
# ✨ IMPORTAMOS LAS HERRAMIENTAS DE UNFOLD ✨
from unfold.admin import ModelAdmin, TabularInline, StackedInline

from .models import (
    InsumoSede, InsumoBase, Negocio, RecetaDetalle, Rol, MovimientoCaja, 
    Empleado, Mesa, Sede, Producto, Orden, DetalleOrden, Pago, 
    ModificadorRapido, GrupoVariacion, OpcionVariacion, PlanSaaS,
    # ✨ IMPORTAMOS TUS NUEVOS MODELOS DE CRM Y MARKETING ✨
    Cliente, ZonaDelivery, ReglaNegocio, CuponPromocional, 
    HorarioVisibilidad, ComponenteCombo
)
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline, StackedInline

# ✨ 1. IMPORTAMOS LOS MODELOS NATIVOS DE DJANGO
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin

# ✨ 2. LOS DESVINCULAMOS DEL DISEÑO VIEJO
admin.site.unregister(User)
admin.site.unregister(Group)

# ✨ 3. LOS REGISTRAMOS CON UNFOLD
@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    pass

@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass
# A los registros simples les pasamos ModelAdmin para que agarren el diseño
admin.site.register(Rol, ModelAdmin)
admin.site.register(Mesa, ModelAdmin)
admin.site.register(Orden, ModelAdmin)
admin.site.register(DetalleOrden, ModelAdmin)
admin.site.register(Pago, ModelAdmin) 
admin.site.register(InsumoBase, ModelAdmin)
admin.site.register(InsumoSede, ModelAdmin)
admin.site.register(RecetaDetalle, ModelAdmin)
admin.site.register(ModificadorRapido, ModelAdmin)

# ==========================================
# 1. VARIACIONES DE PRODUCTO
# ==========================================
class OpcionVariacionInline(TabularInline): # ✨ UNFOLD
    model = OpcionVariacion
    extra = 1  

@admin.register(GrupoVariacion)
class GrupoVariacionAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ['nombre', 'producto', 'obligatorio']
    list_filter = ['producto']
    inlines = [OpcionVariacionInline] 

# ==========================================
# 2. GESTIÓN DE EMPLEADOS Y CAJA
# ==========================================
@admin.register(Empleado)
class EmpleadoAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('nombre', 'rol', 'negocio', 'sede', 'pin', 'activo', 'ultimo_ingreso')
    search_fields = ('nombre', 'pin')
    list_filter = ('negocio', 'sede', 'rol', 'activo')

@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('id', 'sede', 'sesion_caja', 'get_tipo_display', 'monto', 'concepto', 'empleado', 'fecha')
    list_filter = ('tipo', 'fecha', 'sede', 'empleado')
    search_fields = ('concepto', 'empleado__nombre')
    readonly_fields = ('fecha',)
    ordering = ('-fecha',)

# ==========================================
# 🚀 3. CONFIGURACIÓN DEL SAAS MULTI-TENANT
# ==========================================
@admin.register(PlanSaaS)
class PlanSaaSAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('nombre', 'precio_mensual', 'max_sedes', 'modulo_kds', 'modulo_inventario', 'modulo_delivery')
    list_editable = ('modulo_kds', 'modulo_inventario', 'modulo_delivery')

@admin.register(Negocio)
class NegocioAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('nombre', 'propietario', 'plan', 'activo')
    list_filter = ('plan', 'activo')
    search_fields = ('nombre', 'propietario__username')

# ==========================================
# 📊 4. CRM Y MARKETING (¡LO NUEVO!)
# ==========================================
@admin.register(Cliente)
class ClienteAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('nombre', 'telefono', 'negocio', 'puntos_acumulados', 'total_gastado', 'cantidad_pedidos')
    search_fields = ('nombre', 'telefono')
    list_filter = ('negocio', 'tags') # Permite filtrar para ver quiénes son "VIP"
    readonly_fields = ('ultima_compra',)

@admin.register(ReglaNegocio)
class ReglaNegocioAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('tipo', 'valor', 'es_porcentaje', 'negocio', 'activa')
    list_filter = ('tipo', 'activa', 'negocio')

@admin.register(CuponPromocional)
class CuponPromocionalAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('codigo', 'monto_descuento', 'es_porcentaje', 'fecha_expiracion', 'activo')
    list_filter = ('activo', 'negocio')
    search_fields = ('codigo',)

# ==========================================
# 🍔 5. PRODUCTOS AVANZADOS (COMBOS Y HORARIOS)
# ==========================================
class ComponenteComboInline(TabularInline): # ✨ UNFOLD
    model = ComponenteCombo
    fk_name = 'combo' # Especificamos cuál llave foránea usar (porque hay 2 hacia Producto)
    extra = 1

class HorarioVisibilidadInline(StackedInline): # ✨ UNFOLD
    model = HorarioVisibilidad
    extra = 0

@admin.register(Producto)
class ProductoAdmin(ModelAdmin): # ✨ UNFOLD
    list_display = ('nombre', 'precio_base', 'categoria', 'negocio', 'es_combo', 'destacar_como_promocion', 'disponible')
    list_filter = ('negocio', 'categoria', 'es_combo', 'destacar_como_promocion', 'disponible')
    search_fields = ('nombre',)
    # Permitir editar cosas rápidas sin entrar al detalle
    list_editable = ('precio_base', 'disponible', 'es_combo', 'destacar_como_promocion')
    
    # ¡Magia! Mostrar los componentes y horarios dentro del mismo producto
    inlines = [HorarioVisibilidadInline, ComponenteComboInline]

@admin.register(Sede)
class SedeAdmin(ModelAdmin): # ✨ UNFOLD
    # Agregamos los horarios a la vista rápida para que sea fácil revisarlos
    list_display = ('nombre', 'negocio', 'hora_apertura', 'hora_cierre', 'activo')
    list_editable = ('activo',) 
    search_fields = ('nombre', 'negocio__nombre')
    
    # Organizamos los campos en el formulario de edición por bloques visuales
    fieldsets = (
        ('Información Principal', {
            'fields': ('negocio', 'nombre', 'direccion', 'activo', 'columnas_salon')
        }),
        ('Horarios de Atención', {
            'fields': ('hora_apertura', 'hora_cierre', 'dias_atencion'),
            'description': 'Configura los días y horas en que el local y el bot están activos.'
        }),
        ('Geolocalización', {
            'fields': ('latitud', 'longitud'),
            'classes': ('collapse',), # Esto hace que se pueda "ocultar" si no se usa mucho
        }),
        ('WhatsApp Config', {
            'fields': ('whatsapp_instancia', 'whatsapp_numero'),
        }),
        ('Menú y Carta Virtual', {
            'fields': ('enlace_carta_virtual', 'carta_pdf'),
        }),
    )

@admin.register(ZonaDelivery)
class ZonaDeliveryAdmin(ModelAdmin): # ✨ UNFOLD
    # Cambiamos distritos por radio_max_km
    list_display = ('nombre', 'sede', 'radio_max_km', 'costo_envio', 'activa')
    list_editable = ('radio_max_km', 'costo_envio', 'activa')
    list_filter = ('sede', 'activa')
    # Eliminamos distritos_cobertura de la búsqueda si ya no lo usas
    search_fields = ('nombre',)