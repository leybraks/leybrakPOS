# CLAUDE.md — Leybrak POS

Contexto para agentes/IA y desarrolladores nuevos. Léelo antes de tocar el código.

## Qué es

**SaaS de Punto de Venta (POS) multi-negocio para Perú.** Leybrak (la empresa) cobra
una mensualidad a sus negocios cliente (restaurantes/bares). Cada negocio gestiona
ventas, mesas, cocina (KDS), inventario, delivery, CRM, carta QR y validación de
pagos Yape/Plin. Moneda: **PEN**. Zona horaria: **America/Lima**. Código en **español**.

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

## Deploy

- **Docker Compose:** servicios `db` (postgres), `redis`, `backend` (daphne :8000),
  `frontend` (nginx: sirve React + proxya `/api`,`/ws`,`/admin` al backend), `evolution-api` (WhatsApp).
- **Proxy externo:** Nginx Proxy Manager (NPM) + Cloudflare. `pos.leybrak.com` → contenedor `pos_frontend`.
  El backend queda público vía `pos.leybrak.com/api/...` (no hay subdominio aparte).
- **CI/CD:** `.github/workflows/deploy.yml` dispara en **push a `V2-Estable-Cloud`**, hace SSH al
  servidor, `git reset --hard`, build, `docker compose up -d`, `migrate`, healthcheck `/api/health/`,
  con **rollback automático** si el healthcheck falla.
- **Secretos:** `.env` en el servidor (está en `.gitignore`, NO se versiona).

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
# WhatsApp / SUNAT
EVO_API_URL, EVO_GLOBAL_KEY, APIS_NET_PE_TOKEN
```

## Comandos

```bash
# Backend (usar el python del venv en Windows: venv/Scripts/python.exe)
python manage.py check
python manage.py migrate
python manage.py test negocios.test_billing      # suite del cobro
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
- Hay tests reales solo para el cobro (`test_billing.py`); el resto se prueba con los `.txt` en `TC/`.

## Deuda técnica conocida

- Sin tests automatizados fuera del cobro (caja, órdenes, etc.).
- `negocios/views_backup.py` (~1700 líneas) es código muerto, se puede borrar.
- Falta el módulo de **facturación electrónica (SUNAT)** — pendiente, vía PSE/OSE tercero.
- Logging con `print()` en consumers/middleware en vez de `logging`.
