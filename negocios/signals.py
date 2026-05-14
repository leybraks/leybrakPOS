from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.db.models import F
from django.db import transaction
from django.core.mail import EmailMultiAlternatives, send_mail
from core import settings # ✨ 1. Importamos la transacción
from .models import Empleado, HorarioVisibilidad, Negocio, Pago, InsumoSede, PagoSuscripcion, Producto, RecetaDetalle, RecetaOpcion, ReglaNegocio

@receiver(post_save, sender=Pago)
def procesar_descuento_stock(sender, instance, created, **kwargs):
    """
    Cuando se crea un Pago, recorremos la orden y descontamos el stock 
    de la receta base Y de las opciones extras elegidas.
    """
    if created: 
        orden = instance.orden
        sede = orden.sede
        
        with transaction.atomic():
            for detalle in orden.detalles.all():
                producto = detalle.producto
                cantidad_vendida = detalle.cantidad
                
                # 🔪 1. DESCONTAMOS LA RECETA BASE DEL PLATO
                recetas_base = RecetaDetalle.objects.filter(producto=producto)
                for receta in recetas_base:
                    gasto_total = float(receta.cantidad_necesaria) * float(cantidad_vendida)
                    InsumoSede.objects.filter(
                        sede=sede, insumo_base=receta.insumo
                    ).update(stock_actual=F('stock_actual') - gasto_total)
                    
                # 🔪 2. ✨ NUEVO: DESCONTAMOS LAS VARIACIONES Y EXTRAS
                # Recorremos qué opciones eligió el cliente (Ej: Tamaño Familiar, Extra Rachi)
                for opcion_seleccionada in detalle.opciones_seleccionadas.all():
                    
                    # Buscamos la receta de esa opción específica
                    recetas_opcion = RecetaOpcion.objects.filter(opcion=opcion_seleccionada.opcion_variacion)
                    
                    for receta_opc in recetas_opcion:
                        # Si compró 2 pizzas familiares, gastamos 2 veces los insumos de la "Familiar"
                        gasto_total_opcion = float(receta_opc.cantidad_necesaria) * float(cantidad_vendida)
                        InsumoSede.objects.filter(
                            sede=sede, insumo_base=receta_opc.insumo
                        ).update(stock_actual=F('stock_actual') - gasto_total_opcion)

def _enviar_email_auditoria(negocio, accion, objeto, detalle):
    email_dueno = negocio.propietario.email
    if not email_dueno:
        return
    
    # Definir color del badge según la acción
    if 'Eliminado' in accion:
        color_badge = '#ef4444'
        emoji = '🗑️'
    elif 'Creado' in accion:
        color_badge = '#10b981'
        emoji = '✅'
    elif 'Precio' in accion:
        color_badge = '#f59e0b'
        emoji = '💰'
    elif 'Pago' in accion or 'Suscripción' in accion:
        color_badge = '#8b5cf6'
        emoji = '💳'
    else:
        color_badge = '#3b82f6'
        emoji = '✏️'

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- HEADER -->
            <tr>
              <td style="background:#0a0a0a;padding:28px 32px;text-align:center;">
                <p style="margin:0;color:#ff5a1f;font-size:22px;font-weight:900;letter-spacing:-0.5px;">BRAVA<span style="color:#ffffff;">POS</span></p>
                <p style="margin:6px 0 0;color:#737373;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Sistema de Gestión</p>
              </td>
            </tr>

            <!-- BADGE ACCIÓN -->
            <tr>
              <td style="padding:32px 32px 0;text-align:center;">
                <span style="display:inline-block;background:{color_badge}18;color:{color_badge};border:1px solid {color_badge}40;padding:6px 16px;border-radius:100px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
                  {emoji} {accion}
                </span>
              </td>
            </tr>

            <!-- NEGOCIO -->
            <tr>
              <td style="padding:16px 32px 0;text-align:center;">
                <p style="margin:0;color:#111827;font-size:20px;font-weight:900;">"{negocio.nombre}"</p>
                <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Se realizó el siguiente cambio en tu negocio</p>
              </td>
            </tr>

            <!-- DETALLE -->
            <tr>
              <td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="8">
                        <tr>
                          <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
                            <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Objeto</span><br>
                            <span style="color:#111827;font-size:15px;font-weight:700;margin-top:2px;display:block;">{objeto}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0 0;">
                            <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Detalle</span><br>
                            <span style="color:#374151;font-size:14px;margin-top:4px;display:block;line-height:1.6;">{detalle}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ALERTA -->
            <tr>
              <td style="padding:0 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <p style="margin:0;color:#92400e;font-size:12px;font-weight:600;">
                        ⚠️ Si no reconoces este cambio, contacta a soporte inmediatamente.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
                <p style="margin:0;color:#9ca3af;font-size:11px;">Este es un correo automático de <strong>BravaPOS</strong> · <a href="https://leybrak.com" style="color:#ff5a1f;text-decoration:none;">leybrak.com</a></p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    texto_plano = f"[BravaPOS] {accion}: {objeto}\n\nNegocio: {negocio.nombre}\nDetalle: {detalle}\n\nSi no reconoces este cambio, contacta a soporte."

    try:
        msg = EmailMultiAlternatives(
            subject=f'[BravaPOS] {accion}: {objeto}',
            body=texto_plano,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_dueno],
        )
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=True)
    except Exception:
        pass

@receiver(post_save, sender=HorarioVisibilidad)
def auditoria_happy_hour(sender, instance, created, **kwargs):
    accion = 'Creado' if created else 'Editado'
    objetivo = instance.producto.nombre if instance.producto else (instance.categoria.nombre if instance.categoria else 'Sin objetivo')
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion=f'Happy Hour {accion}',
        objeto=instance.nombre,
        detalle=f'Tipo: {instance.get_tipo_promo_display()} | Aplica a: {objetivo} | Activo: {instance.activa}'
    )

@receiver(post_delete, sender=HorarioVisibilidad)
def auditoria_happy_hour_delete(sender, instance, **kwargs):
    objetivo = instance.producto.nombre if instance.producto else (instance.categoria.nombre if instance.categoria else 'Sin objetivo')
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion='Happy Hour Eliminado',
        objeto=instance.nombre,
        detalle=f'Aplica a: {objetivo}'
    )

@receiver(post_save, sender=ReglaNegocio)
def auditoria_regla(sender, instance, created, **kwargs):
    accion = 'Creada' if created else 'Editada'
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion=f'Regla de Negocio {accion}',
        objeto=instance.nombre or instance.get_tipo_display(),
        detalle=f'Tipo: {instance.get_tipo_display()} | Valor: {instance.valor} | Activa: {instance.activa}'
    )

@receiver(post_delete, sender=ReglaNegocio)
def auditoria_regla_delete(sender, instance, **kwargs):
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion='Regla de Negocio Eliminada',
        objeto=instance.nombre or instance.get_tipo_display(),
        detalle=f'Tipo: {instance.get_tipo_display()}'
    )

@receiver(post_save, sender=PagoSuscripcion)
def reactivar_negocio_al_pagar(sender, instance, created, **kwargs):
    """
    Cuando un PagoSuscripcion se confirma, reactiva el negocio
    si estaba bloqueado (activo=False).
    """
    if instance.estado == 'confirmado' and not instance.negocio.activo:
        Negocio.objects.filter(id=instance.negocio.id).update(activo=True)

# ══════════════════════════════════════════════════════
# 💰 CAMBIO DE PRECIO DE PRODUCTO
# ══════════════════════════════════════════════════════
@receiver(post_save, sender=Producto)
def auditoria_precio_producto(sender, instance, created, **kwargs):
    if created:
        return  # No emailar al crear, solo al editar precio
    
    # Solo si cambió el precio — comparamos con el valor en BD
    # usando update_fields si viene del admin
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion='Precio Modificado',
        objeto=instance.nombre,
        detalle=f'Precio base actual: S/ {instance.precio_base} | Disponible: {instance.disponible}'
    )


# ══════════════════════════════════════════════════════
# 👤 EMPLEADO CREADO / EDITADO
# ══════════════════════════════════════════════════════
@receiver(post_save, sender=Empleado)
def auditoria_empleado(sender, instance, created, **kwargs):
    accion = 'Empleado Creado' if created else 'Empleado Editado'
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion=accion,
        objeto=instance.nombre,
        detalle=f'Rol: {instance.rol} | Sede: {instance.sede} | Activo: {instance.activo}'
    )

@receiver(post_delete, sender=Empleado)
def auditoria_empleado_delete(sender, instance, **kwargs):
    _enviar_email_auditoria(
        negocio=instance.negocio,
        accion='Empleado Eliminado',
        objeto=instance.nombre,
        detalle=f'Rol: {instance.rol} | Sede: {instance.sede}'
    )


# ══════════════════════════════════════════════════════
# 💳 SUSCRIPCIÓN CONFIRMADA
# ══════════════════════════════════════════════════════
@receiver(post_save, sender=PagoSuscripcion)
def reactivar_negocio_al_pagar(sender, instance, created, **kwargs):
    if instance.estado == 'confirmado' and not instance.negocio.activo:
        Negocio.objects.filter(id=instance.negocio.id).update(activo=True)

@receiver(post_save, sender=PagoSuscripcion)
def auditoria_pago_suscripcion(sender, instance, created, **kwargs):
    if instance.estado == 'confirmado':
        _enviar_email_auditoria(
            negocio=instance.negocio,
            accion='Pago de Suscripción Confirmado',
            objeto=f'Plan {instance.plan.nombre if instance.plan else ""}',
            detalle=f'Monto: S/ {instance.monto} | Método: {instance.metodo_pago} | Periodo: {instance.periodo or "—"}'
        )