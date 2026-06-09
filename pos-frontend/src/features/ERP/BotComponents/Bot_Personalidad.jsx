import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

/**
 * Personalización del bot (a nivel negocio). Encaja como una columna de la grilla
 * de "Comportamiento". Guarda en Negocio (bot_nombre/personalidad/emojis/instrucciones).
 * n8n lo lee de /negocios/info_bot/ (objeto `persona`) y lo inyecta en el prompt.
 */
export default function Bot_Personalidad({ isDark, colorPrimario }) {
  const toast = useToast();
  const negocioId = localStorage.getItem('negocio_id');

  const [form, setForm] = useState({ nombre: '', personalidad: '', emojis: '', instrucciones: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/negocios/${negocioId}/`);
        const d = res.data;
        setForm({
          nombre:        d.bot_nombre || '',
          personalidad:  d.bot_personalidad || '',
          emojis:        d.bot_emojis || '',
          instrucciones: d.bot_instrucciones || '',
        });
      } catch {
        toast.error('No se pudo cargar la personalización del bot.');
      } finally {
        setCargando(false);
      }
    })();
  }, [negocioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/negocios/${negocioId}/`, {
        bot_nombre:        form.nombre,
        bot_personalidad:  form.personalidad,
        bot_emojis:        form.emojis,
        bot_instrucciones: form.instrucciones,
      });
      toast.success('Personalización del bot guardada.');
    } catch {
      toast.error('Error al guardar la personalización.');
    } finally {
      setGuardando(false);
    }
  };

  const inp = isDark
    ? 'bg-[#0a0a0a] border-[#333] text-white placeholder:text-neutral-600 focus:border-current'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const lbl = isDark ? 'text-neutral-400' : 'text-gray-500';

  const card = `rounded-[2rem] p-6 border ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'}`;

  if (cargando) {
    return (
      <div className={`${card} flex items-center justify-center`}>
        <Loader2 className="animate-spin" style={{ color: colorPrimario }} size={28} />
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Personalización</h3>
          <p className={`text-xs ${lbl}`}>Cómo habla el bot. Aplica a todas las sedes.</p>
        </div>
      </div>

      <div className="space-y-4 mt-5">
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Nombre del asistente</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            maxLength={50}
            placeholder="Ej: Bravito (vacío = sin nombre)"
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none text-sm transition-colors ${inp}`}
            style={{ '--tw-ring-color': colorPrimario }}
          />
        </div>

        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Forma de hablar / tono</label>
          <textarea
            value={form.personalidad}
            onChange={(e) => setForm({ ...form, personalidad: e.target.value })}
            rows={3}
            placeholder="Ej: Cercano y amigable, de tú, con jerga peruana. Alegre pero respetuoso y va al grano."
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none text-sm resize-y transition-colors ${inp}`}
          />
        </div>

        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Emojis</label>
          <input
            value={form.emojis}
            onChange={(e) => setForm({ ...form, emojis: e.target.value })}
            maxLength={255}
            placeholder="Ej: 🍔🔥😋👍   (o 'ninguno')"
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none text-sm transition-colors ${inp}`}
          />
        </div>

        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Reglas / FAQs e instrucciones</label>
          <textarea
            value={form.instrucciones}
            onChange={(e) => setForm({ ...form, instrucciones: e.target.value })}
            rows={4}
            placeholder={'Ej:\n- Siempre ofrece el combo del día.\n- Nunca prometas descuentos no autorizados.\n- Si preguntan por delivery, indica el costo.'}
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none text-sm resize-y transition-colors ${inp}`}
          />
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all text-white shadow-lg active:scale-95 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: colorPrimario }}
        >
          {guardando ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Personalización</>}
        </button>
      </div>
    </div>
  );
}
