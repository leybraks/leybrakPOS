import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, ImagePlus, CalendarClock, Loader2, Send,
  CheckCircle2, XCircle, Clock, Ban, Trash2, RefreshCw, Repeat, CalendarDays,
} from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

const ESTADO_UI = {
  pendiente: { icon: Clock,        bg: 'rgba(234,179,8,0.1)',   fg: '#eab308', t: 'Activa' },
  publicada: { icon: CheckCircle2, bg: 'rgba(16,185,129,0.1)',  fg: '#10b981', t: 'Publicada' },
  error:     { icon: XCircle,      bg: 'rgba(239,68,68,0.1)',   fg: '#ef4444', t: 'Error' },
  cancelada: { icon: Ban,          bg: 'rgba(107,114,128,0.1)', fg: '#6b7280', t: 'Cancelada' },
  finalizada:{ icon: CheckCircle2, bg: 'rgba(107,114,128,0.1)', fg: '#6b7280', t: 'Finalizada' },
};

const DIAS = [
  { v: 0, l: 'L' }, { v: 1, l: 'M' }, { v: 2, l: 'M' }, { v: 3, l: 'J' },
  { v: 4, l: 'V' }, { v: 5, l: 'S' }, { v: 6, l: 'D' },
];
const DIAS_LARGO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const fmtFecha = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const describirFrecuencia = (h) => {
  if (h.frecuencia === 'unica') return `Una vez · ${fmtFecha(h.fecha_programada)}`;
  const rango = h.fecha_inicio || h.fecha_fin
    ? ` (${h.fecha_inicio ? new Date(h.fecha_inicio).toLocaleDateString('es-PE') : '…'} → ${h.fecha_fin ? new Date(h.fecha_fin).toLocaleDateString('es-PE') : 'sin fin'})`
    : '';
  if (h.frecuencia === 'diaria') return `Todos los días a las ${h.hora}${rango}`;
  const dias = (h.dias_semana || []).map(d => DIAS_LARGO[d]).join(', ');
  return `${dias} a las ${h.hora}${rango}`;
};

export default function Bot_Marketing({ sedesReales = [], isDark, colorPrimario }) {
  const toast = useToast();
  const sedesConectadas = (sedesReales || []).filter(s => s.whatsapp_instancia);

  const [sedeId, setSedeId]       = useState('');
  const [imagen, setImagen]       = useState(null);
  const [preview, setPreview]     = useState(null);
  const [texto, setTexto]         = useState('');
  const [frecuencia, setFrecuencia] = useState('unica');
  const [fecha, setFecha]         = useState('');       // datetime-local (única)
  const [hora, setHora]           = useState('');       // recurrentes
  const [dias, setDias]           = useState([]);       // semanal
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]   = useState('');

  const [historias, setHistorias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId]   = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/historias/');
      setHistorias(res.data?.historias || []);
    } catch { setHistorias([]); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    if (!sedeId && sedesConectadas.length > 0) setSedeId(String(sedesConectadas[0].id));
  }, [sedesConectadas, sedeId]);

  const elegirImagen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.warning('La imagen no debe superar 8 MB.'); return; }
    setImagen(f); setPreview(URL.createObjectURL(f));
  };

  const toggleDia = (v) => setDias(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const programar = async () => {
    if (!sedeId) { toast.warning('Elige la sede que publicará.'); return; }
    if (!imagen) { toast.warning('Sube la imagen.'); return; }
    if (frecuencia === 'unica' && !fecha) { toast.warning('Elige fecha y hora.'); return; }
    if (frecuencia !== 'unica' && !hora) { toast.warning('Elige la hora de publicación.'); return; }
    if (frecuencia === 'semanal' && dias.length === 0) { toast.warning('Elige al menos un día.'); return; }

    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append('sede', sedeId);
      fd.append('imagen', imagen);
      fd.append('texto', texto);
      fd.append('frecuencia', frecuencia);
      if (frecuencia === 'unica') {
        fd.append('fecha_programada', new Date(fecha).toISOString());
      } else {
        fd.append('hora', hora);
        if (fechaInicio) fd.append('fecha_inicio', fechaInicio);
        if (fechaFin) fd.append('fecha_fin', fechaFin);
        if (frecuencia === 'semanal') fd.append('dias_semana', JSON.stringify(dias));
      }
      await api.post('/historias/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Historia programada. 📲');
      setImagen(null); setPreview(null); setTexto(''); setFecha(''); setHora(''); setDias([]); setFechaInicio(''); setFechaFin('');
      cargar();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo programar.');
    } finally { setGuardando(false); }
  };

  const cancelar = async (id) => {
    setAccionId(id);
    try { await api.post(`/historias/${id}/cancelar/`); toast.success('Historia cancelada.'); cargar(); }
    catch (e) { toast.error(e?.response?.data?.error || 'No se pudo cancelar.'); }
    finally { setAccionId(null); }
  };

  const card = `rounded-[2rem] p-6 border ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'}`;
  const inp = isDark ? 'bg-[#0a0a0a] border-[#333] text-white placeholder:text-neutral-600'
                     : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const lbl = isDark ? 'text-neutral-500' : 'text-gray-400';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-neutral-400' : 'text-gray-500';

  const FRECS = [
    { id: 'unica',   label: 'Una vez',   icon: CalendarClock },
    { id: 'diaria',  label: 'Cada día',  icon: Repeat },
    { id: 'semanal', label: 'Semanal',   icon: CalendarDays },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">

      {/* COLUMNA 1: PROGRAMAR */}
      <div className={card}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
            <Megaphone size={24} />
          </div>
          <div>
            <h3 className={`text-xl font-black ${txt}`}>Programar Historia</h3>
            <p className={`text-xs ${sub}`}>Se publica sola como estado de WhatsApp.</p>
          </div>
        </div>

        {sedesConectadas.length === 0 ? (
          <div className={`mt-6 p-6 rounded-2xl border border-dashed text-center ${isDark ? 'border-[#333] bg-[#161616]' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-sm font-bold ${txt}`}>No hay líneas conectadas</p>
            <p className={`text-xs mt-1 ${sub}`}>Conecta el WhatsApp de una sede en "Conexión WhatsApp".</p>
          </div>
        ) : (
          <div className="space-y-4 mt-5">
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Publica con la línea de</label>
              <select value={sedeId} onChange={(e) => setSedeId(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border font-bold text-sm outline-none cursor-pointer ${inp}`}>
                {sedesConectadas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            {/* Imagen */}
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Imagen</label>
              <label className={`block rounded-2xl border border-dashed cursor-pointer overflow-hidden ${isDark ? 'border-[#333] hover:border-[#555] bg-[#0a0a0a]' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                {preview
                  ? <img src={preview} alt="preview" className="w-full max-h-60 object-contain" />
                  : <div className="flex flex-col items-center justify-center py-9 gap-2">
                      <ImagePlus size={30} className={isDark ? 'text-neutral-600' : 'text-gray-300'} />
                      <span className={`text-xs font-bold ${sub}`}>Subir imagen (máx. 8 MB)</span>
                    </div>}
                <input type="file" accept="image/*" className="hidden" onChange={elegirImagen} />
              </label>
            </div>

            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Texto (opcional)</label>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={500}
                placeholder="Ej: ¡Hoy 2x1 en alitas hasta las 9pm! 🔥"
                className={`w-full px-4 py-3 rounded-xl border font-medium text-sm outline-none resize-y ${inp}`} />
            </div>

            {/* Frecuencia */}
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Repetición</label>
              <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
                {FRECS.map(f => {
                  const Icon = f.icon; const activo = frecuencia === f.id;
                  return (
                    <button key={f.id} onClick={() => setFrecuencia(f.id)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activo ? 'text-white' : sub}`}
                      style={activo ? { backgroundColor: colorPrimario } : {}}>
                      <Icon size={14} /> {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos según frecuencia */}
            {frecuencia === 'unica' ? (
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Fecha y hora</label>
                <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-bold text-sm outline-none ${inp}`} />
              </div>
            ) : (
              <>
                {frecuencia === 'semanal' && (
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Días</label>
                    <div className="flex gap-1.5">
                      {DIAS.map(d => {
                        const activo = dias.includes(d.v);
                        return (
                          <button key={d.v} onClick={() => toggleDia(d.v)}
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-colors border ${activo ? 'text-white border-transparent' : (isDark ? 'border-[#333] text-neutral-400' : 'border-gray-200 text-gray-500')}`}
                            style={activo ? { backgroundColor: colorPrimario } : {}}>
                            {d.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Hora de publicación</label>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border font-bold text-sm outline-none ${inp}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Desde (opcional)</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                      className={`w-full px-3 py-3 rounded-xl border font-bold text-sm outline-none ${inp}`} />
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Hasta (opcional)</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                      className={`w-full px-3 py-3 rounded-xl border font-bold text-sm outline-none ${inp}`} />
                  </div>
                </div>
              </>
            )}

            <button onClick={programar} disabled={guardando}
              className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: colorPrimario }}>
              {guardando ? <><Loader2 size={16} className="animate-spin" /> Programando...</> : <><Send size={16} /> Programar Historia</>}
            </button>
          </div>
        )}
      </div>

      {/* COLUMNA 2: LISTA */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-xl font-black ${txt}`}>Historias</h3>
          <button onClick={() => { setCargando(true); cargar(); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
            <RefreshCw size={16} className={sub} />
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: colorPrimario }} size={28} /></div>
        ) : historias.length === 0 ? (
          <p className={`text-sm text-center py-16 ${sub}`}>Aún no programas ninguna historia.</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {historias.map(h => {
              const e = ESTADO_UI[h.estado] || ESTADO_UI.pendiente;
              const Icono = e.icon;
              const recurrente = h.frecuencia !== 'unica';
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'border-[#222] bg-[#161616]' : 'border-gray-100 bg-gray-50'}`}>
                  {h.imagen
                    ? <img src={h.imagen} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    : <div className={`w-14 h-14 rounded-xl shrink-0 ${isDark ? 'bg-[#222]' : 'bg-gray-200'}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: e.bg, color: e.fg }}>
                        <Icono size={10} /> {e.t}
                      </span>
                      {recurrente && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
                          <Repeat size={10} /> Recurrente
                        </span>
                      )}
                      <span className={`text-[10px] font-bold ${sub}`}>{h.sede_nombre}</span>
                    </div>
                    <p className={`text-xs font-bold truncate mt-1 ${txt}`}>{h.texto || 'Sin texto'}</p>
                    <p className={`text-[11px] ${sub}`}>{describirFrecuencia(h)}</p>
                    {h.estado === 'error' && !!h.error_msg && <p className="text-[11px] text-red-400 truncate">{h.error_msg}</p>}
                  </div>
                  {h.estado === 'pendiente' && (
                    <button onClick={() => cancelar(h.id)} disabled={accionId === h.id}
                      className={`p-2.5 rounded-xl shrink-0 disabled:opacity-50 ${isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 hover:bg-red-100'}`}
                      title={recurrente ? 'Detener recurrencia' : 'Cancelar'}>
                      {accionId === h.id ? <Loader2 size={15} className="animate-spin text-red-500" /> : <Trash2 size={15} className="text-red-500" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
