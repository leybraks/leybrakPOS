import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  getSedes, getCatalogoGlobal, getInsumosSede, registrarIngresoMasivo,
} from '../../api/api';
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

// Modal para ingresar/transferir cantidad
function ModalCantidad({ visible, item, modo, t, onConfirmar, onCerrar }) {
  const [cant, setCant] = useState('');
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (visible) setCant(''); }, [visible]);
  if (!item) return null;

  const titulo = modo === 'matriz' ? 'Añadir al Almacén' : 'Enviar a la sede';
  const handle = async () => {
    const n = parseFloat(cant);
    if (!n || n <= 0) { Alert.alert('Error', 'Ingresa una cantidad válida.'); return; }
    setGuardando(true);
    try { await onConfirmar(item, n); onCerrar(); }
    catch (e) { Alert.alert('Error', e?.response?.data?.error || 'No se pudo registrar.'); }
    finally { setGuardando(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={mo.overlay}>
        <View style={[mo.modal, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <View style={[mo.header, { borderBottomColor: t.border }]}>
            <Text style={[mo.titulo, { color: t.textPrim }]}>{titulo}</Text>
            <TouchableOpacity onPress={onCerrar} style={[mo.closeBtn, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
              <Icon name="times" size={14} color={t.textSec} />
            </TouchableOpacity>
          </View>
          <View style={mo.body}>
            <Text style={[mo.insumoNombre, { color: t.textPrim }]}>{item.nombre}</Text>
            <Text style={[mo.label, { color: t.textMuted, marginTop: 16 }]}>CANTIDAD ({item.unidad_medida || 'und'})</Text>
            <TextInput
              style={[mo.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={cant}
              onChangeText={(v) => setCant(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.0"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <View style={[mo.footer, { borderTopColor: t.border }]}>
            <TouchableOpacity
              style={[mo.btn, { backgroundColor: t.color }, guardando && { opacity: 0.6 }]}
              onPress={handle} disabled={guardando} activeOpacity={0.85}
            >
              {guardando ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Icon name="check" size={14} color="#fff" style={{ marginRight: 8 }} /><Text style={mo.btnText}>CONFIRMAR</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function InventarioScreen() {
  const t = useTema();
  const [rolUsuario, setRolUsuario] = useState('');
  const esDueno = ['dueño', 'admin', 'administrador'].includes(rolUsuario.toLowerCase());

  const [modo, setModo] = useState('matriz'); // 'matriz' | 'sede'
  const [sedes, setSedes] = useState([]);
  const [sedeActiva, setSedeActiva] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [insumosSede, setInsumosSede] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalItem, setModalItem] = useState(null);

  const cargarBase = useCallback(async () => {
    try {
      const negocioId = await EncryptedStorage.getItem('negocio_id');
      const rol = await EncryptedStorage.getItem('usuario_rol') || '';
      const sedeId = await EncryptedStorage.getItem('sede_id') || '';
      setRolUsuario(rol);
      const [resSedes, resCat] = await Promise.all([
        getSedes({ negocio_id: negocioId }),
        getCatalogoGlobal(),
      ]);
      const listaSedes = Array.isArray(resSedes.data) ? resSedes.data : (resSedes.data.results ?? []);
      setSedes(listaSedes);
      setCatalogo(Array.isArray(resCat.data) ? resCat.data : (resCat.data.results ?? []));

      const esD = ['dueño', 'admin', 'administrador'].includes(rol.toLowerCase());
      if (!esD) {
        const mia = listaSedes.find(s => String(s.id) === String(sedeId)) || listaSedes[0];
        setModo('sede');
        setSedeActiva(mia || null);
      }
    } catch (e) {
      console.error('Error cargando inventario:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarBase(); }, []);

  useEffect(() => {
    if (modo === 'sede' && sedeActiva) {
      getInsumosSede({ sede_id: sedeActiva.id })
        .then(res => setInsumosSede(Array.isArray(res.data) ? res.data : (res.data.results ?? [])))
        .catch(() => setInsumosSede([]));
    }
  }, [modo, sedeActiva]);

  const refrescar = async () => {
    const resCat = await getCatalogoGlobal();
    setCatalogo(Array.isArray(resCat.data) ? resCat.data : (resCat.data.results ?? []));
    if (sedeActiva) {
      const resStock = await getInsumosSede({ sede_id: sedeActiva.id });
      setInsumosSede(Array.isArray(resStock.data) ? resStock.data : (resStock.data.results ?? []));
    }
  };

  const onRefresh = () => { setRefreshing(true); cargarBase().then(refrescar); };

  // Lista a mostrar según modo
  const items = (modo === 'sede' && sedeActiva)
    ? catalogo.map(base => {
        const local = insumosSede.find(s => (s.insumo_base === base.id) || (s.insumo_base?.id === base.id));
        return { ...base, stock_actual: local ? local.stock_actual : 0, stock_minimo: local ? local.stock_minimo : 5 };
      })
    : catalogo;

  const filtrados = items.filter(it => (it.nombre || it.nombre_insumo || '').toLowerCase().includes(busqueda.toLowerCase()));

  const confirmarCantidad = async (item, cantidad) => {
    if (modo === 'matriz') {
      await registrarIngresoMasivo({ insumo_base_id: item.id, ingreso_global: cantidad, distribucion: {} });
    } else {
      await registrarIngresoMasivo({ insumo_base_id: item.id, ingreso_global: 0, distribucion: { [sedeActiva.id]: cantidad } });
    }
    await refrescar();
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
            <Icon name="cube" size={26} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitulo, { color: t.textPrim }]}>Inventario</Text>
            <Text style={[s.headerDesc, { color: t.textSec }]}>
              {modo === 'matriz' ? 'Almacén central del negocio.' : `Stock de ${sedeActiva?.nombre || 'la sede'}.`}
            </Text>
          </View>
        </View>

        {/* Toggle modo (solo dueño) */}
        {esDueno && (
          <View style={[s.toggle, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <TouchableOpacity
              style={[s.toggleBtn, modo === 'matriz' && { backgroundColor: t.bgCard2 }]}
              onPress={() => setModo('matriz')}
            >
              <Icon name="database" size={13} color={modo === 'matriz' ? t.color : t.textSec} style={{ marginRight: 6 }} />
              <Text style={[s.toggleText, { color: modo === 'matriz' ? t.textPrim : t.textSec }]}>Almacén</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, modo === 'sede' && { backgroundColor: t.bgCard2 }]}
              onPress={() => { setModo('sede'); if (!sedeActiva) setSedeActiva(sedes[0] || null); }}
            >
              <Icon name="building" size={13} color={modo === 'sede' ? t.color : t.textSec} style={{ marginRight: 6 }} />
              <Text style={[s.toggleText, { color: modo === 'sede' ? t.textPrim : t.textSec }]}>Por Sede</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selector de sede */}
        {modo === 'sede' && esDueno && sedes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {sedes.map(sede => (
              <TouchableOpacity
                key={sede.id}
                style={[s.sedeChip, { backgroundColor: t.bgCard, borderColor: t.border },
                  String(sedeActiva?.id) === String(sede.id) && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                onPress={() => setSedeActiva(sede)}
              >
                <Text style={[s.sedeChipText, { color: String(sedeActiva?.id) === String(sede.id) ? t.color : t.textSec }]}>{sede.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Búsqueda */}
        <View style={[s.searchBox, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <Icon name="search" size={16} color={t.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[s.searchInput, { color: t.textPrim }]}
            value={busqueda} onChangeText={setBusqueda}
            placeholder="Buscar insumo..." placeholderTextColor={t.textMuted}
          />
        </View>

        {filtrados.length === 0 ? (
          <View style={[s.empty, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <Icon name="cube" size={40} color={t.textMuted} />
            <Text style={[s.emptyTitulo, { color: t.textPrim }]}>Sin insumos</Text>
            <Text style={[s.emptyDesc, { color: t.textSec }]}>No hay insumos que coincidan.</Text>
          </View>
        ) : filtrados.map(item => {
          const esSede = modo === 'sede';
          const stock = parseFloat(esSede ? item.stock_actual : item.stock_general) || 0;
          const min = parseFloat(item.stock_minimo) || 5;
          const critico = esSede && stock <= min;
          return (
            <View key={item.id} style={[s.card, { backgroundColor: t.bgCard, borderColor: critico ? 'rgba(239,68,68,0.3)' : t.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardName, { color: t.textPrim }]} numberOfLines={1}>{item.nombre || item.nombre_insumo}</Text>
                <View style={[s.badge, critico
                  ? { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }
                  : esSede ? { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }
                           : { backgroundColor: `${t.color}15`, borderColor: `${t.color}30` }]}>
                  <Text style={[s.badgeText, { color: critico ? '#ef4444' : esSede ? '#10b981' : t.color }]}>
                    {critico ? 'STOCK BAJO' : esSede ? 'STOCK LOCAL' : 'ALMACÉN'}
                  </Text>
                </View>
              </View>
              <View style={s.stockCol}>
                <Text style={[s.stockNum, { color: t.textPrim }]}>{stock}
                  <Text style={[s.stockUnidad, { color: t.textMuted }]}> {item.unidad_medida || ''}</Text>
                </Text>
                {esSede && <Text style={[s.minText, { color: t.textMuted }]}>mín: {min}</Text>}
              </View>
              {esDueno && (
                <TouchableOpacity
                  style={[s.addBtn, { backgroundColor: t.color }]}
                  onPress={() => setModalItem(item)}
                  activeOpacity={0.85}
                >
                  <Icon name="plus" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <ModalCantidad
        visible={!!modalItem}
        item={modalItem}
        modo={modo}
        t={t}
        onConfirmar={confirmarCantidad}
        onCerrar={() => setModalItem(null)}
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
  toggle:     { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 16 },
  toggleBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  toggleText: { fontSize: 12, fontWeight: '800' },
  sedeChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  sedeChipText:{ fontSize: 11, fontWeight: '800' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16 },
  searchInput:{ flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: '600' },
  empty:      { padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginVertical: 20 },
  emptyTitulo:{ fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  emptyDesc:  { fontSize: 13, textAlign: 'center' },
  card:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 10 },
  cardName:   { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText:  { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  stockCol:   { alignItems: 'flex-end', marginHorizontal: 12 },
  stockNum:   { fontSize: 22, fontWeight: '900' },
  stockUnidad:{ fontSize: 11, fontWeight: '700' },
  minText:    { fontSize: 10, fontWeight: '600', marginTop: 2 },
  addBtn:     { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

const mo = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal:     { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  titulo:    { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:      { padding: 24 },
  insumoNombre:{ fontSize: 16, fontWeight: '900' },
  label:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  input:     { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 20, fontWeight: '800' },
  footer:    { padding: 24, borderTopWidth: 1 },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 18 },
  btnText:   { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});
