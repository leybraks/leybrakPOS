import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  Platform, StatusBar, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import useAppStore from '../../store/useAppStore';

// ─── IMPORTACIONES DE API Y POS (Basadas en tu versión web) ───
import api, {
  getMesas, getSedes, getOrdenesLlevar,
  actualizarOrden, actualizarMesa,
  abrirCajaBD, crearOrden, crearPago, 
  registrarMovimientoCaja, validarPinEmpleado
} from '../../api/api';

// ─── Hook de tema ─────────────────────────────────────────────
const useTema = () => {
  const { configuracionGlobal } = useAppStore();
  const isDark = configuracionGlobal.temaFondo !== 'light';
  const color  = configuracionGlobal.colorPrimario || '#ff5a1f'; // Actualizado al naranja de tu web
  return {
    isDark, color,
    bg:        isDark ? '#050505' : '#f0f0f0',
    bgCard:    isDark ? '#141414' : '#ffffff',
    bgCard2:   isDark ? '#1a1a1a' : '#f3f4f6',
    bgInput:   isDark ? '#0a0a0a' : '#f9fafb',
    border:    isDark ? '#222222' : '#e5e7eb',
    border2:   isDark ? '#333333' : '#d1d5db',
    textPrim:  isDark ? '#ffffff' : '#111111',
    textSec:   isDark ? '#9ca3af' : '#6b7280',
    textMuted: isDark ? '#4b5563' : '#9ca3af',
  };
};

// ─── Colores de estado de mesa ─────────────────────────────────
const colorEstado = (estado) => {
  switch (estado) {
    case 'ocupada':   return { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   text: '#ef4444' };
    case 'pidiendo':  return { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.4)',   text: '#eab308' };
    case 'cobrando':  return { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)',  text: '#3b82f6' };
    default:          return { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  text: '#10b981' };
  }
};

const labelEstado = (estado) => {
  switch (estado) {
    case 'ocupada':  return 'Ocupada';
    case 'pidiendo': return 'Pidiendo';
    case 'cobrando': return 'Cobrando';
    default:         return 'Libre';
  }
};

// ─── Tarjeta de mesa ──────────────────────────────────────────
function TarjetaMesa({ mesa, t, color, onPress, seleccionada, modoUnir }) {
  const est = colorEstado(mesa.estado);
  return (
    <TouchableOpacity
      style={[
        s.mesaCard,
        { backgroundColor: est.bg, borderColor: seleccionada ? color : est.border },
        seleccionada && { borderWidth: 2 },
        modoUnir && { borderStyle: 'dashed', borderWidth: 2 }
      ]}
      onPress={() => onPress(mesa)}
      activeOpacity={0.8}
    >
      <Text style={[s.mesaNumero, { color: est.text }]}>{mesa.numero}</Text>
      <View style={[s.mesaEstadoBadge, { backgroundColor: est.border }]}>
        <Text style={[s.mesaEstadoText, { color: est.text }]}>
          {labelEstado(mesa.estado).toUpperCase()}
        </Text>
      </View>
      {mesa.total_orden > 0 && (
        <Text style={[s.mesaTotal, { color: est.text }]}>
          S/ {parseFloat(mesa.total_orden).toFixed(2)}
        </Text>
      )}
      {/* Indicador de mesas unidas */}
      {mesa.unida_a && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Icon name="link" size={8} color={t.textMuted} style={{ marginRight: 3 }} />
          <Text style={{ fontSize: 8, color: t.textMuted }}>Unida a {mesa.unida_a}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Modal cliente llevar ─────────────────────────────────────
function ModalCliente({ visible, t, color, onConfirmar, onCerrar }) {
  const [nombre, setNombre]     = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => { if (visible) { setNombre(''); setTelefono(''); } }, [visible]);

  const handleConfirmar = () => {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio.'); return; }
    onConfirmar({ nombre, telefono });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={mc.overlay}>
        <View style={[mc.modal, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <View style={[mc.header, { borderBottomColor: t.border, backgroundColor: t.bgCard2 }]}>
            <View>
              <Text style={[mc.titulo, { color: t.textPrim }]}>Datos del Cliente</Text>
              <Text style={[mc.sub, { color: t.textSec }]}>Identifica el pedido para llevar</Text>
            </View>
            <TouchableOpacity onPress={onCerrar} style={[mc.closeBtn, { backgroundColor: t.bgCard, borderColor: t.border }]}>
              <Icon name="times" size={14} color={t.textSec} />
            </TouchableOpacity>
          </View>
          <View style={mc.body}>
            <Text style={[mc.label, { color: t.textMuted }]}>NOMBRE (OBLIGATORIO)</Text>
            <TextInput
              style={[mc.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={nombre} onChangeText={setNombre} placeholder="Ej. Carlos Gutiérrez"
              placeholderTextColor={t.textMuted} autoFocus
            />
            <Text style={[mc.label, { color: t.textMuted, marginTop: 16 }]}>WHATSAPP (OPCIONAL)</Text>
            <TextInput
              style={[mc.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={telefono} onChangeText={setTelefono} placeholder="Ej. 999 999 999"
              placeholderTextColor={t.textMuted} keyboardType="phone-pad"
            />
            <TouchableOpacity style={[mc.btnConfirmar, { backgroundColor: color, marginTop: 24 }]} onPress={handleConfirmar}>
              <Text style={mc.btnConfirmarText}>IR AL MENÚ</Text>
              <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────
export default function SalonScreen({ onSeleccionarMesa }) {
  const t = useTema();
  const { estadoCaja, setEstadoCaja, configuracionGlobal } = useAppStore();// Asumiendo que agregas estadoCaja a tu store

  // ── Estados Locales ──
  const [mesas, setMesas]             = useState([]);
  const [sedes, setSedes]             = useState([]);
  const [ordenesLlevar, setOrdenesLlevar] = useState([]);
  const [sedeId, setSedeId]           = useState('');
  const [vistaLocal, setVistaLocal]   = useState(null); 
  const [modulos, setModulos]         = useState({ salon: true, delivery: true });
  const [cargando, setCargando]       = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const wsRef = useRef(null);

  // ── Lógica traída de la Web ──
  const [rolUsuario, setRolUsuario]   = useState('Empleado');
  const [fondoCaja, setFondoCaja]     = useState('');
  const [abriendoCaja, setAbriendoCaja] = useState(false);
  const [modoUnir, setModoUnir]       = useState(false);
  const [mesaPrincipal, setMesaPrincipal] = useState(null);
  
  // ── Modales de POS ──
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  // Nota: Deberás crear/importar estos modales en React Native si no existen aún
  const [drawerVentaRapidaAbierto, setDrawerVentaRapidaAbierto] = useState(false);
  const [modalMovimientosAbierto, setModalMovimientosAbierto] = useState(false);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);

  const cajaAbierta = estadoCaja === 'abierto' || estadoCaja?.estado === 'abierto';
  const esDueño = ['dueño', 'admin', 'administrador'].includes(rolUsuario.toLowerCase());
  const puedeAbrirCaja = ['cajero', 'administrador', 'admin', 'dueño'].includes(rolUsuario.toLowerCase());

  const cargar = useCallback(async () => {
    try {
      const negocioId  = await EncryptedStorage.getItem('negocio_id');
      const savedSede  = await EncryptedStorage.getItem('sede_id') || '';
      const savedRol   = await EncryptedStorage.getItem('usuario_rol') || 'Empleado';
      setSedeId(savedSede);
      setRolUsuario(savedRol);

      const params = { negocio_id: negocioId, sede_id: savedSede };

      const [resMesas, resSedes, resOrdenes] = await Promise.all([
        getMesas(params),
        getSedes({ negocio_id: negocioId }),
        getOrdenesLlevar(params),
      ]);

      setMesas(resMesas.data);
      setSedes(resSedes.data);
      setOrdenesLlevar(resOrdenes.data || []);

      const { configuracionGlobal } = useAppStore.getState();
      const mods = configuracionGlobal?.modulos || {};
      setModulos({ salon: mods.salon !== false, delivery: mods.delivery !== false });
      setVistaLocal(mods.salon !== false ? 'salon' : 'llevar');

    } catch (e) {
      console.error('Error cargando salón:', e);
      setVistaLocal('salon');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  // WebSocket
  useEffect(() => {
    if (!sedeId) return;
    let ws = null;
    let unmounted = false;
    let retry = null;

    const conectar = async () => {
      if (unmounted) return;
      try {
        const res    = await api.get('/verificar-sesion/');
        const token  = res.data.ws_token;
        const base   = 'wss://pos.leybrak.com';
        ws           = new WebSocket(`${base}/ws/salon/${sedeId}/?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'mesa_estado') {
              setMesas(prev => prev.map(m =>
                String(m.id) === String(data.mesa_id)
                  ? { ...m, estado: data.estado, total_orden: data.total ?? m.total_orden }
                  : m
              ));
            }
            if (data.type === 'orden_llevar') cargar();
          } catch {}
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => { if (!unmounted) retry = setTimeout(conectar, 4000); };
      } catch {
        if (!unmounted) retry = setTimeout(conectar, 4000);
      }
    };

    conectar();
    return () => { unmounted = true; clearTimeout(retry); ws?.close(); };
  }, [sedeId]);
  // Auto-seleccionar primera sede si no hay ninguna guardada
  useEffect(() => {
    const autoSede = async () => {
      if (sedes.length > 0 && !sedeId) {
        const primera = String(sedes[0].id);
        await EncryptedStorage.setItem('sede_id', primera);
        setSedeId(primera);
      }
    };
    autoSede();
  }, [sedes]);
  // ── Lógica POS ────────────────────────────────────────────────
  const handleAbrirCaja = async () => {
    // Leer directo de EncryptedStorage por si sedeId aún no está en el estado
    const sedeIdActual = sedeId || await EncryptedStorage.getItem('sede_id');
    
    if (!sedeIdActual) {
      Alert.alert('Error', 'No hay sede seleccionada. Cierra y vuelve a abrir la app.');
      return;
    }
    if (!fondoCaja || isNaN(fondoCaja) || parseFloat(fondoCaja) < 0) {
      Alert.alert('Error', 'Ingresa un fondo de caja válido.');
      return;
    }
    setAbriendoCaja(true);
    try {
      const empleadoId = await EncryptedStorage.getItem('empleado_id');
      console.log('PAYLOAD:', { sede_id: sedeIdActual, empleado_id: empleadoId, negocio_id: negocioId, fondo_inicial: parseFloat(fondoCaja) });
      const res = await abrirCajaBD({
        sede_id:       sedeIdActual,
        empleado_id:   empleadoId,
        negocio_id:    negocioId,
        fondo_inicial: parseFloat(fondoCaja),
      });
      await EncryptedStorage.setItem('sesion_caja_id', String(res.data.id));
      setEstadoCaja('abierto');
      setFondoCaja('');
    } catch (e) {
        console.log('ERROR CAJA:', JSON.stringify(e?.response?.data));
        console.log('STATUS:', e?.response?.status);
        Alert.alert('Error', JSON.stringify(e?.response?.data) || 'No se pudo abrir la caja.');
      } finally {
      setAbriendoCaja(false);
    }
  };

  const manejarClickMesa = async (mesa) => {
    if (modoUnir) {
      if (!mesaPrincipal) {
        setMesaPrincipal(mesa.id);
      } else if (mesa.id !== mesaPrincipal) {
        try {
          await actualizarMesa(mesa.id, { mesa_principal: mesaPrincipal });
          setModoUnir(false); setMesaPrincipal(null);
          cargar(); // Recargar
        } catch { Alert.alert('Error', 'No se pudo unir las mesas.'); }
      }
    } else {
      onSeleccionarMesa(mesa.id);
    }
  };

  const handleCierreCajaSeguro = () => {
    const hayOcupadas = mesas.some((m) => m.estado === 'ocupada' || m.orden_activa);
    const hayLlevar = ordenesLlevar.some((o) => o.estado_pago !== 'pagado');
    if (hayOcupadas || hayLlevar) { 
      Alert.alert('Atención', '⚠️ No puedes cerrar el turno. Hay mesas ocupadas o pedidos pendientes.'); 
      return; 
    }
    // En móvil, puedes levantar un ModalCierre o navegar a la pantalla de cierre
    setModalCierreAbierto(true);
  };

  const handleCancelarOrdenLlevar = (id) => {
    Alert.alert('Cancelar pedido', '¿Estás seguro de cancelar este pedido?', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Confirmar Cancelación',
        style: 'destructive',
        onPress: async () => {
          try {
            await actualizarOrden(id, { estado: 'cancelado', cancelado: true });
            cargar();
          } catch { Alert.alert('Error', 'No se pudo cancelar.'); }
        },
      },
    ]);
  };

  // ── Pantalla de Carga ─────────────────────────────────────────
  if (vistaLocal === null || cargando) {
    return (
      <View style={[s.loader, { backgroundColor: t.bg }]}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
        <ActivityIndicator size="large" color={t.color} />
        <Text style={[s.loaderText, { color: t.textMuted }]}>CONECTANDO...</Text>
      </View>
    );
  }

  // ── Pantalla de Caja Cerrada ──────────────────────────────────
  if (!cajaAbierta) {
    return (
      <View style={[s.cajaContainer, { backgroundColor: t.bg }]}>
        <Icon name="lock" size={60} color={t.textMuted} style={{ marginBottom: 20 }} />
        <Text style={[s.cajaTitulo, { color: t.textPrim }]}>CAJA CERRADA</Text>
        <Text style={[s.cajaSub, { color: t.textSec }]}>
          {puedeAbrirCaja ? 'Ingresa el fondo inicial para abrir el turno.' : 'Esperando que un administrador abra la caja.'}
        </Text>
        
        {puedeAbrirCaja && (
          <View style={[s.cajaForm, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <TextInput
              style={[s.cajaInput, { backgroundColor: t.bgInput, color: t.textPrim, borderColor: t.border2 }]}
              value={fondoCaja}
              onChangeText={setFondoCaja}
              placeholder="S/. 0.00"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={[s.btnAbrirCaja, { backgroundColor: t.color }]} 
              onPress={handleAbrirCaja}
              disabled={abriendoCaja}
            >
              <Text style={s.btnAbrirCajaText}>{abriendoCaja ? 'ABRIENDO...' : '💰 ABRIR CAJA'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const mesasFiltradas = mesas.filter(m => sedeId ? String(m.sede) === String(sedeId) : true);
  const mesasLibres = mesasFiltradas.filter(m => m.estado === 'libre').length;
  const mesasOcupadas = mesasFiltradas.filter(m => m.estado !== 'libre').length;

  // ── Render Principal (Caja Abierta) ───────────────────────────
  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bgCard} />

      {/* Header con Botones de Acción (Estilo Web) */}
      <View style={[s.header, { backgroundColor: t.bgCard, borderBottomColor: t.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitulo, { color: t.textPrim }]}>
            Salón <Text style={{ color: t.color }}>POS</Text>
          </Text>
          <Text style={[s.headerSub, { color: t.textSec }]}>
            {mesasLibres} libres · {mesasOcupadas} ocupadas
          </Text>
        </View>

        {/* Botones de acción POS */}
        <View style={s.headerActions}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(234,179,8,0.1)' }]} onPress={() => setDrawerVentaRapidaAbierto(true)}>
            <Icon name="bolt" size={16} color="#eab308" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]} onPress={() => setModalMovimientosAbierto(true)}>
            <Icon name="money" size={16} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]} onPress={handleCierreCajaSeguro}>
            <Icon name="lock" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs salon / llevar */}
      <View style={[s.tabsWrapper, { backgroundColor: t.bgCard, borderBottomColor: t.border }]}>
        <View style={[s.tabs, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
          {modulos.salon && (
            <TouchableOpacity style={[s.tab, vistaLocal === 'salon' && { backgroundColor: t.color }]} onPress={() => setVistaLocal('salon')}>
              <Icon name="table" size={14} color={vistaLocal === 'salon' ? '#fff' : t.textSec} />
            </TouchableOpacity>
          )}
          {modulos.delivery && (
            <TouchableOpacity style={[s.tab, vistaLocal === 'llevar' && { backgroundColor: t.color }]} onPress={() => setVistaLocal('llevar')}>
              <Icon name="shopping-bag" size={14} color={vistaLocal === 'llevar' ? '#fff' : t.textSec} />
              {ordenesLlevar.filter(o => o.estado !== 'pagado').length > 0 && (
                <View style={[s.badge, { backgroundColor: '#ef4444' }]}><Text style={s.badgeText}>{ordenesLlevar.filter(o => o.estado !== 'pagado').length}</Text></View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Botón Unir Mesas */}
        {vistaLocal === 'salon' && (
          <TouchableOpacity 
            style={[s.unirBtn, modoUnir && { backgroundColor: t.color, borderColor: t.color }]}
            onPress={() => { setModoUnir(!modoUnir); setMesaPrincipal(null); }}
          >
            <Icon name="link" size={12} color={modoUnir ? '#fff' : t.textSec} />
            <Text style={[s.unirBtnText, { color: modoUnir ? '#fff' : t.textSec }]}>
              {modoUnir ? (mesaPrincipal ? 'SELECCIONE MESA A UNIR' : 'SELECCIONE MESA PRINCIPAL') : 'UNIR'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={t.color} />}>
        {/* ── Vista Salón ── */}
        {vistaLocal === 'salon' && (
          <View style={s.mesasGrid}>
            {mesasFiltradas.map(mesa => (
              <TarjetaMesa key={mesa.id} mesa={mesa} t={t} color={t.color} onPress={manejarClickMesa} seleccionada={mesaPrincipal === mesa.id} modoUnir={modoUnir} />
            ))}
          </View>
        )}

        {/* ── Vista Llevar ── */}
        {vistaLocal === 'llevar' && (
          <>
            <TouchableOpacity style={[s.btnNuevaOrden, { backgroundColor: t.color }]} onPress={() => setModalClienteVisible(true)}>
              <Icon name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.btnNuevaOrdenText}>NUEVA ORDEN PARA LLEVAR</Text>
            </TouchableOpacity>
            {ordenesLlevar.filter(o => o.estado !== 'pagado').map(orden => (
              <View key={orden.id} style={[s.llevarCard, { backgroundColor: t.bgCard, borderColor: t.border }]}>
                <View style={s.llevarInfo}>
                  <Text style={[s.llevarNombre, { color: t.textPrim }]}>{orden.cliente_nombre || 'Cliente'}</Text>
                  <Text style={[s.llevarTotal, { color: t.color }]}>S/ {parseFloat(orden.total || 0).toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[s.llevarCancelar, { backgroundColor: 'rgba(239,68,68,0.1)' }]} onPress={() => handleCancelarOrdenLlevar(orden.id)}>
                  <Icon name="trash" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <ModalCliente visible={modalClienteVisible} t={t} color={t.color} onConfirmar={({ nombre, telefono }) => { setModalClienteVisible(false); onSeleccionarMesa({ id: 'llevar', cliente: nombre, telefono }); }} onCerrar={() => setModalClienteVisible(false)} />
      
      {/* TODO: Aquí debes renderizar tus Modales de React Native (Venta Rápida, Movimientos, Cierre) */}
      {/* <ModalCierreCaja visible={modalCierreAbierto} onClose={() => setModalCierreAbierto(false)} ... /> */}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const mc = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:          { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1 },
  header:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  titulo:         { fontSize: 18, fontWeight: '900' },
  sub:            { fontSize: 12, marginTop: 2 },
  closeBtn:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:           { padding: 20, paddingBottom: 40 },
  label:          { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  input:          { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontWeight: '600' },
  btnConfirmar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16 },
  btnConfirmarText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});

const s = StyleSheet.create({
  container:       { flex: 1 },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loaderText:      { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  
  cajaContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  cajaTitulo:      { fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  cajaSub:         { fontSize: 14, textAlign: 'center', marginBottom: 30 },
  cajaForm:        { width: '100%', maxWidth: 350, padding: 24, borderRadius: 24, borderWidth: 1 },
  cajaInput:       { fontSize: 24, fontWeight: '900', textAlign: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  btnAbrirCaja:    { padding: 16, borderRadius: 16, alignItems: 'center' },
  btnAbrirCajaText:{ color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 8, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitulo:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSub:       { fontSize: 12, marginTop: 2 },
  headerActions:   { flexDirection: 'row', gap: 8 },
  actionBtn:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  tabsWrapper:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  tabs:            { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tab:             { padding: 10, width: 45, alignItems: 'center', justifyContent: 'center' },
  badge:           { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText:       { color: '#fff', fontSize: 8, fontWeight: '900' },

  unirBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' },
  unirBtnText:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  content:         { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  mesasGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mesaCard:        { width: '30%', aspectRatio: 1, borderRadius: 16, borderWidth: 1.5, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mesaNumero:      { fontSize: 22, fontWeight: '900' },
  mesaEstadoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  mesaEstadoText:  { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  mesaTotal:       { fontSize: 11, fontWeight: '800' },

  btnNuevaOrden:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  btnNuevaOrdenText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  llevarCard:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  llevarInfo:      { flex: 1, gap: 6 },
  llevarNombre:    { fontSize: 15, fontWeight: '800' },
  llevarTotal:     { fontSize: 18, fontWeight: '900' },
  llevarCancelar:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});