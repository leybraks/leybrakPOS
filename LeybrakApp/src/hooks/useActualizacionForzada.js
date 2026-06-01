import { useEffect, useState } from 'react';
import { getAppVersion } from '../api/api';
import { APP_VERSION_CODE } from '../config/version';

/**
 * Al abrir la app consulta /api/app/version/ y decide si hay que forzar
 * una actualización (cuando el versionCode instalado < el mínimo del backend).
 *
 * Devuelve { forzar, info } donde info = { version_ultima, apk_url, notas }.
 * `forzar` arranca en false; solo se vuelve true si el backend lo indica,
 * así que si el endpoint está caído la app NO se bloquea.
 */
export default function useActualizacionForzada() {
  const [forzar, setForzar] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { data } = await getAppVersion();
        if (!activo) return;
        if (data?.forzar && APP_VERSION_CODE < data.version_code_minima) {
          setInfo(data);
          setForzar(true);
        }
      } catch (e) {
        // Sin red o endpoint caído → no bloqueamos
      }
    })();
    return () => { activo = false; };
  }, []);

  return { forzar, info };
}
