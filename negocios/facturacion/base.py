"""Interfaz abstracta del proveedor de facturación electrónica (PSE/OSE)."""
from abc import ABC, abstractmethod


class FacturacionProviderError(Exception):
    """Error de comunicación/transitorio con el PSE/OSE (NO es un rechazo de SUNAT).
    Un rechazo de validación de SUNAT es un resultado de negocio que se persiste,
    no una excepción."""


class FacturacionProvider(ABC):

    @abstractmethod
    def emitir(self, payload: dict) -> dict:
        """
        Emite un comprobante. Devuelve un dict normalizado:
            {
              'aceptado': bool,
              'estado_sunat': 'aceptado'|'rechazado',
              'enlace': str,
              'enlace_pdf': str,
              'codigo_hash': str,
              'sunat_description': str,
              'errors': str|None,
              'raw': dict,           # respuesta cruda del proveedor
            }
        Lanza FacturacionProviderError solo ante fallos de red/transitorios.
        """
        raise NotImplementedError
