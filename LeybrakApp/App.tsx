import React, { useState, useEffect } from 'react';
import LoginScreen from './src/screens/Auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getNegocio } from './src/api/api';
import useAppStore from './src/store/useAppStore';
import { StatusBar, View, ActivityIndicator,NativeModules } from 'react-native';

export default function App() {
  const [sesion, setSesion] = useState<any>(null);
  const [cargando, setCargando] = useState(true); // ← nuevo
  const { setConfiguracionGlobal } = useAppStore();
  const { NotificationModule } = NativeModules;


  // ✅ Verificar sesión guardada al iniciar
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token   = await EncryptedStorage.getItem('access_token');
        const rol     = await EncryptedStorage.getItem('usuario_rol') || '';
        const negocioId = await EncryptedStorage.getItem('negocio_id');

        if (token && negocioId) {
          setSesion({ rol, negocioId, restaurado: true });
        }
      } catch (e) {
        console.log('Sin sesión guardada');
      } finally {
        setCargando(false);
      }
    };
    verificarSesion();
  }, []);

  // Cargar config del negocio
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const negocioId = await EncryptedStorage.getItem('negocio_id');
        if (!negocioId) return;
        const res  = await getNegocio(negocioId);
        const d    = res.data;
        const plan = d.plan_detalles || {};
        if (d.device_token) {
          try {
            NotificationModule.setDeviceToken(d.device_token);
            console.log('✅ Token sincronizado con Android:', d.device_token);
          } catch (err) {
            console.log('❌ Error al pasar token a Kotlin:', err);
          }
        } else {
          console.log('⚠️ El negocio no tiene un device_token asignado en la BD');
        }
        setConfiguracionGlobal({
          colorPrimario:           d.color_primario          || '#3b82f6',
          temaFondo:               d.tema_fondo              || 'dark',
          confirmacion_automatica: d.confirmacion_automatica || false,
          device_token:            d.device_token            || null,
          negocio_id:              d.id,
          yape_numero:             d.yape_numero             || '',
          plin_numero:             d.plin_numero             || '',
          yape_qr:                 d.yape_qr                 || null,
          plin_qr:                 d.plin_qr                 || null,
          modulos: {
            salon:           d.mod_salon_activo       ?? true,
            cocina:          d.mod_cocina_activo      && (plan.modulo_kds        ?? false),
            delivery:        d.mod_delivery_activo    && (plan.modulo_delivery   ?? false),
            inventario:      d.mod_inventario_activo  && (plan.modulo_inventario ?? false),
            clientes:        d.mod_clientes_activo    ?? false,
            facturacion:     d.mod_facturacion_activo ?? false,
            cartaQr:         d.mod_carta_qr_activo    && (plan.modulo_carta_qr   ?? false),
            botWsp:          d.mod_bot_wsp_activo     && (plan.modulo_bot_wsp    ?? false),
            machineLearning: d.mod_ml_activo          && (plan.modulo_ml         ?? false),
          },
        });
      } catch (e) {
        console.log('Config no cargada:', e.message);
      }
    };
    cargarConfig();
  }, [sesion]);

  // Pantalla de carga inicial
  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!sesion) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <LoginScreen onLoginExitoso={(datos) => setSesion(datos)} />
      </>
    );
  }
  const handleLogout = async () => {
  await EncryptedStorage.removeItem('access_token');
  await EncryptedStorage.removeItem('refresh_token');
  await EncryptedStorage.removeItem('negocio_id');
  await EncryptedStorage.removeItem('negocio_nombre');
  await EncryptedStorage.removeItem('usuario_rol');
  await EncryptedStorage.removeItem('usuario_nombre');
  await EncryptedStorage.removeItem('sede_id');
  await EncryptedStorage.removeItem('sede_nombre');
  await EncryptedStorage.removeItem('empleado_id');
  await EncryptedStorage.removeItem('empleado_nombre');
  setSesion(null);
};
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <AppNavigator sesion={sesion} onLogout={handleLogout} />
    </>
  );
}