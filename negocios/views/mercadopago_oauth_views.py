import logging
import requests
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
logger = logging.getLogger(__name__)


def _get_negocio(user):
    try:
        return user.negocio
    except Exception:
        return None


def _html_redirect(frontend_url, ok=True, msg=''):
    if ok:
        script = "sessionStorage.setItem('mp_oauth_ok', '1');"
    else:
        script = f"sessionStorage.setItem('mp_oauth_error', '{msg}');"

    return HttpResponse(f"""<!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body>
        <script>
        {script}
        if ('serviceWorker' in navigator) {{
        navigator.serviceWorker.getRegistrations().then(function(registrations) {{
            var promises = registrations.map(function(r) {{ return r.unregister(); }});
            return Promise.all(promises);
        }}).then(function() {{
            window.location.replace('{frontend_url}/');
        }});
        }} else {{
        window.location.replace('{frontend_url}/');
        }}
        </script>
        Redirigiendo...
        </body>
        </html>""", content_type='text/html')

# ──────────────────────────────────────────────────────────────
# GET /api/mp/oauth/iniciar/
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_oauth_iniciar(request):
    negocio = _get_negocio(request.user)
    if not negocio:
        return Response({'error': 'Negocio no encontrado'}, status=404)

    auth_url = (
        f"https://auth.mercadopago.com/authorization"
        f"?client_id={settings.MP_APP_ID}"
        f"&response_type=code"
        f"&platform_id=mp"
        f"&state={negocio.id}"
        f"&redirect_uri={settings.MP_REDIRECT_URI}"
    )

    return Response({'auth_url': auth_url})


# ──────────────────────────────────────────────────────────────
# GET /api/mp/oauth/callback/
# MP redirige aquí con ?code=XXXX&state=NEGOCIO_ID
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def mp_oauth_callback(request):
    if request.method != 'GET':
        return HttpResponse('Method not allowed', status=405)
    
    code       = request.GET.get('code')
    negocio_id = request.GET.get('state')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

    if not code or not negocio_id:
        return _html_redirect(frontend_url, ok=False, msg='parametros_invalidos')

    try:
        res = requests.post(
            "https://api.mercadopago.com/oauth/token",
            json={
                "client_id":     settings.MP_APP_ID,
                "client_secret": settings.MP_CLIENT_SECRET,
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  settings.MP_REDIRECT_URI,
            },
            timeout=10,
        )
        data = res.json()
    except Exception as e:
        logger.error(f"MP OAuth callback error: {e}")
        return _html_redirect(frontend_url, ok=False, msg='timeout')

    if res.status_code != 200:
        logger.error(f"MP OAuth token error {res.status_code}: {data}")
        msg = data.get('message', 'error_mp').replace(' ', '_')
        return _html_redirect(frontend_url, ok=False, msg=msg)

    from negocios.models import Negocio
    try:
        negocio = Negocio.objects.get(id=negocio_id)
    except Negocio.DoesNotExist:
        return _html_redirect(frontend_url, ok=False, msg='negocio_no_encontrado')

    negocio.usa_mercado_pago = True
    negocio.mp_user_id       = str(data.get('user_id', ''))
    negocio.mp_access_token  = data.get('access_token', '')
    negocio.mp_public_key    = data.get('public_key', '')
    negocio.save()

    logger.info(f"MP OAuth OK para negocio {negocio.nombre} (user_id={negocio.mp_user_id})")

    return _html_redirect(frontend_url, ok=True)


# ──────────────────────────────────────────────────────────────
# POST /api/mp/oauth/desconectar/
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