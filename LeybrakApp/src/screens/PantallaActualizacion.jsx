import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Linking, ActivityIndicator, ScrollView,
} from 'react-native';

/**
 * Pantalla bloqueante de "Actualización requerida".
 * El botón abre la URL del APK en el navegador, que lo descarga y Android
 * ofrece instalarlo. No se puede saltar (no hay botón de cerrar).
 */
export default function PantallaActualizacion({ info }) {
  const [abriendo, setAbriendo] = useState(false);
  const apkUrl = info?.apk_url || 'https://pos.leybrak.com/media/leybrak.apk';

  const actualizar = async () => {
    setAbriendo(true);
    try {
      await Linking.openURL(apkUrl);
    } catch (e) {
      // si falla, reintentable
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 28, justifyContent: 'center' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 96, height: 96, borderRadius: 28,
            backgroundColor: 'rgba(255,90,31,0.12)',
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Text style={{ fontSize: 46 }}>⬆️</Text>
          </View>

          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
            Actualización requerida
          </Text>

          <Text style={{ color: '#9a9a9a', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 21 }}>
            Hay una versión nueva de Leybrak POS
            {info?.version_ultima ? ` (${info.version_ultima})` : ''}.
            Para seguir usando la app, actualiza a la última versión.
          </Text>

          {!!info?.notas && (
            <View style={{
              backgroundColor: '#141414', borderColor: '#232323', borderWidth: 1,
              borderRadius: 16, padding: 16, marginTop: 20, width: '100%',
            }}>
              <Text style={{ color: '#cfcfcf', fontSize: 13, lineHeight: 20 }}>
                {info.notas}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={actualizar}
        disabled={abriendo}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#ff5a1f', borderRadius: 16, paddingVertical: 17,
          alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
          opacity: abriendo ? 0.6 : 1,
        }}
      >
        {abriendo
          ? <ActivityIndicator color="#fff" />
          : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              Descargar e instalar
            </Text>
          )}
      </TouchableOpacity>

      <Text style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 14 }}>
        Si aparece un aviso de Play Protect, toca “Más detalles” → “Instalar de todos modos”.
      </Text>
    </View>
  );
}
