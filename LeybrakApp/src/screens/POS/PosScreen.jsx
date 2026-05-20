import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Platform, StatusBar, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';

// Store y API
import useAppStore from '../../store/useAppStore'; // Equivalente a usePosStore
import api, {
  abrirCajaBD, actualizarMesa, actualizarOrden, crearOrden,
  crearPago, registrarMovimientoCaja, validarPinEmpleado
} from '../../api/api';

// ─── IMPORTACIONES ASUMIDAS (Arquitectura Limpia) ─────────────
// Al igual que en la web, deberías separar estos componentes en sus propios archivos
import ModalCobro from '../../components/modals/ModalCobro';
import ModalCierreCaja from '../../components/modals/ModalCierreCaja';
import DrawerVentaRapida from './Pos_DrawerVentaRapida';
import ModalMovimientoCaja from '../../components/modals/ModalMovimientoCaja';
import ModalAlertaBot from '../../components/modals/ModalAlertaBot';

import TerminalHeader from './components/TerminalHeader';
import TerminalMesasGrid from './components/TerminalMesasGrid';
import TerminalLlevarView from './components/TerminalLlevarView';
import TerminalSidebar from './components/TerminalSidebar';

import { useTerminalData } from './hooks/useTerminalData';
import { useTerminalWS } from './hooks/useTerminalWS';

// ─── HOOK DE TEMA (Helper RN) ─────────────────────────────────
const useTema = () => {
  const { configuracionGlobal } = useAppStore();
  const isDark = configuracionGlobal?.temaFondo !== 'light';
  const color = configuracionGlobal?.colorPrimario || '#ff5a1f';
  return {
    isDark, color,
    bg: isDark ? '#0a0a0a' : '#f0f0f0',
    bgCard: isDark ? '#141414' : '#ffffff',
    bgInput: isDark ? '#111111' : '#f9fafb',
    border: isDark ? '#222222' : '#e5e7eb',
    border2: isDark ? '#333333' : '#d1d5db',
    textPrim: isDark ? '#ffffff' : '#111111',
    textSec: isDark ? '#9ca3af' : '#6b7280',
    textMuted: isDark ? '#4b5563' : '#9ca3af',
  };
};

export default function PosTerminalScreen({ onIrAErp }) {
  const t = useTema();
  const { estadoCaja, setEstadoCaja, configuracionGlobal, setConfiguracionGlobal } = useAppStore();

  // ─── ESTADOS LOCALES Y SEGURIDAD ──────────────────────────────
  const [sedeActualId, setSedeActualId] = useState('');
  const [rolUsuario, setRolUsuario] = useState('Empleado');
  const [empleadoId, setEmpleadoId] = useState('');

  const esDueño = ['dueño', 'admin'].includes(rolUsuario.trim().toLowerCase());
  const cajaAbierta = estadoCaja === 'abierto' || estadoCaja?.estado === 'abierto';
  const puedeAbrirCaja = ['cajero', 'administrador', 'admin', 'dueño'].includes(rolUsuario.toLowerCase().trim());

  // Estados de UI y Modales
  const [modalAperturaAbierto, setModalAperturaAbierto] = useState(false);
  const [fondoCaja, setFondoCaja] = useState('');
  const [abriendoCaja, setAbriendoCaja] = useState(false);

  const [triggerRecarga, setTriggerRecarga] = useState(false);
  const [mostrarPuertaMovil, setMostrarPuertaMovil] = useState(false);
  const [modoUnir, setModoUnir] = useState(false);
  const [mesaPrincipal, setMesaPrincipal] = useState(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [drawerVentaRapidaAbierto, setDrawerVentaRapidaAbierto] = useState(false);
  const [modalMovimientosAbierto, setModalMovimientosAbierto] = useState(false);
  const [ordenACobrar, setOrdenACobrar] = useState(null);
  const [solicitudesBot, setSolicitudesBot] = useState([]);

  // Cargar datos de sesión iniciales
  useEffect(() => {
    const initSession = async () => {
      const sede = await EncryptedStorage.getItem('sede_id');
      const rol = await EncryptedStorage.getItem('usuario_rol');
      const empId = await EncryptedStorage.getItem('empleado_id');
      if (sede) setSedeActualId(sede);
      if (rol) setRolUsuario(rol);
      if (empId) setEmpleadoId(empId);
    };
    initSession();
  }, []);

  // ─── HOOKS DE DATOS Y WEBSOCKETS ──────────────────────────────
  const {
    sedes, mesas, setMesas, ordenesLlevar, setOrdenesLlevar,
    todasLasOrdenesActivas, vistaLocal, setVistaLocal, modulos,
    sedeActualIdRef, cargandoCaja
  } = useTerminalData(sedeActualId, triggerRecarga, setConfiguracionGlobal, setEstadoCaja);

  useTerminalWS(sedeActualId, setMesas, setOrdenesLlevar, setSolicitudesBot, sedeActualIdRef);

  // Auto-seleccionar primera sede si no hay una guardada
  useEffect(() => {
    if (sedes?.length > 0 && !sedeActualId) {
      const primeraSedeId = String(sedes[0].id);
      EncryptedStorage.setItem('sede_id', primeraSedeId);
      setSedeActualId(primeraSedeId);
    }
  }, [sedes, sedeActualId]);

  // ─── HELPERS Y MANEJADORES ────────────────────────────────────
  const manejarCambioSede = async (nuevaSedeId) => {
    if (!nuevaSedeId) return;
    await EncryptedStorage.setItem('sede_id', nuevaSedeId);
    setSedeActualId(nuevaSedeId);
  };

  const handleAbrirCaja = async () => {
    if (!fondoCaja || isNaN(fondoCaja) || parseFloat(fondoCaja) < 0) {
      Alert.alert('Error', 'Ingresa un fondo de caja válido.');
      return;
    }
    setAbriendoCaja(true);
    try {
      const res = await abrirCajaBD({
        sede_id: sedeActualId,
        empleado_id: empleadoId,
        fondo_inicial: parseFloat(fondoCaja),
      });
      await EncryptedStorage.setItem('sesion_caja_id', String(res.data.id));
      setEstadoCaja('abierto');
      setModalAperturaAbierto(false);
      setFondoCaja('');
    } catch {
      Alert.alert('Error', 'No se pudo abrir la caja. Intenta de nuevo.');
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
          setTriggerRecarga((p) => !p);
        } catch { Alert.alert('Error', 'No se pudo unir las mesas.'); }
      }
    } else {
      setMesaSeleccionada(mesa.id);
    }
  };

  const manejarSepararMesa = async (mesaPadre) => {
    Alert.alert(
      'Separar Mesas',
      `¿Estás seguro de que quieres desarmar el grupo de la Mesa ${mesaPadre.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desarmar', style: 'destructive', onPress: async () => {
            try {
              const mesasHijas = mesas.filter((m) => m.unida_a === mesaPadre.id);
              await Promise.all(mesasHijas.map((hija) => actualizarMesa(hija.id, { mesa_principal: null })));
              setTriggerRecarga((p) => !p);
            } catch { Alert.alert('Error', 'Hubo un problema al separar las mesas.'); }
          }
        }
      ]
    );
  };

  const iniciarOrdenDelivery = () => {
    if (!nombreCliente.trim()) { Alert.alert('Error', 'Ingresa el nombre del cliente.'); return; }
    setModalClienteAbierto(false);
    setMesaSeleccionada({ id: 'llevar', cliente: nombreCliente, telefono: telefonoCliente });
    setNombreCliente(''); setTelefonoCliente('');
  };

  const entregarOrdenLlevar = async (id) => {
    try { await actualizarOrden(id, { estado: 'pagado' }); setTriggerRecarga(p => !p); }
    catch { Alert.alert('Error', 'No se pudo entregar el pedido.'); }
  };

  const manejarCancelacion = (id) => {
    // En RN usamos prompt mediante un Modal custom o Alert.prompt (solo iOS). 
    // Para compatibilidad cruzada asumimos un Alert o Modal de cancelación.
    Alert.alert('Cancelar Pedido', '¿Estás seguro de cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, Cancelar', style: 'destructive', onPress: async () => {
          try { await actualizarOrden(id, { estado: 'cancelado', cancelado: true }); setTriggerRecarga(p => !p); }
          catch { Alert.alert('Error', 'Error al cancelar'); }
      }}
    ]);
  };

  const manejarCierreCajaSeguro = async () => {
    const hayOcupadas = mesas.some((m) => m.estado === 'ocupada' || m.orden_activa);
    const hayLlevar = ordenesLlevar.some((o) => o.estado_pago !== 'pagado');
    if (hayOcupadas || hayLlevar) { Alert.alert('⚠️ Atención', 'Hay mesas ocupadas o pedidos pendientes.'); return; }
    
    // Asumimos un Modal de validación de PIN para RN
    Alert.prompt('Cierre de Caja', 'Ingrese PIN autorizado:', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async (pin) => {
          try {
            const { data } = await validarPinEmpleado({ pin, accion: 'entrar' });
            if (['Cajero', 'Administrador', 'Admin'].includes(data.rol_nombre)) setModalCierreAbierto(true);
            else Alert.alert('🚫', 'Sin permisos para cerrar caja.');
          } catch { Alert.alert('❌', 'PIN incorrecto o empleado inactivo.'); }
      }}
    ], 'secure-text');
  };

  const manejarResolucionBot = async (solicitud_id, orden_id, decision) => {
    try {
      await api.post(`/ordenes/${orden_id}/resolver_solicitud_bot/`, { solicitud_id, decision });
      setSolicitudesBot(prev => prev.filter(s => s.solicitud_id !== solicitud_id));
      if (decision === 'aprobar') setTriggerRecarga(p => !p);
    } catch {
      Alert.alert("Error", "Problema al resolver la solicitud del bot.");
    }
  };

  // ─── RENDER DE ESTADOS ESPECIALES ─────────────────────────────

  // 1. Cargando
  if (vistaLocal === null) {
    return (
      <View style={[s.centerContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.color} />
        <Text style={[s.loadingText, { color: t.textSec }]}>CONECTANDO SISTEMA...</Text>
      </View>
    );
  }

  // 2. Caja Cerrada
  if (!cajaAbierta && !cargandoCaja) {
    return (
      <View style={[s.centerContainer, { backgroundColor: t.bg, padding: 24 }]}>
        <Icon name="lock" size={60} color={t.textMuted} style={{ marginBottom: 20 }} />
        <Text style={[s.titleText, { color: t.textPrim }]}>Caja Cerrada</Text>
        <Text style={[s.descText, { color: t.textSec, marginBottom: 40 }]}>
          {puedeAbrirCaja ? 'No hay una sesión de caja activa. Inicia el turno.' : 'Esperando que un administrador abra la caja.'}
        </Text>

        {puedeAbrirCaja && (
          <TouchableOpacity style={[s.btnPrimary, { backgroundColor: t.color }]} onPress={() => setModalAperturaAbierto(true)}>
            <Icon name="money" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.btnPrimaryText}>ABRIR CAJA</Text>
          </TouchableOpacity>
        )}

        <Modal visible={modalAperturaAbierto} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: t.bgCard, borderColor: t.border }]}>
              <Text style={[s.modalTitle, { color: t.textPrim }]}>Abrir Turno</Text>
              <Text style={[s.modalSub, { color: t.textSec }]}>Fondo inicial de la caja</Text>
              
              <TextInput
                style={[s.inputBig, { backgroundColor: t.bgInput, borderColor: t.border, color: t.textPrim }]}
                value={fondoCaja}
                onChangeText={setFondoCaja}
                placeholder="S/ 0.00"
                placeholderTextColor={t.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[s.btnOutline, { borderColor: t.border, flex: 1 }]} onPress={() => setModalAperturaAbierto(false)}>
                  <Text style={[s.btnOutlineText, { color: t.textSec }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: t.color, flex: 1 }]} onPress={handleAbrirCaja} disabled={abriendoCaja}>
                  <Text style={s.btnPrimaryText}>{abriendoCaja ? 'Abriendo...' : 'Confirmar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 3. Modo Fast Food
  if (modulos.salon === false && modulos.delivery === false) {
    return (
      <View style={[s.centerContainer, { backgroundColor: t.bg, padding: 24 }]}>
        <Icon name="bolt" size={60} color={t.color} style={{ marginBottom: 20 }} />
        <Text style={[s.titleText, { color: t.textPrim }]}>Modo Fast Food</Text>
        <Text style={[s.descText, { color: t.textSec, marginBottom: 40 }]}>
          El salón y delivery están desactivados. Usa la Venta Rápida.
        </Text>
        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: t.color, paddingHorizontal: 32 }]} onPress={() => setDrawerVentaRapidaAbierto(true)}>
          <Text style={s.btnPrimaryText}>⚡ INICIAR VENTA RÁPIDA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── RENDER PRINCIPAL (APP) ───────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bgCard} />
      
      {/* HEADER (Arquitectura extraída) */}
      <TerminalHeader 
        tema={t} colorPrimario={t.color} vistaLocal={vistaLocal} 
        mesaSeleccionada={mesaSeleccionada} esDueño={esDueño} sedes={sedes} 
        sedeActualId={sedeActualId} manejarCambioSede={manejarCambioSede} 
        modoUnir={modoUnir} setModoUnir={setModoUnir} setMesaPrincipal={setMesaPrincipal} 
        modSalonActivo={modulos.salon} modLlevarActivo={modulos.delivery} 
        setVistaLocal={setVistaLocal} ordenesLlevar={ordenesLlevar} 
        setDrawerVentaRapidaAbierto={setDrawerVentaRapidaAbierto} rolUsuario={rolUsuario} 
        onIrAErp={onIrAErp} setModalMovimientosAbierto={setModalMovimientosAbierto} 
        manejarCierreCajaSeguro={manejarCierreCajaSeguro} 
      />

      <View style={s.bodyRow}>
        {/* VISTA PRINCIPAL (Mesas o Llevar) */}
        <View style={[s.mainContent, mesaSeleccionada && Platform.OS !== 'web' ? { display: 'none' } : {}]}>
          {vistaLocal === 'salon' && modulos.salon && (
            <TerminalMesasGrid 
              mesas={mesas} modoUnir={modoUnir} mesaPrincipal={mesaPrincipal} 
              mesaSeleccionada={mesaSeleccionada} manejarClickMesa={manejarClickMesa} 
              mostrarPuertaMovil={mostrarPuertaMovil} setMostrarPuertaMovil={setMostrarPuertaMovil} 
              tema={t} colorPrimario={t.color} sedeActual={sedes.find(s => String(s.id) === String(sedeActualId))}
              manejarSepararMesa={manejarSepararMesa}
            />
          )}

          {vistaLocal === 'llevar' && modulos.delivery && (
            <TerminalLlevarView 
              ordenesLlevar={ordenesLlevar} tema={t} colorPrimario={t.color} 
              setModalClienteAbierto={setModalClienteAbierto} manejarCancelacion={manejarCancelacion} 
              setOrdenACobrar={setOrdenACobrar} entregarOrdenLlevar={entregarOrdenLlevar} 
            />
          )}
        </View>

        {/* SIDEBAR DE ORDEN (Aparece al seleccionar una mesa) */}
        {mesaSeleccionada && (
          <View style={[s.sidebar, { borderLeftColor: t.border }]}>
            <TerminalSidebar 
              mesaSeleccionada={mesaSeleccionada} setMesaSeleccionada={setMesaSeleccionada} 
              setTriggerRecarga={setTriggerRecarga} todasLasOrdenesActivas={todasLasOrdenesActivas} 
              setVistaLocal={setVistaLocal} mesas={mesas} tema={t} colorPrimario={t.color} 
            />
          </View>
        )}
      </View>

      {/* ─── MODALES GLOBALES ─── */}
      
      {/* Modal Cliente Delivery */}
      <Modal visible={modalClienteAbierto} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <View style={[s.modalHeader, { borderBottomColor: t.border }]}>
              <View>
                <Text style={[s.modalTitle, { color: t.textPrim }]}>Datos del Cliente</Text>
                <Text style={[s.modalSub, { color: t.textSec }]}>Identifica el pedido</Text>
              </View>
              <TouchableOpacity onPress={() => setModalClienteAbierto(false)}>
                <Icon name="times" size={20} color={t.textSec} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={[s.inputLabel, { color: t.textSec }]}>NOMBRE (OBLIGATORIO)</Text>
                <TextInput
                  style={[s.inputNormal, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
                  value={nombreCliente} onChangeText={setNombreCliente} placeholder="Ej. Carlos" placeholderTextColor={t.textMuted}
                />
              </View>
              <View>
                <Text style={[s.inputLabel, { color: t.textSec }]}>WHATSAPP (OPCIONAL)</Text>
                <TextInput
                  style={[s.inputNormal, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
                  value={telefonoCliente} onChangeText={setTelefonoCliente} placeholder="Ej. 999 999 999" placeholderTextColor={t.textMuted} keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity style={[s.btnPrimary, { backgroundColor: t.color, marginTop: 8 }]} onPress={iniciarOrdenDelivery}>
                <Text style={s.btnPrimaryText}>IR AL MENÚ</Text>
                <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Renderizado de Modales Importados */}
      {!!ordenACobrar && (
        <ModalCobro 
          isOpen={!!ordenACobrar} onClose={() => setOrdenACobrar(null)}
          total={parseFloat(ordenACobrar.total || 0)}
          carrito={ordenACobrar?.detalles || []} esVentaRapida={ordenACobrar.es_venta_rapida}
          onCobroExitoso={async (datosCobro) => {
             // Lógica adaptada en el hook interno de ModalCobro o pasada como prop
             setOrdenACobrar(null); setTriggerRecarga(p => !p);
          }}
        />
      )}

      {drawerVentaRapidaAbierto && (
        <DrawerVentaRapida 
          isOpen={drawerVentaRapidaAbierto} onClose={() => setDrawerVentaRapidaAbierto(false)}
          onProcederPago={(carrito, total) => {
            setOrdenACobrar({ id: 'venta_rapida', es_venta_rapida: true, total, detalles: carrito });
            setDrawerVentaRapidaAbierto(false);
          }}
        />
      )}

      {modalCierreAbierto && <ModalCierreCaja isOpen={modalCierreAbierto} onClose={() => setModalCierreAbierto(false)} />}
      {modalMovimientosAbierto && <ModalMovimientoCaja isOpen={modalMovimientosAbierto} onClose={() => setModalMovimientosAbierto(false)} />}
      {solicitudesBot.length > 0 && <ModalAlertaBot solicitud={solicitudesBot[0]} onResolver={manejarResolucionBot} />}

    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  titleText: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
  descText: { fontSize: 14, textAlign: 'center', maxWidth: 300 },
  
  bodyRow: { flex: 1, flexDirection: 'row' },
  mainContent: { flex: 1 },
  sidebar: { width: '100%', maxWidth: 450, borderLeftWidth: 1 },

  btnPrimary: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  btnOutline: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnOutlineText: { fontSize: 14, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  modalBox: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSub: { fontSize: 12, marginTop: 2 },
  
  inputBig: { borderWidth: 1, borderRadius: 16, padding: 20, fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  inputNormal: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontWeight: '600' },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
});