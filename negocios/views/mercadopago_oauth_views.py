import logging
import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# CONFIGURACIÓN (agregar en settings.py):
#
#   MP_APP_ID        = "TU_APP_ID_DE_MP"
#   MP_CLIENT_SECRET = "TU_CLIENT_SECRET_DE_MP"
#   MP_REDIRECT_URI  = "https://tudominio.com/api/mp/oauth/callback/"
#   FRONTEND_URL     = "https://tudominio.com"   # para el redirect final
#
# ──────────────────────────────────────────────────────────────


def _get_negocio(user):
    try:
        return user.negocio
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────
# GET /api/mp/oauth/iniciar/
# El botón "Conectar con Mercado Pago" del frontend llama aquí.
# Redirige al comerciante a la pantalla de autorización de MP.
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_oauth_iniciar(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)

    app_id       = settings.MP_APP_ID
    redirect_uri = settings.MP_REDIRECT_URI

    # state = negocio.id — lo usamos en el callback para saber a quién pertenece el token
    auth_url = (
        f"https://auth.mercadopago.com/authorization"
        f"?client_id={app_id}"
        f"&response_type=code"
        f"&platform_id=mp"
        f"&state={negocio.id}"
        f"&redirect_uri={redirect_uri}"
    )

    # Devolvemos la URL para que el frontend haga window.location.href = url
    return Response({'auth_url': auth_url})


# ──────────────────────────────────────────────────────────────
# GET /api/mp/oauth/callback/
# MP redirige aquí con ?code=XXXX&state=NEGOCIO_ID
# Intercambiamos el code por access_token y lo guardamos.
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])   # MP llama aquí directamente, sin JWT
def mp_oauth_callback(request):
    code      = request.query_params.get('code')
    negocio_id = request.query_params.get('state')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

    if not code or not negocio_id:
        return redirect(f"{frontend_url}/erp/configuracion?mp_status=error&msg=parametros_invalidos")

    # Intercambiamos el code por los tokens
    try:
        res = requests.post(
            "https://api.mercadopago.com/oauth/token",
            json={
                "client_id":     settings.MP_APP_ID,
                "client_secret": settings.MP_CLIENT_SECRET,  # Access Token del dueño de la app
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  settings.MP_REDIRECT_URI,
            },
            timeout=10,
        )
        data = res.json()
    except Exception as e:
        logger.error(f"MP OAuth callback error: {e}")
        return redirect(f"{frontend_url}/erp/configuracion?mp_status=error&msg=timeout")

    if res.status_code != 200:
        logger.error(f"MP OAuth token error {res.status_code}: {data}")
        msg = data.get('message', 'error_mp')
        return redirect(f"{frontend_url}/erp/configuracion?mp_status=error&msg={msg}")

    # Guardamos los tokens en el negocio correspondiente
    from negocios.models import Negocio
    try:
        negocio = Negocio.objects.get(id=negocio_id)
    except Negocio.DoesNotExist:
        return redirect(f"{frontend_url}/erp/configuracion?mp_status=error&msg=negocio_no_encontrado")

    negocio.usa_mercado_pago  = True
    negocio.mp_user_id        = str(data.get('user_id', ''))
    negocio.mp_access_token   = data.get('access_token', '')
    negocio.mp_public_key     = data.get('public_key', '')
    # MP también devuelve refresh_token para renovar — lo guardamos en mp_webhook_secret
    # Si prefieres un campo separado, agrégalo al modelo.
    # negocio.mp_refresh_token = data.get('refresh_token', '')  # ver nota abajo
    negocio.save()

    logger.info(f"MP OAuth OK para negocio {negocio.nombre} (user_id={negocio.mp_user_id})")

    # Redirigimos al ERP con éxito — el frontend leerá el query param
    return redirect(f"{frontend_url}/erp/configuracion?mp_status=ok")


# ──────────────────────────────────────────────────────────────
# POST /api/mp/oauth/desconectar/
# El comerciante quiere desvincular su cuenta MP.
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mp_oauth_desconectar(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)

    negocio.usa_mercado_pago = False
    negocio.mp_access_token  = ''
    negocio.mp_user_id       = ''
    negocio.mp_public_key    = ''
    negocio.save()

    return Response({'ok': True, 'mensaje': 'Mercado Pago desvinculado correctamente'})


# ──────────────────────────────────────────────────────────────
# GET /api/mp/oauth/estado/
# El frontend consulta si el negocio ya tiene MP conectado.
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_oauth_estado(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)

    return Response({
        'conectado':  negocio.usa_mercado_pago and bool(negocio.mp_access_token),
        'mp_user_id': negocio.mp_user_id or None,
    })
