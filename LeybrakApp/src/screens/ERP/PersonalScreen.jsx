import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  getEmpleados, getRoles, getSedes,
  crearEmpleado, actualizarEmpleado,
  getRendimientoEmpleados // Asegúrate de exportar esto en tu api.js
} from '../../api/api';
import useAppStore from '../../store/useAppStore';

// ─── Hook de tema ─────────────────────────────────────────────
const useTema = () => {
  const { configuracionGlobal } = useAppStore();
  const isDark = configuracionGlobal.temaFondo !== 'light';
  const color  = configuracionGlobal.colorPrimario || '#3b82f6';
  return {
    isDark, color,
    bg:        isDark ? '#050505' : '#f9fafb',
    bgCard:    isDark ? '#111111' : '#ffffff',
    bgCard2:   isDark ? '#1a1a1a' : '#f3f4f6',
    bgInput:   isDark ? '#0a0a0a' : '#ffffff',
    border:    isDark ? '#222222' : '#e5e7eb',
    border2:   isDark ? '#333333' : '#d1d5db',
    textPrim:  isDark ? '#ffffff' : '#111827',
    textSec:   isDark ? '#9ca3af' : '#6b7280',
    textMuted: isDark ? '#4b5563' : '#9ca3af',
  };
};

// ─── Ícono por rol ────────────────────────────────────────────
const iconoPorRol = (rol) => {
  const r = (rol || '').toLowerCase();
  if (r.includes('admin'))  return 'shield';
  if (r.includes('cajer'))  return 'credit-card';
  if (r.includes('cocin'))  return 'cutlery';
  return 'briefcase';
};

// ─── Tabla de Rendimiento ─────────────────────────────────────
function RendimientoTabla({ t, sedeFiltroId, esDueno, sedes }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const params = { mes, anio };
        if (sedeFiltroId) params.sede_id = sedeFiltroId;
        const res = await getRendimientoEmpleados(params);
        setDatos(res.data?.rendimiento || []);
      } catch {
        setDatos([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [mes, anio, sedeFiltroId]);

  const irMesAnterior = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };

  const irMesSiguiente = () => {
    if (mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()) return;
    if (mes === 12) { setMes(1); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const esMesActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();

  return (
    <View style={[s.cardSaaS, { backgroundColor: t.bgCard, borderColor: t.border, marginTop: 24 }]}>
      
      {/* Header Rendimiento */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Icon name="trophy" size={20} color={t.color} style={{ marginRight: 10 }} />
          <Text style={[s.cardTitulo, { color: t.textPrim }]}>Rendimiento</Text>
        </View>

        {/* Navegador de mes */}
        <View style={[s.mesNav, { backgroundColor: t.bgInput, borderColor: t.border }]}>
          <TouchableOpacity onPress={irMesAnterior} style={s.mesBtn}>
            <Icon name="chevron-left" size={12} color={t.textSec} />
          </TouchableOpacity>
          <Text style={[s.mesText, { color: t.textPrim }]}>{MESES[mes - 1]} {anio}</Text>
          <TouchableOpacity onPress={irMesSiguiente} style={[s.mesBtn, esMesActual && { opacity: 0.3 }]} disabled={esMesActual}>
            <Icon name="chevron-right" size={12} color={t.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabla (Scroll Horizontal) */}
      {cargando ? (
        <ActivityIndicator size="small" color={t.color} style={{ marginVertical: 32 }} />
      ) : datos.length === 0 ? (
        <View style={[s.emptyTable, { borderColor: t.border }]}>
          <Icon name="line-chart" size={32} color={t.textMuted} style={{ marginBottom: 12 }} />
          <Text style={{ color: t.textSec, fontSize: 12, fontWeight: '600' }}>Sin actividad registrada en {MESES[mes - 1]} {anio}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Cabecera */}
            <View style={[s.tableRow, s.tableHeader, { borderBottomColor: t.border }]}>
              <Text style={[s.th, { width: 40, color: t.textSec }]}>#</Text>
              <Text style={[s.th, { width: 140, color: t.textSec }]}>EMPLEADO</Text>
              <Text style={[s.th, { width: 100, color: t.textSec }]}>ROL</Text>
              <Text style={[s.th, { width: 100, color: t.textSec }]}>SEDE</Text>
              <Text style={[s.th, { width: 80, color: t.textSec, textAlign: 'center' }]}>ÓRDENES</Text>
              <Text style={[s.th, { width: 100, color: t.textSec, textAlign: 'right' }]}>INGRESOS</Text>
            </View>

            {/* Filas */}
            {datos.map((emp, i) => (
              <View key={emp.id} style={[s.tableRow, { borderBottomColor: t.border }]}>
                <View style={{ width: 40 }}>
                  {i === 0 ? <Icon name="star" size={14} color="#eab308" /> : <Text style={[s.td, { color: t.textSec, fontWeight: '900' }]}>{i + 1}</Text>}
                </View>
                <Text style={[s.td, { width: 140, color: t.textPrim, fontWeight: '800' }]} numberOfLines={1}>{emp.nombre}</Text>
                <View style={{ width: 100, alignItems: 'flex-start' }}>
                  <View style={[s.badgeSaaS, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
                    <Text style={[s.badgeSaaSText, { color: t.textSec }]}>{emp.rol}</Text>
                  </View>
                </View>
                <Text style={[s.td, { width: 100, color: t.textSec }]} numberOfLines={1}>{emp.sede}</Text>
                <Text style={[s.td, { width: 80, color: emp.total_ordenes > 0 ? t.textPrim : t.textMuted, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                  {emp.total_ordenes}
                </Text>
                <Text style={[s.td, { width: 100, color: emp.total_ingresos > 0 ? '#10b981' : t.textMuted, textAlign: 'right', fontWeight: '900' }]}>
                  {emp.total_ingresos > 0 ? `S/ ${parseFloat(emp.total_ingresos).toFixed(2)}` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Modal Empleado ───────────────────────────────────────────
function ModalEmpleado({ visible, empleado, roles, sedes, t, onGuardar, onCerrar }) {
  const [form, setForm] = useState({ nombre: '', pin: '', rol: '', sede: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        nombre: empleado?.nombre || '',
        pin:    '',
        rol:    empleado?.rol ? String(empleado.rol) : (roles[0]?.id ? String(roles[0].id) : ''),
        sede:   empleado?.sede ? String(empleado.sede) : (sedes[0]?.id ? String(sedes[0].id) : ''),
      });
    }
  }, [visible, empleado]);

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio.'); return; }
    if (!empleado && form.pin.length !== 4) { Alert.alert('Error', 'El PIN debe tener 4 dígitos.'); return; }
    setGuardando(true);
    try {
      await onGuardar(form);
      onCerrar();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={m.overlay}>
        <View style={[m.modal, { backgroundColor: t.bgCard, borderColor: t.border }]}>

          <View style={[m.header, { borderBottomColor: t.border }]}>
            <Text style={[m.titulo, { color: t.textPrim }]}>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</Text>
            <TouchableOpacity onPress={onCerrar} style={[m.closeBtn, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
              <Icon name="times" size={14} color={t.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={m.body} showsVerticalScrollIndicator={false}>
            <Text style={[m.label, { color: t.textMuted }]}>NOMBRE COMPLETO</Text>
            <TextInput
              style={[m.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={form.nombre}
              onChangeText={(v) => setForm({ ...form, nombre: v })}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={t.textMuted}
            />

            <Text style={[m.label, { color: t.textMuted, marginTop: 16 }]}>
              PIN {empleado ? '(dejar vacío para mantener)' : '(4 dígitos)'}
            </Text>
            <TextInput
              style={[m.input, { backgroundColor: t.bgInput, borderColor: t.border2, color: t.textPrim }]}
              value={form.pin}
              onChangeText={(v) => setForm({ ...form, pin: v.replace(/\D/g, '').slice(0, 4) })}
              placeholder="••••"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />

            <Text style={[m.label, { color: t.textMuted, marginTop: 16 }]}>ROL DE ACCESO</Text>
            <View style={m.opcionesGrid}>
              {roles.map(rol => (
                <TouchableOpacity
                  key={rol.id}
                  style={[m.opcionBtn, { backgroundColor: t.bgInput, borderColor: t.border2 }, String(form.rol) === String(rol.id) && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                  onPress={() => setForm({ ...form, rol: String(rol.id) })}
                  activeOpacity={0.8}
                >
                  <Icon name={iconoPorRol(rol.nombre)} size={12} color={String(form.rol) === String(rol.id) ? t.color : t.textSec} style={{ marginRight: 8 }} />
                  <Text style={[m.opcionBtnText, { color: String(form.rol) === String(rol.id) ? t.color : t.textSec }]}>{rol.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {sedes.length > 1 && (
              <>
                <Text style={[m.label, { color: t.textMuted, marginTop: 16 }]}>SEDE ASIGNADA</Text>
                <View style={m.opcionesGrid}>
                  {sedes.map(sede => (
                    <TouchableOpacity
                      key={sede.id}
                      style={[m.opcionBtn, { backgroundColor: t.bgInput, borderColor: t.border2 }, String(form.sede) === String(sede.id) && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                      onPress={() => setForm({ ...form, sede: String(sede.id) })}
                      activeOpacity={0.8}
                    >
                      <Icon name="map-marker" size={12} color={String(form.sede) === String(sede.id) ? t.color : t.textSec} style={{ marginRight: 8 }} />
                      <Text style={[m.opcionBtnText, { color: String(form.sede) === String(sede.id) ? t.color : t.textSec }]}>{sede.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={[m.footer, { borderTopColor: t.border }]}>
            <TouchableOpacity
              style={[m.btnGuardar, { backgroundColor: t.color }, guardando && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="save" size={14} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={m.btnGuardarText}>GUARDAR EMPLEADO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────
export default function PersonalScreen() {
  const t = useTema();

  const [empleados, setEmpleados]   = useState([]);
  const [roles, setRoles]           = useState([]);
  const [sedes, setSedes]           = useState([]);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [cargando, setCargando]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);
  const [rolUsuario, setRolUsuario] = useState('');
  const [sedeActualId, setSedeActualId] = useState('');
  const [sedeActualNombre, setSedeActualNombre] = useState('');

  const esDueno = ['dueño', 'admin', 'administrador'].includes(rolUsuario.toLowerCase());

  const cargar = useCallback(async () => {
    try {
      const negocioId = await EncryptedStorage.getItem('negocio_id');
      const rol       = await EncryptedStorage.getItem('usuario_rol') || '';
      const sedeId    = await EncryptedStorage.getItem('sede_id') || '';
      const sedeNom   = await EncryptedStorage.getItem('sede_nombre') || 'Local Principal';
      setRolUsuario(rol);
      setSedeActualId(sedeId);
      setSedeActualNombre(sedeNom);

      const params = { negocio_id: negocioId };
      const [resEmp, resRoles, resSedes] = await Promise.all([
        getEmpleados(params),
        getRoles(params),
        getSedes(params),
      ]);
      setEmpleados(resEmp.data);
      setRoles(resRoles.data);
      setSedes(resSedes.data);
    } catch (e) {
      console.error('Error cargando personal:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  // Filtrado inteligente
  const empleadosFiltrados = empleados.filter(emp => {
    if (!esDueno) return String(emp.sede) === String(sedeActualId);
    if (sedeFiltro) return String(emp.sede) === String(sedeFiltro);
    return true;
  });

  const handleGuardar = async (form) => {
    const negocioId = await EncryptedStorage.getItem('negocio_id');
    const payload   = { nombre: form.nombre, rol: form.rol, sede: form.sede, negocio: negocioId };
    if (form.pin) payload.pin = form.pin;

    if (empleadoEditar) await actualizarEmpleado(empleadoEditar.id, payload);
    else await crearEmpleado(payload);
    await cargar();
  };

  const handleToggleActivo = async (emp) => {
    Alert.alert(
      emp.activo ? 'Desactivar empleado' : 'Reactivar empleado',
      `¿Deseas ${emp.activo ? 'desactivar' : 'reactivar'} a ${emp.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: emp.activo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await actualizarEmpleado(emp.id, { activo: !emp.activo });
              await cargar();
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estado.');
            }
          },
        },
      ]
    );
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
        {/* Header Estilo Web */}
        <View style={s.headerSaaS}>
          <View style={[s.headerSaaSIcono, { backgroundColor: `${t.color}15` }]}>
            <Icon name="users" size={26} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerSaaSTitulo, { color: t.textPrim }]}>Equipo de <Text style={{ color: t.color }}>Trabajo</Text></Text>
            <Text style={[s.headerSaaSDesc, { color: t.textSec }]}>
              {esDueno ? 'Gestiona accesos, edita perfiles y mide el rendimiento global.' : 'Consulta el equipo asignado a tu sede.'}
            </Text>
          </View>
        </View>

        {/* Controles de Acción (Filtros y Nuevo) */}
        <View style={s.controlesSaaS}>
          {esDueno ? (
            sedes.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginRight: 12 }}>
                <TouchableOpacity
                  style={[s.sedeFilterBtn, { backgroundColor: t.bgCard, borderColor: t.border }, sedeFiltro === '' && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                  onPress={() => setSedeFiltro('')}
                  activeOpacity={0.8}
                >
                  <Icon name="map-marker" size={12} color={sedeFiltro === '' ? t.color : t.textSec} style={{ marginRight: 6 }} />
                  <Text style={[s.sedeFilterText, { color: sedeFiltro === '' ? t.color : t.textSec }]}>Todas las Sedes</Text>
                </TouchableOpacity>
                {sedes.map(sede => (
                  <TouchableOpacity
                    key={sede.id}
                    style={[s.sedeFilterBtn, { backgroundColor: t.bgCard, borderColor: t.border }, sedeFiltro === String(sede.id) && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                    onPress={() => setSedeFiltro(String(sede.id))}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.sedeFilterText, { color: sedeFiltro === String(sede.id) ? t.color : t.textSec }]}>{sede.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          ) : (
            <View style={[s.sedeActivaBox, { backgroundColor: t.bgCard, borderColor: t.border }]}>
              <Icon name="map-marker" size={12} color={t.textMuted} style={{ marginRight: 8 }} />
              <Text style={[s.sedeActivaText, { color: t.textMuted }]}>SEDE ACTIVA: <Text style={{ color: t.textPrim }}>{sedeActualNombre}</Text></Text>
            </View>
          )}

          {esDueno && (
            <TouchableOpacity
              style={[s.btnNuevoSaaS, { backgroundColor: t.color }]}
              onPress={() => { setEmpleadoEditar(null); setModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnNuevoSaaSText}>NUEVO EMPLEADO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Empleados */}
        {empleadosFiltrados.length === 0 ? (
          <View style={[s.emptySaaS, { backgroundColor: t.bgCard, borderColor: t.border }]}>
            <Icon name="users" size={40} color={t.textMuted} />
            <Text style={[s.emptySaaSTitulo, { color: t.textPrim }]}>Sin personal</Text>
            <Text style={[s.emptySaaSDesc, { color: t.textSec }]}>Aún no hay empleados registrados en esta sede.</Text>
          </View>
        ) : (
          empleadosFiltrados.map(emp => {
            const sedeEmp = sedes.find(sd => String(sd.id) === String(emp.sede));
            return (
              <View key={emp.id} style={[s.cardSaaS, { backgroundColor: t.bgCard, borderColor: t.border }, !emp.activo && { opacity: 0.6 }]}>
                
                <View style={s.cardSaaSBody}>
                  <View style={[s.cardSaaSIcono, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
                    <Icon name={iconoPorRol(emp.rol_nombre)} size={20} color={t.textSec} />
                  </View>
                  
                  <View style={s.cardSaaSInfo}>
                    <Text style={[s.cardSaaSName, { color: t.textPrim }, !emp.activo && { textDecorationLine: 'line-through' }]}>
                      {emp.nombre}
                    </Text>
                    <View style={s.badgesContainer}>
                      <View style={[s.badgeSaaS, { backgroundColor: t.bgCard2, borderColor: t.border }]}>
                        <Text style={[s.badgeSaaSText, { color: t.textSec }]}>{emp.rol_nombre || 'Sin Rol'}</Text>
                      </View>
                      
                      <View style={[s.badgeSaaS, emp.activo ? { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' } : { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                        <Text style={[s.badgeSaaSText, { color: emp.activo ? '#10b981' : '#ef4444' }]}>{emp.activo ? 'ACTIVO' : 'INACTIVO'}</Text>
                      </View>

                      {sedes.length > 1 && sedeEmp && (
                        <View style={[s.badgeSaaS, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }]}>
                          <Icon name="map-marker" size={8} color="#3b82f6" style={{ marginRight: 4 }} />
                          <Text style={[s.badgeSaaSText, { color: '#3b82f6' }]}>{sedeEmp.nombre}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {esDueno && (
                  <View style={[s.cardSaaSActions, { borderTopColor: t.border }]}>
                    <TouchableOpacity style={[s.actionBtnSaaS, { backgroundColor: t.bgCard2, borderColor: t.border }]} onPress={() => { setEmpleadoEditar(emp); setModalVisible(true); }}>
                      <Icon name="pencil" size={14} color={t.color} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtnSaaS, emp.activo ? { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' } : { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]} onPress={() => handleToggleActivo(emp)}>
                      <Icon name={emp.activo ? 'user-times' : 'user-plus'} size={14} color={emp.activo ? '#ef4444' : '#10b981'} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Tabla de Rendimiento */}
        <RendimientoTabla t={t} sedeFiltroId={sedeFiltro} esDueno={esDueno} sedes={sedes} />

      </ScrollView>

      {/* Modal */}
      <ModalEmpleado
        visible={modalVisible}
        empleado={empleadoEditar}
        roles={roles}
        sedes={sedes}
        t={t}
        onGuardar={handleGuardar}
        onCerrar={() => { setModalVisible(false); setEmpleadoEditar(null); }}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1 },
  content:        { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16, paddingBottom: 40 },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  headerSaaS:     { flexDirection: 'row', alignItems: 'center', paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginBottom: 20 },
  headerSaaSIcono:{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerSaaSTitulo:{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  headerSaaSDesc:  { fontSize: 12, lineHeight: 18 },

  // Controles
  controlesSaaS:  { flexDirection: 'column', gap: 12, marginBottom: 20 },
  sedeFilterBtn:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  sedeFilterText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  sedeActivaBox:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  sedeActivaText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  btnNuevoSaaS:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnNuevoSaaSText:{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

  // Empty State
  emptySaaS:      { padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginVertical: 20 },
  emptySaaSTitulo:{ fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  emptySaaSDesc:  { fontSize: 13, textAlign: 'center' },

  // Tarjeta Empleado
  cardSaaS:       { borderRadius: 28, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardSaaSBody:   { flexDirection: 'row', alignItems: 'center', padding: 20 },
  cardSaaSIcono:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 16 },
  cardSaaSInfo:   { flex: 1 },
  cardSaaSName:   { fontSize: 16, fontWeight: '900', marginBottom: 8, letterSpacing: -0.3 },
  badgesContainer:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badgeSaaS:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeSaaSText:  { fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  cardSaaSActions:{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, gap: 10 },
  actionBtnSaaS:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Rendimiento Tabla
  cardTitulo:     { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  mesNav:         { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 4 },
  mesBtn:         { padding: 8, borderRadius: 8 },
  mesText:        { fontSize: 11, fontWeight: '900', width: 70, textAlign: 'center' },
  emptyTable:     { padding: 32, alignItems: 'center', borderRadius: 20, borderWidth: 2, borderStyle: 'dashed' },
  tableRow:       { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 14, alignItems: 'center' },
  tableHeader:    { borderBottomWidth: 2, paddingBottom: 10 },
  th:             { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  td:             { fontSize: 13, fontWeight: '600' },
});

// ─── Estilos Modal ────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal:        { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, maxHeight: '90%' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  titulo:       { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:         { padding: 24, paddingBottom: 40 },
  label:        { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  input:        { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 14, fontWeight: '700' },
  opcionesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opcionBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  opcionBtnText:{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  footer:       { padding: 24, borderTopWidth: 1 },
  btnGuardar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 18 },
  btnGuardarText:{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});