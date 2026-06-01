import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getClientes } from '../../api/api';
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

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const M = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};

export default function ClientesScreen() {
  const t = useTema();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      const negocioId = await EncryptedStorage.getItem('negocio_id');
      const res = await getClientes({ negocio_id: negocioId });
      setClientes(Array.isArray(res.data) ? res.data : (res.data.results ?? []));
    } catch (e) {
      console.error('Error cargando clientes:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);
  const onRefresh = () => { setRefreshing(true); cargar(); };

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
  });

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
            <Icon name="users" size={26} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitulo, { color: t.textPrim }]}>Mis <Text style={{ color: t.color }}>Clientes</Text></Text>
            <Text style={[s.headerDesc, { color: t.textSec }]}>{clientes.length} clientes registrados.</Text>
          </View>
        </View>

        <View style={[s.searchBox, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <Icon name="search" size={16} color={t.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[s.searchInput, { color: t.textPrim }]}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre o teléfono..."
            placeholderTextColor={t.textMuted}
          />
        </View>

        {filtrados.length === 0 ? (
          <View style={[s.empty, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <Icon name="user-o" size={40} color={t.textMuted} />
            <Text style={[s.emptyTitulo, { color: t.textPrim }]}>Sin clientes</Text>
            <Text style={[s.emptyDesc, { color: t.textSec }]}>No hay clientes que coincidan.</Text>
          </View>
        ) : filtrados.map(c => (
          <View key={c.id} style={[s.card, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <View style={[s.avatar, { backgroundColor: `${t.color}15`, borderColor: `${t.color}30` }]}>
              <Text style={[s.avatarText, { color: t.color }]}>{(c.nombre || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardName, { color: t.textPrim }]} numberOfLines={1}>{c.nombre || 'Sin nombre'}</Text>
              <View style={s.metaRow}>
                <Icon name="phone" size={11} color={t.textMuted} style={{ marginRight: 5 }} />
                <Text style={[s.metaText, { color: t.textSec }]}>{c.telefono || 'Sin teléfono'}</Text>
              </View>
              <Text style={[s.fecha, { color: t.textMuted }]}>Últ. compra: {fmtFecha(c.ultima_compra)}</Text>
            </View>
            <View style={s.statsCol}>
              <Text style={[s.gastado, { color: '#10b981' }]}>S/ {parseFloat(c.total_gastado || 0).toFixed(0)}</Text>
              <View style={[s.puntosBadge, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
                <Icon name="star" size={9} color="#eab308" style={{ marginRight: 4 }} />
                <Text style={[s.puntosText, { color: t.textSec }]}>{c.puntos_acumulados ?? 0} pts</Text>
              </View>
              <Text style={[s.pedidos, { color: t.textMuted }]}>{c.cantidad_pedidos ?? 0} pedidos</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  searchBox:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16 },
  searchInput:{ flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: '600' },
  empty:      { padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginVertical: 20 },
  emptyTitulo:{ fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  emptyDesc:  { fontSize: 13, textAlign: 'center' },
  card:       { flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 10 },
  avatar:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: '900' },
  cardName:   { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText:   { fontSize: 12, fontWeight: '600' },
  fecha:      { fontSize: 10, fontWeight: '600' },
  statsCol:   { alignItems: 'flex-end', gap: 5, marginLeft: 8 },
  gastado:    { fontSize: 15, fontWeight: '900' },
  puntosBadge:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  puntosText: { fontSize: 9, fontWeight: '800' },
  pedidos:    { fontSize: 10, fontWeight: '600' },
});
