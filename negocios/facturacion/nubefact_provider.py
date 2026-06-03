"""
Proveedor de facturación: Nubefact (PSE/OSE).

Nubefact recibe una RUTA (URL por cuenta) + un TOKEN y un JSON plano; genera y
firma el XML, lo envía a SUNAT y devuelve el CDR + enlaces (PDF/XML).
Header: `Authorization: Token token="<TOKEN>"`.
"""
import logging

import requests

from .base import FacturacionProvider, FacturacionProviderError

logger = logging.getLogger(__name__)
TIMEOUT = (5, 20)   # (connect, read) — emitir puede tardar (firma + envío a SUNAT)


class NubefactProvider(FacturacionProvider):

    def __init__(self, ruta, token):
        self.ruta = ruta
        self.token = token

    def emitir(self, payload):
        if not self.ruta or not self.token:
            raise FacturacionProviderError('Faltan credenciales de Nubefact (ruta/token).')

        headers = {
            'Authorization': f'Token token="{self.token}"',
            'Content-Type': 'application/json',
        }
        try:
            resp = requests.post(self.ruta, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.Timeout:
            logger.error('Nubefact: timeout al emitir comprobante.')
            raise FacturacionProviderError('Timeout al contactar Nubefact.')
        except requests.RequestException as e:
            logger.error('Nubefact: error de red: %s', e)
            raise FacturacionProviderError('Error de red con Nubefact.')

        # 5xx => transitorio (reintentable): excepción.
        if resp.status_code >= 500:
            logger.error('Nubefact: %s %s', resp.status_code, resp.text[:300])
            raise FacturacionProviderError('Nubefact no disponible (5xx).')

        try:
            data = resp.json()
        except ValueError:
            logger.error('Nubefact: respuesta no-JSON (%s): %s', resp.status_code, resp.text[:300])
            raise FacturacionProviderError('Respuesta inválida de Nubefact.')

        errors = data.get('errors')
        aceptado = bool(data.get('aceptada_por_sunat'))

        if errors:
            # Rechazo de validación: resultado de negocio (se persiste, no excepción).
            return {
                'aceptado': False,
                'estado_sunat': 'rechazado',
                'enlace': data.get('enlace', '') or '',
                'enlace_pdf': data.get('enlace_del_pdf', '') or '',
                'codigo_hash': data.get('codigo_hash', '') or '',
                'sunat_description': str(errors),
                'errors': str(errors),
                'raw': data,
            }

        return {
            'aceptado': aceptado,
            'estado_sunat': 'aceptado' if aceptado else 'rechazado',
            'enlace': data.get('enlace', '') or '',
            'enlace_pdf': data.get('enlace_del_pdf', '') or '',
            'codigo_hash': data.get('codigo_hash', '') or '',
            'sunat_description': data.get('sunat_description', '') or '',
            'errors': None,
            'raw': data,
        }
