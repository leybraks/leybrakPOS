import React, { useState, useEffect, useCallback } from 'react';
import { Bike, Plus, Trash2, Pencil, Loader2, MapPin, AlertTriangle, X, Check } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

/**
 * Gestión de zonas de delivery por sede. Cada zona es un "anillo" por radio máximo:
 * el bot/POS cobra la zona de menor radio cuya distancia cubra al cliente.
 * Usa la ubicación (lat/lng) de la sede como centro.
 */
const VACIO = { nombre: '', radio_max_km: '', costo_envio: '', pedido_minimo: '', activa: true };

export default function Bot_Delivery({ sede, isDark, colorPrimario }) {
  const toast = useToast();
  const sedeId = sede?.id;

  const [zonas, setZonas]     = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm]       = useState(VACIO);
  const [editId, setEditId]   = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState(null);

  const sinCoords = !sede?.latitud || !sede?.longitud;

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    setCargando(true);
    try {
      const res = await api.get('/zonas-delivery/', { params: { sede_id: sedeId } });
      setZonas(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch { setZonas([]); }
    finally { setCargando(false); }
  }, [sedeId]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNueva = () => { setForm(VACIO); setEditId(null); setAbierto(true); };
  const abrirEditar = (z) => {
    setForm({ nombre: z.nombre, radio_max_km: z.radio_max_km, costo_envio: z.costo_envio, pedido_minimo: z.pedido_minimo || '', activa: z.activa });
    setEditId(z.id); setAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.warning('Ponle un nombre a la zona.'); return; }
    if (!form.radio_max_km || Number(form.radio_max_km) <= 0) { toast.warning('Indica el radio máximo (km).'); return; }
    if (form.costo_envio === '' || Number(form.costo_envio) < 0) { toast.warning('Indica el costo de envío.'); return; }
    setGuardando(true);
    try {
      const payload = {
        sede: sedeId,
        nombre: form.nombre.trim(),
        radio_max_km: Number(form.radio_max_km),
        costo_envio: Number(form.costo_envio),
        pedido_minimo: form.pedido_minimo === '' ? 0 : Number(form.pedido_minimo),
        activa: form.activa,
      };
      if (editId) await api.patch(`/zonas-delivery/${editId}/`, payload);
      else await api.post('/zonas-delivery/', payload);
      toast.success('Zona guardada.');
      setAbierto(false); cargar();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo guardar la zona.');
    } finally { setGuardando(false); }
  };

  const toggleActiva = async (z) => {
    setAccionId(z.id);
    try { await api.patch(`/zonas-delivery/${z.id}/`, { activa: !z.activa }); cargar(); }
    catch { toast.error('No se pudo actualizar.'); }
    finally { setAccionId(null); }
  };

  const eliminar = async (z) => {
    if (!window.confirm(`¿Eliminar la zona "${z.nombre}"?`)) return;
    setAccionId(z.id);
    try { await api.delete(`/zonas-delivery/${z.id}/`); toast.success('Zona eliminada.'); cargar(); }
    catch { toast.error('No se pudo eliminar.'); }
    finally { setAccionId(null); }
  };

  const card = `rounded-[2rem] p-6 border ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'}`;
  const inp = isDark ? 'bg-[#0a0a0a] border-[#333] text-white placeholder:text-neutral-600'
                     : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const lbl = isDark ? 'text-neutral-500' : 'text-gray-400';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-neutral-400' : 'text-gray-500';

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
              <Bike size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-black ${txt}`}>Zonas de Delivery</h3>
              <p className={`text-xs ${sub}`}>Costo de envío por distancia desde <b>{sede?.nombre}</b>.</p>
            </div>
          </div>
          <button onClick={abrirNueva} disabled={sinCoords}
            className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white flex items-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: colorPrimario }}>
            <Plus size={15} /> Zona
          </button>
        </div>

        {sinCoords && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-500">
              Esta sede no tiene ubicación (lat/lng) configurada. El delivery necesita el punto del local —
              configúralo en <b>Gestión de Sedes</b> antes de crear zonas.
            </p>
          </div>
        )}

        <p className={`text-xs mt-4 ${sub}`}>
          💡 Cada zona es un <b>radio máximo</b>. Se cobra la zona más chica que cubra al cliente.
          Ej: "Cercana" hasta 2 km → S/ 5; "Lejana" hasta 5 km → S/ 8.
        </p>

        {/* Form inline */}
        {abierto && (
          <div className={`mt-4 p-4 rounded-2xl border ${isDark ? 'border-[#333] bg-[#161616]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-black text-sm ${txt}`}>{editId ? 'Editar zona' : 'Nueva zona'}</h4>
              <button onClick={() => setAbierto(false)} className={sub}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${lbl}`}>Nombre</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Zona Cercana" className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none ${inp}`} />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${lbl}`}>Radio máx. (km)</label>
                <input type="number" min="0" step="0.5" value={form.radio_max_km} onChange={(e) => setForm({ ...form, radio_max_km: e.target.value })}
                  placeholder="2" className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inp}`} />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${lbl}`}>Costo envío (S/)</label>
                <input type="number" min="0" step="0.5" value={form.costo_envio} onChange={(e) => setForm({ ...form, costo_envio: e.target.value })}
                  placeholder="5" className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inp}`} />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${lbl}`}>Pedido mínimo (S/)</label>
                <input type="number" min="0" step="1" value={form.pedido_minimo} onChange={(e) => setForm({ ...form, pedido_minimo: e.target.value })}
                  placeholder="0 (opcional)" className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inp}`} />
              </div>
              <div className="flex items-end">
                <button onClick={() => setForm({ ...form, activa: !form.activa })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 ${form.activa ? 'text-green-500 border-green-500/30 bg-green-500/10' : `${sub} ${isDark ? 'border-[#333]' : 'border-gray-200'}`}`}>
                  <Check size={15} /> {form.activa ? 'Activa' : 'Inactiva'}
                </button>
              </div>
            </div>
            <button onClick={guardar} disabled={guardando}
              className="w-full mt-3 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: colorPrimario }}>
              {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Guardar zona
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="mt-5 space-y-2">
          {cargando ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: colorPrimario }} size={26} /></div>
          ) : zonas.length === 0 ? (
            <p className={`text-sm text-center py-10 ${sub}`}>Aún no hay zonas para esta sede.</p>
          ) : zonas.map(z => (
            <div key={z.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'border-[#222] bg-[#161616]' : 'border-gray-100 bg-gray-50'} ${!z.activa ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colorPrimario + '15', color: colorPrimario }}>
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm ${txt}`}>{z.nombre}</p>
                <p className={`text-[11px] ${sub}`}>
                  Hasta {z.radio_max_km} km · S/ {Number(z.costo_envio).toFixed(2)}
                  {Number(z.pedido_minimo) > 0 ? ` · mín. S/ ${Number(z.pedido_minimo).toFixed(2)}` : ''}
                </p>
              </div>
              <button onClick={() => toggleActiva(z)} disabled={accionId === z.id}
                className={`text-[10px] font-black px-2 py-1 rounded-full ${z.activa ? 'bg-green-500/10 text-green-500' : 'bg-neutral-500/10 text-neutral-400'}`}>
                {z.activa ? 'ACTIVA' : 'OFF'}
              </button>
              <button onClick={() => abrirEditar(z)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
                <Pencil size={14} className={sub} />
              </button>
              <button onClick={() => eliminar(z)} disabled={accionId === z.id}
                className={`p-2 rounded-lg ${isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 hover:bg-red-100'}`}>
                {accionId === z.id ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} className="text-red-500" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
