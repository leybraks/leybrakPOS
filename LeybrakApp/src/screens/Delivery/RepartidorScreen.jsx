import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator, Linking, Alert, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useAppStore from '../../store/useAppStore';
import {
  getPedidosDelivery, tomarPedidoDelivery, actualizarEstadoDelivery,
} from '../../api/api';

const ESTADOS = {
  pendiente: { label: 'Disponible', color: '#3b82f6' },
  asignado:  { label: 'Asignado',   color: '#f59e0b' },
  en_camino: { label: 'En camino',  color: '#8b5cf6' },
  entregado: { label: 'Entregado',  color: '#10b981' },
};

export default function RepartidorScreen() {
  const { configuracionGlobal } = useAppStore();
  const isDark = configuracionGlobal?.temaFondo !== 'light';
  const color  = configuracionGlobal?.colorPrimario || '#ff5a1f';

  const t = {
    bg:      isDark ? '#050505' : '#f0f0f0',
    card:    isDark ? '#111111' : '#ffffff',
    border:  isDark ? '#1f1f1f' : '#e5e7eb',
    text:    isDark ? '#ffffff' : '#111111',
    sub:     isDark ? '#9ca3af' : '#6b7280',
    mut:     isDark ? '#4b5563' : '#9ca3af',
  };

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [accionando, setAccionando] = useState(null);   // id en proceso

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const res = await getPedidosDelivery();
      setPedidos(res.data?.pedidos || []);
    } catch (e) {
      if (!silencioso) Alert.alert('Error', 'No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(() => cargar(true), 20000);   // refresco cada 20s
    return () => clearInterval(id);
  }, [cargar]);

  const onRefresh = () => { setRefrescando(true); cargar(true); };

  const abrirMaps = (p) => {
    if (p.latitud == null || p.longitud == null) {
      Alert.alert('Sin ubicación', 'Este pedido no tiene coordenadas. Dirección: ' + (p.direccion || '—'));
      return;
    }
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.latitud},${p.longitud}`);
  };

  const ejecutar = async (id, fn) => {
    setAccionando(id);
    try {
      await fn();
      await cargar(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo actualizar el pedido.');
    } finally {
      setAccionando(null);
    }
  };

  const tomar     = (p) => ejecutar(p.id, () => tomarPedidoDelivery(p.id));
  const enCamino  = (p) => ejecutar(p.id, () => actualizarEstadoDelivery(p.id, 'en_camino'));
  const entregar  = (p) => Alert.alert('Confirmar entrega', `¿Marcar el pedido #${p.id} como entregado?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Entregado', onPress: () => ejecutar(p.id, () => actualizarEstadoDelivery(p.id, 'entregado')) },
  ]);

  const renderItem = ({ item: p }) => {
    const est = ESTADOS[p.estado_delivery] || ESTADOS.pendiente;
    const ocupado = accionando === p.id;
    const pagado = p.estado_pago === 'pagado';
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        {/* Header */}
        <View style={s.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={[s.cliente, { color: t.text }]}>{p.cliente_nombre}</Text>
            <Text style={[s.pedidoId, { color: t.mut }]}>Pedido #{p.id}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: est.color + '22' }]}>
            <Text style={[s.badgeText, { color: est.color }]}>{est.label}</Text>
          </View>
        </View>

        {/* Dirección */}
        <View style={s.row}>
          <Icon name="map-marker" size={15} color={t.sub} style={{ width: 20 }} />
          <Text style={[s.rowText, { color: t.sub }]} numberOfLines={2}>{p.direccion || 'Sin dirección'}</Text>
        </View>

        {/* Items */}
        {p.items?.length > 0 && (
          <View style={s.row}>
            <Icon name="shopping-bag" size={14} color={t.sub} style={{ width: 20 }} />
            <Text style={[s.rowText, { color: t.sub }]} numberOfLines={2}>
              {p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
            </Text>
          </View>
        )}

        {/* Total + cobro */}
        <View style={[s.row, { marginTop: 6 }]}>
          <Icon name="money" size={14} color={t.sub} style={{ width: 20 }} />
          <Text style={[s.rowText, { color: t.text, fontWeight: '800' }]}>S/ {p.total.toFixed(2)}</Text>
          <View style={[s.cobroTag, { backgroundColor: pagado ? '#10b98122' : '#f59e0b22' }]}>
            <Text style={[s.cobroText, { color: pagado ? '#10b981' : '#f59e0b' }]}>
              {pagado ? 'PAGADO' : 'COBRAR AL ENTREGAR'}
            </Text>
          </View>
        </View>
        {!pagado && !!p.metodo_pago_esperado && (
          <Text style={[s.metodo, { color: t.mut }]}>Método: {p.metodo_pago_esperado}</Text>
        )}

        {/* Acciones */}
        <View style={s.acciones}>
          {p.estado_delivery !== 'pendiente' && (
            <TouchableOpacity style={[s.btnSec, { borderColor: t.border }]} onPress={() => abrirMaps(p)} activeOpacity={0.8}>
              <Icon name="location-arrow" size={14} color={t.text} />
              <Text style={[s.btnSecText, { color: t.text }]}>Navegar</Text>
            </TouchableOpacity>
          )}

          {p.estado_delivery === 'pendiente' && (
            <TouchableOpacity style={[s.btnMain, { backgroundColor: color }]} onPress={() => tomar(p)} disabled={ocupado} activeOpacity={0.85}>
              {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={s.btnMainText}>Tomar pedido</Text>}
            </TouchableOpacity>
          )}
          {p.estado_delivery === 'asignado' && (
            <TouchableOpacity style={[s.btnMain, { backgroundColor: '#8b5cf6' }]} onPress={() => enCamino(p)} disabled={ocupado} activeOpacity={0.85}>
              {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={s.btnMainText}>Salir / En camino</Text>}
            </TouchableOpacity>
          )}
          {p.estado_delivery === 'en_camino' && (
            <TouchableOpacity style={[s.btnMain, { backgroundColor: '#10b981' }]} onPress={() => entregar(p)} disabled={ocupado} activeOpacity={0.85}>
              {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={s.btnMainText}>Marcar entregado</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <View style={s.header}>
        <Text style={[s.titulo, { color: t.text }]}>🛵 Reparto</Text>
        <Text style={[s.subtitulo, { color: t.sub }]}>
          {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color={color} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={color} />}
          ListEmptyComponent={
            <View style={s.vacio}>
              <Icon name="motorcycle" size={40} color={t.mut} />
              <Text style={[s.vacioText, { color: t.mut }]}>No hay pedidos de delivery por ahora.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:    { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  titulo:    { fontSize: 26, fontWeight: '900' },
  subtitulo: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  card:      { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHead:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cliente:   { fontSize: 16, fontWeight: '800' },
  pedidoId:  { fontSize: 11, fontWeight: '700', marginTop: 2 },
  badge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  row:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowText:   { fontSize: 13, flex: 1 },
  cobroTag:  { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cobroText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  metodo:    { fontSize: 11, marginTop: 4, marginLeft: 20 },
  acciones:  { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnMain:   { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnMainText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  btnSec:    { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 46, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  btnSecText:{ fontWeight: '800', fontSize: 13 },
  vacio:     { alignItems: 'center', marginTop: 80, gap: 12 },
  vacioText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },
});
