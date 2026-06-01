import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  Platform, StatusBar, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getSedes, crearSede, actualizarSede } from '../../api/api';
import useAppStore from '../../store/useAppStore';

const useTema = () => {
  const { configuracionGlobal } = useAppStore();
  const isDark = configuracionGlobal.temaFondo !== 'light';
  const color  = configuracionGlobal.colorPrimario || '#3b82f6';
  return {
    isDark, color,
    bg:       isDark ? '#050505' : '#f9fafb',
    bgCard:   isDark ? '#111111' : '#ffffff',
    bgCard2:  isDark ? '#1a1a1a' : '#f3f4f6',
    bgInput:  isDark ? '#0a0a0a' : '#ffffff',
    border:   isDark ? '#222222' : '#e5e7eb',
    border2:  isDark ? '#333333' : '#d1d5db',
    textPrim: isDark ? '#ffffff' : '#111827',
    textSec:  isDark ? '#9ca3af' : '#6b7280',
    textMuted:isDark ? '#4b5563' : '#9ca3af',
  };
};

function ModalSede({ visible, sede, t, onGuardar, onCerrar }) {
  const [form, setForm] = useState({ nombre: '', direccion: '', activo: true });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        nombre:    sede?.nombre || '',
        direccion: sede?.direccion || '',
        activo:    sede ? !!sede.activo : true,
      });
    }
  }, [visible, sede]);

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio.'); return; }
    setGuardando(true);
    try {
      await onGuardar(form);
      onCerrar();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo guardar la sede.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={mo.overlay}>
        <View style={[mo.modal, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <View style={[mo.header, { borderBottomColor: t.border }]}>
            <Text style={[mo.titulo, { color: t.textPrim }]}>{sede ? 'Editar Sede' : 'Nueva Sede'}</Text>
            <TouchableOpacity onPress={onCerrar} style={[mo.closeBtn, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
              <Icon name="times" size={14} color={t.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={mo.body} showsVerticalScrollIndicator={false}>
            <Text style={[mo.label, { color: t.textMuted }]}>NOMBRE DE LA SEDE</Text>
            <TextInput
              style={[mo.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={form.nombre}
              onChangeText={(v) => setForm({ ...form, nombre: v })}
              placeholder="Ej. Local San Borja"
              placeholderTextColor={t.textMuted}
            />

            <Text style={[mo.label, { color: t.textMuted, marginTop: 16 }]}>DIRECCIÓN</Text>
            <TextInput
              style={[mo.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={form.direccion}
              onChangeText={(v) => setForm({ ...form, direccion: v })}
              placeholder="Dirección o Plus Code"
              placeholderTextColor={t.textMuted}
            />

            <View style={[mo.switchRow, { borderColor: t.border, backgroundColor: t.bgInput, marginTop: 16 }]}>
              <View>
                <Text style={[mo.switchTitle, { color: t.textPrim }]}>Sede activa</Text>
                <Text style={[mo.switchSub, { color: t.textMuted }]}>Si está inactiva, no opera ni recibe pedidos.</Text>
              </View>
              <Switch
                value={form.activo}
                onValueChange={(v) => setForm({ ...form, activo: v })}
                trackColor={{ false: '#3a3a3a', true: t.color }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <View style={[mo.footer, { borderTopColor: t.border }]}>
            <TouchableOpacity
              style={[mo.btnGuardar, { backgroundColor: t.color }, guardando && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Icon name="save" size={14} color="#fff" style={{ marginRight: 8 }} /><Text style={mo.btnGuardarText}>GUARDAR SEDE</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SedesScreen() {
  const t = useTema();
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sedeEditar, setSedeEditar] = useState(null);
  const [rolUsuario, setRolUsuario] = useState('');

  const esDueno = ['dueño', 'admin', 'administrador'].includes(rolUsuario.toLowerCase());

  const cargar = useCallback(async () => {
    try {
      const negocioId = await EncryptedStorage.getItem('negocio_id');
      const rol = await EncryptedStorage.getItem('usuario_rol') || '';
      setRolUsuario(rol);
      const res = await getSedes({ negocio_id: negocioId });
      setSedes(Array.isArray(res.data) ? res.data : (res.data.results ?? []));
    } catch (e) {
      console.error('Error cargando sedes:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);
  const onRefresh = () => { setRefreshing(true); cargar(); };

  const handleGuardar = async (form) => {
    const negocioId = await EncryptedStorage.getItem('negocio_id');
    const payload = { nombre: form.nombre, direccion: form.direccion, activo: form.activo, negocio: negocioId };
    if (sedeEditar) await actualizarSede(sedeEditar.id, payload);
    else await crearSede(payload);
    await cargar();
  };

  if (cargando) {
    return (
      <View style={[s.loader, { backgroundColor: t.bg }]}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
        <ActivityIndicator size="large" color={t.color} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.color} />}
      >
        <View style={s.header}>
          <View style={[s.headerIcono, { backgroundColor: `${t.color}15` }]}>
            <Icon name="map-marker" size={26} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitulo, { color: t.textPrim }]}>Mis <Text style={{ color: t.color }}>Sedes</Text></Text>
            <Text style={[s.headerDesc, { color: t.textSec }]}>Locales de tu negocio.</Text>
          </View>
        </View>

        {esDueno && (
          <TouchableOpacity
            style={[s.btnNuevo, { backgroundColor: t.color }]}
            onPress={() => { setSedeEditar(null); setModalVisible(true); }}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={12} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.btnNuevoText}>NUEVA SEDE</Text>
          </TouchableOpacity>
        )}

        {sedes.length === 0 ? (
          <View style={[s.empty, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <Icon name="map-marker" size={40} color={t.textMuted} />
            <Text style={[s.emptyTitulo, { color: t.textPrim }]}>Sin sedes</Text>
            <Text style={[s.emptyDesc, { color: t.textSec }]}>Aún no registras locales.</Text>
          </View>
        ) : sedes.map(sede => (
          <View key={sede.id} style={[s.card, { backgroundColor: t.bgCard, borderColor: t.border }, !sede.activo && { opacity: 0.6 }]}>
            <View style={[s.cardIcono, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
              <Icon name="building" size={18} color={t.textSec} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardName, { color: t.textPrim }]}>{sede.nombre}</Text>
              <Text style={[s.cardDir, { color: t.textMuted }]} numberOfLines={1}>{sede.direccion || 'Sin dirección'}</Text>
              <View style={[s.badge, sede.activo
                ? { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }
                : { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                <Text style={[s.badgeText, { color: sede.activo ? '#10b981' : '#ef4444' }]}>{sede.activo ? 'ACTIVA' : 'INACTIVA'}</Text>
              </View>
            </View>
            {esDueno && (
              <TouchableOpacity
                style={[s.editBtn, { backgroundColor: t.bgCard2, borderColor: t.border }]}
                onPress={() => { setSedeEditar(sede); setModalVisible(true); }}
              >
                <Icon name="pencil" size={14} color={t.color} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <ModalSede
        visible={modalVisible}
        sede={sedeEditar}
        t={t}
        onGuardar={handleGuardar}
        onCerrar={() => { setModalVisible(false); setSedeEditar(null); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content:   { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16, paddingBottom: 40 },
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', alignItems: 'center', paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginBottom: 20 },
  headerIcono:{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitulo:{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  headerDesc:  { fontSize: 12, lineHeight: 18 },
  btnNuevo:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginBottom: 20 },
  btnNuevoText:{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  empty:      { padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginVertical: 20 },
  emptyTitulo:{ fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  emptyDesc:  { fontSize: 13, textAlign: 'center' },
  card:       { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 12 },
  cardIcono:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 14 },
  cardName:   { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, marginBottom: 2 },
  cardDir:    { fontSize: 12, marginBottom: 8 },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText:  { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  editBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 10 },
});

const mo = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal:     { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, maxHeight: '90%' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  titulo:    { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:      { padding: 24, paddingBottom: 20 },
  label:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  input:     { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 16 },
  switchTitle:{ fontSize: 14, fontWeight: '800' },
  switchSub: { fontSize: 11, marginTop: 2, maxWidth: 220 },
  footer:    { padding: 24, borderTopWidth: 1 },
  btnGuardar:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 18 },
  btnGuardarText:{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});
