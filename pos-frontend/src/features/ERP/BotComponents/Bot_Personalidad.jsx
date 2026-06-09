import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Loader2, Smile, MessageCircle, ListChecks, Bot } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

/**
 * Personalidad del bot de WhatsApp (a nivel negocio).
 * Guarda en Negocio (bot_nombre/personalidad/emojis/instrucciones).
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
        toast.error('No se pudo cargar la personalidad del bot.');
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
      toast.success('Personalidad del bot guardada.');
    } catch {
      toast.error('Error al guardar la personalidad.');
    } finally {
      setGuardando(false);
    }
  };

  const card = isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200 shadow-sm';
  const inp  = isDark
    ? 'bg-[#0a0a0a] border-[#333] text-white placeholder:text-neutral-600'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-neutral-400' : 'text-gray-500';
  const lbl  = isDark ? 'text-neutral-500' : 'text-gray-400';

  if (cargando) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin" style={{ color: colorPrimario }} size={32} /></div>;
  }

  const Campo = ({ icon: Icon, label, hint, children }) => (
    <div className={`rounded-3xl p-6 border ${card}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} style={{ color: colorPrimario }} />
        <h3 className={`text-sm font-black ${txt}`}>{label}</h3>
      </div>
      {hint && <p className={`text-xs mb-3 ${sub}`}>{hint}</p>}
      {children}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-10">
      <div className={`flex items-start gap-2 p-4 rounded-2xl ${isDark ? 'bg-[#161616]' : 'bg-gray-50'} border ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>
        <Bot size={18} style={{ color: colorPrimario }} className="mt-0.5 shrink-0" />
        <p className={`text-xs ${sub}`}>
          Define cómo se comunica tu asistente. Esto aplica a <b>todas las sedes</b> y el bot lo usa
          al instante (n8n lo lee del negocio).
        </p>
      </div>

      <Campo icon={Sparkles} label="Nombre del asistente" hint="¿Cómo se presenta? Déjalo vacío si no quieres que tenga nombre propio.">
        <input
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          maxLength={50}
          placeholder="Ej: Bravito"
          className={`w-full px-4 py-3 rounded-xl border font-medium outline-none ${inp}`}
        />
      </Campo>

      <Campo icon={MessageCircle} label="Forma de hablar" hint="Tono, trato (de tú o de usted), si es divertido o formal, jerga local, etc.">
        <textarea
          value={form.personalidad}
          onChange={(e) => setForm({ ...form, personalidad: e.target.value })}
          rows={4}
          placeholder="Ej: Habla cercano y amigable, de tú, con jerga peruana. Es alegre pero respetuoso y va al grano."
          className={`w-full px-4 py-3 rounded-xl border font-medium outline-none resize-y ${inp}`}
        />
      </Campo>

      <Campo icon={Smile} label="Emojis" hint="Qué emojis puede usar, o escribe 'ninguno' para que no use.">
        <input
          value={form.emojis}
          onChange={(e) => setForm({ ...form, emojis: e.target.value })}
          maxLength={255}
          placeholder="Ej: 🍔🔥😋👍   (o 'ninguno')"
          className={`w-full px-4 py-3 rounded-xl border font-medium outline-none ${inp}`}
        />
      </Campo>

      <Campo icon={ListChecks} label="Reglas e instrucciones extra" hint="Cosas que SIEMPRE o NUNCA debe hacer.">
        <textarea
          value={form.instrucciones}
          onChange={(e) => setForm({ ...form, instrucciones: e.target.value })}
          rows={4}
          placeholder={"Ej:\n- Siempre ofrece el combo del día.\n- Nunca prometas descuentos no autorizados.\n- Si no sabe algo, deriva a un humano."}
          className={`w-full px-4 py-3 rounded-xl border font-medium outline-none resize-y ${inp}`}
        />
      </Campo>

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: colorPrimario }}
      >
        {guardando ? <><Loader2 size={18} className="animate-spin" /> Guardando…</> : <><Save size={18} /> Guardar personalidad</>}
      </button>

      <p className={`text-[11px] text-center ${lbl}`}>
        El asistente debe estar conectado y el workflow de n8n configurado para leer la personalidad.
      </p>
    </div>
  );
}
