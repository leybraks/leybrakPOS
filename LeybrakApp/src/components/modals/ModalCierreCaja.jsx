import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import useAppStore from '../../store/useAppStore';
import { cerrarCaja } from '../../api/api';

export default function ModalCierreCaja({ visible, onClose, onCierreExitoso }) {
  const { configuracionGlobal, setEstadoCaja } = useAppStore();
  const isDark = configuracionGlobal?.temaFondo !== 'light';
  const color  = configuracionGlobal?.colorPrimario || '#ff5a1f';

  const t = {
    bg:       isDark ? '#121212' : '#ffffff',
    bg2:      isDark ? '#1a1a1a' : '#f9fafb',
    bg3:      isDark ? '#0a0a0a' : '#f3f4f6',
    border:   isDark ? '#333333' : '#e5e7eb',
    border2:  isDark ? '#222222' : '#d1d5db',
    textPrim: isDark ? '#ffffff' : '#111111',
    textSec:  isDark ? '#9ca3af' : '#6b7280',
    textMut:  isDark ? '#4b5563' : '#9ca3af',
  };

  const [efectivo, setEfectivo]   = useState('');
  const [yape, setYape]           = useState('');
  const [tarjeta, setTarjeta]     = useState('');
  const [procesando, setProcesando] = useState(false);

  const handleCerrar = () => {
    setEfectivo(''); setYape(''); setTarjeta('');
    onClose();
  };

  const procesarCierre = async () => {
    if (!efectivo) {
      Alert.alert('Error', 'Ingresa el total de efectivo.');
      return;
    }
    setProcesando(true);
    try {
      const sedeId     = await EncryptedStorage.getItem('sede_id');
      const empleadoId = await EncryptedStorage.getItem('empleado_id');

      const payload = {
        empleado_id:      empleadoId,
        sede_id:          sedeId,
        conteo_efectivo:  parseFloat(efectivo  || 0),
        conteo_yape:      parseFloat(yape      || 0),
        conteo_tarjeta:   parseFloat(tarjeta   || 0),
      };

      const res = await cerrarCaja(payload);
      setEstadoCaja(null);
      await EncryptedStorage.removeItem('sesion_caja_id');

      handleCerrar();
      if (onCierreExitoso) onCierreExitoso(res.data);

    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo procesar el cierre.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCerrar}>
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: t.bg, borderColor: t.border }]}>

          {/* Header */}
          <View style={[s.header, { backgroundColor: t.bg2, borderBottomColor: t.border2 }]}>
            <Text style={[s.titulo, { color: t.textPrim }]}>Cierre de Caja</Text>
            <TouchableOpacity onPress={handleCerrar} style={[s.closeBtn, { backgroundColor: t.bg3, borderColor: t.border }]}>
              <Icon name="times" size={14} color={t.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.body}>

            {/* Alerta cierre ciego */}
            <View style={[s.alerta, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
              <Text style={s.alertaIcon}>🔒</Text>
              <Text style={[s.alertaTitulo, { color: '#ef4444' }]}>Cierre Ciego Activado</Text>
              <Text style={[s.alertaDesc, { color: t.textSec }]}>
                Cuenta el dinero en tu gaveta e ingrésalo. Cualquier diferencia será reportada al administrador.
              </Text>
            </View>

            {/* Input Efectivo */}
            <InputMonto
              label="💵 TOTAL EFECTIVO (BILLETES Y MONEDAS)"
              value={efectivo}
              onChange={setEfectivo}
              focusColor="#10b981"
              t={t}
            />

            {/* Input Yape/Plin */}
            <InputMonto
              label="📱 TOTAL EN YAPE / PLIN"
              value={yape}
              onChange={setYape}
              focusColor="#8b5cf6"
              t={t}
            />

            {/* Input Tarjeta */}
            <InputMonto
              label="💳 TOTAL EN POS (VOUCHERS DE TARJETA)"
              value={tarjeta}
              onChange={setTarjeta}
              focusColor="#3b82f6"
              t={t}
            />

            {/* Botón confirmar */}
            <TouchableOpacity
              style={[s.btnConfirmar, { backgroundColor: color }, (procesando || !efectivo) && { opacity: 0.5 }]}
              onPress={procesarCierre}
              disabled={procesando || !efectivo}
              activeOpacity={0.8}
            >
              {procesando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnConfirmarText}>ENVIAR CIERRE A GERENCIA</Text>
              }
            </TouchableOpacity>

            {/* Botón cancelar */}
            <TouchableOpacity onPress={handleCerrar} style={s.btnCancelar} activeOpacity={0.7}>
              <Text style={[s.btnCancelarText, { color: t.textSec }]}>Cancelar y volver a la caja</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InputMonto({ label, value, onChange, focusColor, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[s.inputLabel, { color: t.textMut }]}>{label}</Text>
      <View style={[
        s.inputRow,
        { backgroundColor: t.bg2, borderColor: focused ? focusColor : t.border }
      ]}>
        <Text style={[s.inputPrefix, { color: t.textMut }]}>S/</Text>
        <TextInput
          style={[s.input, { color: t.textPrim }]}
          value={value}
          onChangeText={onChange}
          placeholder="0.00"
          placeholderTextColor={t.textMut}
          keyboardType="decimal-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  container:      { borderRadius: 24, borderWidth: 1, overflow: 'hidden', maxHeight: '90%' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  titulo:         { fontSize: 18, fontWeight: '900' },
  closeBtn:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:           { padding: 20, paddingBottom: 32 },

  alerta:         { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 24 },
  alertaIcon:     { fontSize: 24, marginBottom: 6 },
  alertaTitulo:   { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  alertaDesc:     { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  inputLabel:     { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12 },
  inputPrefix:    { fontSize: 16, fontWeight: '700', marginRight: 8 },
  input:          { flex: 1, fontSize: 20, fontWeight: '900' },

  btnConfirmar:   { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  btnConfirmarText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  btnCancelar:    { alignItems: 'center', paddingVertical: 8 },
  btnCancelarText:{ fontSize: 13, fontWeight: '600' },
});