import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Linking,
  Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getNegocio, actualizarFacturacion, getComprobantes } from '../../api/api';
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

const MODOS = [
  { id: 'desactivado', titulo: 'Desactivado', desc: 'No se declara nada. El POS funciona solo con el Ticket Digital.' },
  { id: 'opcional',    titulo: 'Opcional',    desc: 'Aparece la opción al cobrar para emitir solo si el cliente lo pide.' },
  { id: 'automatico',  titulo: 'Automático',  desc: 'Toda venta abre el comprobante al cobrar (boleta por defecto).' },
];

const ESTADO = {
  aceptado:  { bg: 'rgba(16,185,129,0.12)', fg: '#10b981', t: 'Aceptado' },
  rechazado: { bg: 'rgba(239,68,68,0.12)',  fg: '#ef4444', t: 'Rechazado' },
  pendiente: { bg: 'rgba(234,179,8,0.12)',  fg: '#eab308', t: 'Pendiente' },
  anulado:   { bg: 'rgba(107,114,128,0.12)',fg: '#6b7280', t: 'Anulado' },
};

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function FacturacionScreen() {
  const t = useTema();

  const [negocioId, setNegocioId] = useState(null);
  const [emision, setEmision]         = useState('desactivado');
  const [entorno, setEntorno]         = useState('demo');
  const [ruta, setRuta]               = useState('');
  const [token, setToken]             = useState('');
  const [serieBoleta, setSerieBoleta] = useState('B001');
  const [serieFactura, setSerieFactura] = useState('F001');
  const [ruc, setRuc]                 = useState('');
  const [razon, setRazon]             = useState('');

  const [cargando, setCargando]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]             = useState(null);
  const [historial, setHistorial] = useState([]);

  const cargar = useCallback(async () => {
    try {
      const id = await EncryptedStorage.getItem('negocio_id');
      setNegocioId(id);
      const [resNeg, resComp] = await Promise.all([
        getNegocio(id),
        getComprobantes().catch(() => ({ data: { comprobantes: [] } })),
      ]);
      const d = resNeg.data;
      setEmision(d.facturacion_emision || 'desactivado');
      setEntorno(d.facturacion_entorno || 'demo');
      setRuta(d.facturacion_ruta || '');
      setSerieBoleta(d.facturacion_serie_boleta || 'B001');
      setSerieFactura(d.facturacion_serie_factura || 'F001');
      setRuc(d.ruc || '');
      setRazon(d.razon_social || '');
      setHistorial(resComp.data?.comprobantes || []);
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'No se pudo cargar la configuración.' });
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);
  const onRefresh = () => { setRefreshing(true); cargar(); };

  const guardar = async () => {
    setGuardando(true); setMsg(null);
    const payload = {
      facturacion_emision: emision,
      facturacion_entorno: entorno,
      facturacion_ruta: ruta,
      facturacion_serie_boleta: serieBoleta.toUpperCase(),
      facturacion_serie_factura: serieFactura.toUpperCase(),
    };
    if (token) payload.facturacion_token = token;   // no sobreescribir si está vacío
    try {
      await actualizarFacturacion(negocioId, payload);
      setMsg({ tipo: 'ok', texto: 'Configuración guardada.' });
      setToken('');
      // refrescar config global para que el cobro use el nuevo modo de inmediato
      const { configuracionGlobal, setConfiguracionGlobal } = useAppStore.getState();
      setConfiguracionGlobal({ ...configuracionGlobal, facturacion_emision: emision });
    } catch (e) {
      setMsg({ tipo: 'error', texto: e?.response?.data?.error || 'No se pudo guardar.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={[s.loader, { backgroundColor: t.bg }]}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
        <ActivityIndicator size="large" color={t.color} />
      </View>
    );
  }

  const faltaRuc = !ruc || !razon;

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.color} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={[s.headerIcono, { backgroundColor: `${t.color}15` }]}>
            <Icon name="file-text" size={24} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitulo, { color: t.textPrim }]}>
              Facturación <Text style={{ color: t.color }}>Electrónica</Text>
            </Text>
            <Text style={[s.headerDesc, { color: t.textSec }]}>Boletas y Facturas a SUNAT vía Nubefact.</Text>
          </View>
        </View>

        {faltaRuc && (
          <View style={[s.aviso, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }]}>
            <Icon name="exclamation-triangle" size={14} color="#f59e0b" />
            <Text style={[s.avisoText, { color: '#f59e0b' }]}>
              Configura el RUC y la razón social del negocio (en Ajustes) antes de emitir.
            </Text>
          </View>
        )}

        {/* Modo de emisión */}
        <Text style={[s.seccion, { color: t.textMuted }]}>MODO DE EMISIÓN</Text>
        <View style={{ gap: 10 }}>
          {MODOS.map(m => {
            const activo = emision === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => setEmision(m.id)}
                style={[
                  s.modo,
                  { backgroundColor: t.bgCard, borderColor: t.border },
                  activo && { borderColor: t.color, backgroundColor: `${t.color}10` },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.modoTitulo, { color: t.textPrim }]}>{m.titulo}</Text>
                  <Text style={[s.modoDesc, { color: t.textSec }]}>{m.desc}</Text>
                </View>
                <Icon
                  name={activo ? 'check-circle' : 'circle-o'}
                  size={20}
                  color={activo ? t.color : t.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conexión Nubefact */}
        {emision !== 'desactivado' && (
          <>
            <Text style={[s.seccion, { color: t.textMuted, marginTop: 24 }]}>CONEXIÓN CON NUBEFACT</Text>

            {/* Entorno */}
            <View style={[s.toggle, { backgroundColor: t.bgInput, borderColor: t.border }]}>
              {[['demo', 'Demo (pruebas)'], ['produccion', 'Producción']].map(([id, label]) => {
                const activo = entorno === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[s.toggleBtn, activo && { backgroundColor: t.color }]}
                    onPress={() => setEntorno(id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.toggleText, { color: activo ? '#fff' : t.textSec }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[s.hint, { color: entorno === 'demo' ? '#f59e0b' : t.textSec }]}>
              {entorno === 'demo'
                ? 'Modo DEMO: cuenta de prueba de demo.nubefact.com. Los comprobantes NO tienen valor legal.'
                : 'Producción: comprobantes reales declarados a SUNAT bajo tu RUC.'}
            </Text>

            <Text style={[s.label, { color: t.textMuted }]}>RUTA / URL DE TU CUENTA NUBEFACT</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={ruta}
              onChangeText={setRuta}
              autoCapitalize="none"
              placeholder="https://api.nubefact.com/api/v1/..."
              placeholderTextColor={t.textMuted}
            />

            <Text style={[s.label, { color: t.textMuted }]}>TOKEN (vacío = mantener el actual)</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={token}
              onChangeText={setToken}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••••••"
              placeholderTextColor={t.textMuted}
            />

            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: t.textMuted }]}>SERIE BOLETA</Text>
                <TextInput
                  style={[s.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
                  value={serieBoleta}
                  onChangeText={(v) => setSerieBoleta(v.toUpperCase().slice(0, 4))}
                  autoCapitalize="characters"
                  placeholder="B001"
                  placeholderTextColor={t.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: t.textMuted }]}>SERIE FACTURA</Text>
                <TextInput
                  style={[s.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
                  value={serieFactura}
                  onChangeText={(v) => setSerieFactura(v.toUpperCase().slice(0, 4))}
                  autoCapitalize="characters"
                  placeholder="F001"
                  placeholderTextColor={t.textMuted}
                />
              </View>
            </View>
            <Text style={[s.hint, { color: t.textMuted }]}>
              Las series deben coincidir con las registradas en tu cuenta Nubefact. Los correlativos son automáticos.
            </Text>
          </>
        )}

        {/* Mensaje */}
        {msg && (
          <View style={[s.msg, {
            backgroundColor: msg.tipo === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          }]}>
            <Icon name={msg.tipo === 'ok' ? 'check-circle' : 'exclamation-triangle'} size={14} color={msg.tipo === 'ok' ? '#10b981' : '#ef4444'} />
            <Text style={[s.msgText, { color: msg.tipo === 'ok' ? '#10b981' : '#ef4444' }]}>{msg.texto}</Text>
          </View>
        )}

        {/* Guardar */}
        <TouchableOpacity
          style={[s.btnGuardar, { backgroundColor: t.color }, guardando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando
            ? <ActivityIndicator color="#fff" />
            : <><Icon name="save" size={15} color="#fff" style={{ marginRight: 8 }} /><Text style={s.btnGuardarText}>Guardar configuración</Text></>}
        </TouchableOpacity>

        {/* Historial */}
        <View style={s.histHeader}>
          <Text style={[s.seccion, { color: t.textMuted, marginTop: 0 }]}>COMPROBANTES EMITIDOS</Text>
          <TouchableOpacity onPress={onRefresh}><Text style={[s.refrescar, { color: t.color }]}>Actualizar</Text></TouchableOpacity>
        </View>

        {historial.length === 0 ? (
          <View style={[s.empty, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <Icon name="file-o" size={36} color={t.textMuted} />
            <Text style={[s.emptyText, { color: t.textSec }]}>Aún no se ha emitido ningún comprobante.</Text>
          </View>
        ) : historial.map(c => {
          const e = ESTADO[c.estado_sunat] || ESTADO.pendiente;
          return (
            <View key={c.id} style={[s.comp, { backgroundColor: t.bgCard, borderColor: t.border }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={s.compTop}>
                  <Text style={[s.compNum, { color: t.textPrim }]}>
                    {c.tipo === 'factura' ? 'Factura' : 'Boleta'} {c.serie}-{c.numero}
                  </Text>
                  <View style={[s.estadoBadge, { backgroundColor: e.bg }]}>
                    <Text style={[s.estadoText, { color: e.fg }]}>{e.t}</Text>
                  </View>
                </View>
                <Text style={[s.compSub, { color: t.textMuted }]} numberOfLines={1}>
                  {c.receptor_denominacion || 'Cliente varios'}
                  {c.receptor_num_doc ? ` · ${c.receptor_num_doc}` : ''} · {fmtFecha(c.creado_en)}
                </Text>
              </View>
              <Text style={[s.compTotal, { color: t.textPrim }]}>S/ {parseFloat(c.total || 0).toFixed(2)}</Text>
              {!!c.enlace_pdf && (
                <TouchableOpacity
                  style={[s.pdfBtn, { backgroundColor: `${t.color}20` }]}
                  onPress={() => Linking.openURL(c.enlace_pdf)}
                >
                  <Icon name="download" size={15} color={t.color} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content:   { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16, paddingBottom: 100 },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIcono:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerDesc:   { fontSize: 12, marginTop: 2 },

  aviso:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 18 },
  avisoText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  seccion: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12, marginTop: 8 },

  modo:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1 },
  modoTitulo: { fontSize: 15, fontWeight: '900' },
  modoDesc:   { fontSize: 12, marginTop: 3, lineHeight: 16 },

  toggle:     { flexDirection: 'row', borderRadius: 14, padding: 4, borderWidth: 1, marginBottom: 10 },
  toggleBtn:  { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  toggleText: { fontSize: 13, fontWeight: '800' },

  hint:  { fontSize: 11, marginTop: 6, marginBottom: 4, lineHeight: 15 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
  row2:  { flexDirection: 'row', gap: 12 },

  msg:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 18 },
  msgText: { fontSize: 13, fontWeight: '700', flex: 1 },

  btnGuardar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, marginTop: 18 },
  btnGuardarText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  histHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 4 },
  refrescar:  { fontSize: 12, fontWeight: '800' },

  empty:     { alignItems: 'center', gap: 10, paddingVertical: 36, borderRadius: 18, borderWidth: 1 },
  emptyText: { fontSize: 13, fontWeight: '600' },

  comp:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  compTop:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compNum:    { fontSize: 14, fontWeight: '900' },
  compSub:    { fontSize: 11, marginTop: 3 },
  compTotal:  { fontSize: 14, fontWeight: '800' },
  estadoBadge:{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  estadoText: { fontSize: 9, fontWeight: '900' },
  pdfBtn:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
