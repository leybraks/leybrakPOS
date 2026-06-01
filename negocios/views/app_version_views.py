# ============================================================
# views/app_version_views.py
# Endpoint público que la app móvil consulta al abrir para saber
# si debe forzar una actualización.
# ============================================================
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def app_version(request):
    """
    Devuelve la info de versión de la app Android.
    La app compara su versionCode con `version_code_minima`:
    si es menor y `forzar=True`, muestra la pantalla bloqueante de actualización.
    """
    from ..models import VersionApp

    cfg = VersionApp.objects.filter(plataforma='android').first()

    if not cfg or not cfg.activa:
        # Sin config o desactivado → nunca se fuerza
        return Response({
            'forzar': False,
            'version_code_minima': 0,
            'version_ultima': '1.0.0',
            'apk_url': 'https://pos.leybrak.com/media/leybrak.apk',
            'notas': '',
        })

    return Response({
        'forzar': True,
        'version_code_minima': cfg.version_code_minima,
        'version_ultima': cfg.version_name_ultima,
        'apk_url': cfg.apk_url,
        'notas': cfg.notas or '',
    })
