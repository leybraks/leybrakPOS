# CLAUDE.md — Leybrak POS

Contexto para agentes/IA y desarrolladores nuevos. Léelo antes de tocar el código.

## Qué es

**SaaS de Punto de Venta (POS) multi-negocio para Perú.** Leybrak (la empresa) cobra
una mensualidad a sus negocios cliente (restaurantes/bares). Cada negocio gestiona
ventas, mesas, cocina (KDS), inventario, delivery, CRM, carta QR, facturación electrónica
(SUNAT) y validación de pagos Yape/Plin. Moneda: **PEN**. Zona horaria: **America/Lima**.
Código en **español**.

## Arquitectura — 3 clientes, 1 backend

| Componente | Stack | Carpeta |
|---|---|---|
| **Backend** | Django 5.2 + DRF + Channels (Daphne/ASGI) + Redis + PostgreSQL | `core/` (config), `negocios/` (app) |
| **Web** | React 19 + Vite + Zustand + Tailwind | `pos-frontend/` |
| **Móvil** | React Native + TypeScript | `LeybrakApp/` |

> **División de responsabilidades:** la **web** es el producto completo (panel del dueño/ERP).
> La **app móvil** es el POS de bolsillo + el listener de notificaciones Yape/Plin (solo Android).
> No se busca paridad total: la config pesada (editor de planos, CRM, carta QR) vive solo en web.

## Backend — claves

- **Auth:** JWT en **cookies HttpOnly** (`negocios/authentication.py` → `CookieJWTAuthentication`).
  El token NO va en localStorage ni en el header. Contexto de empleado vía header
  `X-Empleado-Id` (validado server-side contra el negocio del JWT; ver `negocios/views/helpers.py`).
- **Multi-tenant:** las queries se filtran por `sede__negocio=request.user.negocio`.
  `request.user.negocio` es la relación OneToOne (Negocio.propietario).
- **WebSockets:** Channels. Grupos tipo `pagos_negocio_{id}`. Consumers en
  `negocios/consumers.py`, rutas en `negocios/routing.py`, auth WS en `negocios/middleware.py`.
- **Modelos** (`negocios/models.py`, ~1045 líneas): `PlanSaaS`, `Negocio` (feature flags `mod_*`),
  `Sede`, `Empleado`, `Orden`, `Pago`, `PagoSuscripcion`, `NotificacionPago`, etc.
- **Vistas** divididas en `negocios/views/` por dominio (orden, caja, empleado, pago_yape, etc.).

## Cobro de suscripción (MercadoPago) — implementado

Leybrak cobra la mensualidad a sus negocios. Modelo MVP: **link de pago por mes + webhook**
(Checkout Pro). El cobro recurrente con tarjeta (preapproval) está **fuera de alcance**, pero
el diseño lo permite enchufar después.

- **Paquete:** `negocios/billing/` (`base.py`, `mercadopago_provider.py`, `factory.py`).
  Usa `requests` (no el SDK). `get_provider()` para cambiar de pasarela.
- **Endpoints:**
  - `POST /api/negocio/suscripcion/generar-pago/` (auth) → crea preferencia, devuelve `init_point`.
  - `POST /api/mp/webhook/` (AllowAny, firma **HMAC** con `MP_WEBHOOK_SECRET`) → confirma el pago.
- **Frontend:** botón pagar + polling en `pos-frontend/src/features/ERP/Erp_TabPlan.jsx` y
  pantalla de bloqueo en `pos-frontend/src/App.jsx`.
- **Tests:** `negocios/test_billing.py` (11 tests, todos pasan).
- **Estado del flujo:** `estado_suscripcion` reporta `activo/prueba/vencido/bloqueado`.
  Vigencia = último `PagoSuscripcion` con `estado='pagado'` en los últimos 31 días.
  Un pago `'pagado'` dispara el signal `reactivar_negocio_al_pagar` (en `negocios/signals.py`).

## Facturación electrónica SUNAT (Nubefact) — implementado

El negocio emite **boletas/facturas** a SUNAT vía **Nubefact** (PSE/OSE). Es **opcional y
off-by-default**: en Perú muchos dueños no quieren declarar todo. El "Ticket Digital" (recibo
de consumo por WhatsApp, sin valor legal) es **otra cosa** y ya existía aparte.

- **Paquete:** `negocios/facturacion/` (`base.py` ABC + Error, `factory.py` `get_provider(negocio)`,
  `nubefact_provider.py`, `payload.py`). Usa `requests`. Header Nubefact:
  `Authorization: Token token="<TOKEN>"`.
- **3 modos** (`Negocio.facturacion_emision`): `desactivado` (el botón cobrar es normal),
  `opcional` (tras cobrar aparece la opción de emitir), `automatico` (al cobrar se emite solo).
- **Modelos** (mig. `0067`, `0068`): `Comprobante` y `SerieComprobante`
  (`siguiente_numero` con `select_for_update`). Config en `Negocio`: `facturacion_emision`,
  `facturacion_entorno`, `facturacion_ruta`/`facturacion_token` (EncryptedCharField),
  `facturacion_serie_boleta`/`facturacion_serie_factura`.
- **Endpoints:** `POST /api/ordenes/<id>/emitir-comprobante/`, `GET .../comprobante/`,
  `GET /api/comprobantes/`. Consultas RUC/DNI: `GET /api/negocios/consultar_ruc/<ruc>/` y
  `consultar_dni/<dni>/` (vía `APIS_NET_PE_TOKEN`).
- **Frontend web:** config en `Erp_TabFacturacion.jsx`, emisión en `ModalEmitirComprobante.jsx`
  (se dispara al **Finalizar** el cobro, no antes). **Móvil:** mismo flujo en
  `LeybrakApp/src/components/modals/ModalEmitirComprobante.jsx` + integración en `ModalCobro.jsx`.
- **Tests:** `negocios/test_facturacion.py` (10 tests).
- **Reglas IGV (SUNAT):** los precios **incluyen** IGV 18%. El IGV se calcula `base × 0.18`
  (NO por resta), cada ítem lleva su `subtotal` (base sin IGV). El redondeo por línea genera
  diferencias de ~céntimos en el total (aceptado). `unidad_de_medida='NIU'`, fecha `dd-mm-aaaa`,
  usar `timezone.localdate()` (mandar fecha futura → SUNAT rechaza).
- **DEMO de Nubefact NO envía a SUNAT real** → `aceptada_por_sunat` vuelve `false` aunque todo
  salga bien; el provider lo trata como éxito si hay PDF y no hay `errors`.

## ⚠️ Gotchas (errores que ya costaron tiempo)

1. **`PagoSuscripcion.estado` canónico es `'pagado'`** — NO `'confirmado'`. El `'confirmado'`
   pertenece al modelo `Pago` (pagos del POS) y es correcto ahí; no lo toques.
2. **HTTPS detrás de Cloudflare/NPM:** el TLS termina en el proxy; el backend recibe HTTP.
   Para activar `HTTPS_ENABLED=True` sin bucle de redirección se necesitan **las 3**:
   - `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` en `core/settings.py`.
   - `nginx.conf` reenviando `X-Forwarded-Proto: https` (NO `$scheme`, que vale `http`).
   - `SECURE_REDIRECT_EXEMPT = [r'^api/health/?$']` — si no, el healthcheck del deploy
     (HTTP plano a `/api/health/`) devuelve 301 y **el deploy falla + hace rollback**.
3. **El webhook devuelve 200 ante pago inexistente** (404 en MP) para que MercadoPago no
   reintente infinitamente. Firma inválida → 403. Error transitorio de la API MP → 502 (reintenta).
4. **Versión de la app móvil: hay que subir 3 lugares en +1**, si no se desincroniza y la
   actualización forzada entra en **bucle infinito** (instalas y vuelve a pedir update):
   - `LeybrakApp/android/app/build.gradle` → `versionCode` y `versionName`.
   - `LeybrakApp/src/config/version.js` → `APP_VERSION_CODE` y `APP_VERSION_NAME`.
   El gate compara la **constante JS `APP_VERSION_CODE`** (no el versionCode nativo) contra
   `VersionApp.version_code_minima`. Si la constante quedó vieja, ni el APK nuevo rompe el bucle.
5. **Cloudflare cachea el APK** (`/media/leybrak.apk`). Tras subir un APK nuevo con el mismo
   nombre, si no purgas la caché Cloudflare sigue sirviendo el viejo (`cf-cache-status: HIT`) y
   el bucle de update continúa. **Solución a prueba de balas:** subir con nombre versionado
   (`leybrak-1.0.2.apk`) y apuntar `VersionApp.apk_url` ahí → URL nueva = cache miss, sin purgar.

## Deploy

- **Docker Compose:** servicios `db` (postgres), `redis`, `backend` (daphne :8000),
  `frontend` (nginx: sirve React + proxya `/api`,`/ws`,`/admin` al backend), `evolution-api` (WhatsApp).
- **Proxy externo:** Nginx Proxy Manager (NPM) + Cloudflare. `pos.leybrak.com` → contenedor `pos_frontend`.
  El backend queda público vía `pos.leybrak.com/api/...` (no hay subdominio aparte).
- **CI/CD:** `.github/workflows/deploy.yml` dispara en **push a `V2-Estable-Cloud`**, hace SSH al
  servidor, `git reset --hard`, build, `docker compose up -d`, `migrate`, healthcheck `/api/health/`,
  con **rollback automático** si el healthcheck falla.
- **Secretos:** `.env` en el servidor (está en `.gitignore`, NO se versiona).

## Release de la app móvil (APK + actualización forzada)

La app es **APK directo** (no Play Store). Al abrir consulta `GET /api/app/version/`; si
`forzar=True` y `APP_VERSION_CODE < version_code_minima`, muestra `PantallaActualizacion` (bloquea
todo) y descarga/instala el APK desde `apk_url`. Config editable en **Django admin → Versión de la
App** (modelo `VersionApp`, una fila por `plataforma='android'`).

**Build del APK firmado (Windows):** por el límite de 260 chars hay un **junction `C:\LB` →
`LeybrakApp/`**. Firma con `leybrak-release.keystore` (alias `leybrak`); credenciales en
`LeybrakApp/android/keystore.properties`. ⚠️ **La contraseña del keystore es irreemplazable**:
perderla = no poder firmar updates nunca más (debe estar respaldada por el dueño).

```powershell
# 1. Subir versión en build.gradle Y src/config/version.js (ver Gotcha #4)
# 2. Compilar (genera app/build/outputs/apk/release/app-release.apk, ~62 MB)
& C:\LB\android\gradlew.bat -p C:\LB\android assembleRelease --no-daemon
# 3. Subir al servidor (nombre versionado para evitar caché — ver Gotcha #5)
scp ...\app-release.apk USUARIO@HOST:~/leybrak-1.0.2.apk          # desde la PC
ssh USUARIO@HOST 'cd leybrakPOS && sudo docker compose cp ~/leybrak-1.0.2.apk backend:/app/media/leybrak-1.0.2.apk'
# 4. En el admin: version_code_minima, version_name_ultima, apk_url, activa ✅
```

`/media/` lo sirve nginx desde el volumen `media_volume` (compartido entre `backend:/app/media`
y `frontend:/usr/share/nginx/html/media`). El dir del repo en el servidor es `~/leybrakPOS`.
Verificar versión del APK local: `aapt dump badging <apk> | findstr versionCode`.

## Variables de entorno relevantes (`.env`)

```
SECRET_KEY, FIELD_ENCRYPTION_KEY, DATABASE_URL, REDIS_URL
ALLOWED_HOSTS, CORS_EXTRA_ORIGINS, HTTPS_ENABLED
# MercadoPago (cobro de suscripción)
MP_ACCESS_TOKEN     # token de la cuenta Leybrak (TEST-... sandbox / APP_USR-... prod)
MP_WEBHOOK_SECRET   # secret de firma del webhook (panel de MP)
MP_SANDBOX          # True mientras se prueba
BACKEND_URL=https://pos.leybrak.com
FRONTEND_URL=https://pos.leybrak.com
# Facturación electrónica (Nubefact) — credenciales DEMO por defecto
NUBEFACT_DEMO_RUTA   # URL de la cuenta Nubefact (demo o prod)
NUBEFACT_DEMO_TOKEN  # token Nubefact (si el negocio no tiene los suyos en BD)
# WhatsApp / SUNAT (consultas RUC/DNI vía decolecta/apis.net.pe)
EVO_API_URL, EVO_GLOBAL_KEY, APIS_NET_PE_TOKEN
```

## Comandos

```bash
# Backend (usar el python del venv en Windows: venv/Scripts/python.exe)
python manage.py check
python manage.py migrate
python manage.py test negocios.test_billing      # suite del cobro
python manage.py test negocios.test_facturacion  # suite de facturación SUNAT
python manage.py makemigrations negocios

# Frontend web
cd pos-frontend && npm run dev                    # desarrollo
cd pos-frontend && npx vite build                 # build de producción

# App móvil
cd LeybrakApp && npm run android
```

## Convenciones

- Código, modelos, comentarios y UI en **español**.
- Las vistas externas (webhooks, carta pública) usan `@permission_classes([AllowAny])` y se
  autentican por token/firma, no por JWT.
- Al añadir un endpoint, regístralo en `negocios/urls.py` (router DRF o `path()` función).
- Hay tests reales para el cobro (`test_billing.py`) y la facturación (`test_facturacion.py`);
  el resto se prueba con los `.txt` en `TC/`.

## Deuda técnica conocida

- Sin tests automatizados fuera de cobro y facturación (caja, órdenes, etc.).
- `negocios/views_backup.py` (~1700 líneas) es código muerto, se puede borrar.
- `APP_VERSION_CODE` es una constante manual (`src/config/version.js`); idealmente leer el
  versionCode nativo con `react-native-device-info` para no desincronizar (ver Gotcha #4).
- Facturación: el redondeo de IGV por línea deja diferencias de céntimos; reglas no contemplan
  órdenes con delivery/descuento/recargo (esas se bloquean al emitir).
- Logging con `print()` en consumers/middleware en vez de `logging`.
