import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Loader2, Plus, X, Sparkles, ImagePlus, Trash2, Smile } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

const STICKER_CTX = [
  { k: 'saludo', l: 'Saludo' },
  { k: 'pedido_confirmado', l: 'Pedido a cocina' },
  { k: 'delivery_camino', l: 'Delivery en camino' },
  { k: 'agradecimiento', l: 'Agradecimiento' },
  { k: 'despedida', l: 'Despedida' },
  { k: 'general', l: 'General' },
];

const TONOS = [
  { k: 'amable',    l: 'Amable',    e: '🤗' },
  { k: 'directo',   l: 'Directo',   e: '🎯' },
  { k: 'rapido',    l: 'Rápido',    e: '⚡' },
  { k: 'divertido', l: 'Divertido', e: '😄' },
  { k: 'formal',    l: 'Formal',    e: '🎩' },
  { k: 'vendedor',  l: 'Vendedor',  e: '💸' },
];

const EMOJI_PALETA = ['🍔','🍟','🥤','🍕','🌮','🌯','🍗','🥗','🍜','🍣','🍰','☕','🔥','😋','😄','👍','🙌','💪','🎉','❤️','⭐','🛵','✅','🙏'];

const REGLAS_SUGERIDAS = [
  'Siempre ofrece el combo del día',
  'Nunca prometas descuentos no autorizados',
  'Si no sabes algo, deriva a un humano',
];

/** Personalización del bot: presets de tono + emojis (picker) + reglas (formulario). */
export default function Bot_Personalidad({ isDark, colorPrimario }) {
  const toast = useToast();
  const negocioId = localStorage.getItem('negocio_id');

  const [nombre, setNombre]   = useState('');
  const [tono, setTono]       = useState([]);
  const [emojis, setEmojis]   = useState([]);
  const [reglas, setReglas]   = useState([]);
  const [nuevaRegla, setNuevaRegla] = useState('');
  const [cargando, setCargando]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [stickers, setStickers]   = useState([]);
  const [ctxSticker, setCtxSticker] = useState('saludo');
  const [subiendo, setSubiendo]   = useState(false);

  const cargarStickers = async () => {
    try { const r = await api.get('/stickers/'); setStickers(r.data?.stickers || []); } catch { /* noop */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get(`/negocios/${negocioId}/`);
        setNombre(d.bot_nombre || '');
        setTono(Array.isArray(d.bot_tono) ? d.bot_tono : []);
        setEmojis(Array.from(d.bot_emojis || ''));
        setReglas(Array.isArray(d.bot_reglas) ? d.bot_reglas : []);
        await cargarStickers();
      } catch { toast.error('No se pudo cargar la personalización.'); }
      finally { setCargando(false); }
    })();
  }, [negocioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const subirSticker = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { toast.warning('El sticker no debe superar 3 MB.'); return; }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('imagen', f);
      fd.append('contexto', ctxSticker);
      await api.post('/stickers/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Sticker subido.');
      cargarStickers();
    } catch { toast.error('No se pudo subir el sticker.'); }
    finally { setSubiendo(false); e.target.value = ''; }
  };

  const borrarSticker = async (id) => {
    try { await api.delete(`/stickers/${id}/`); cargarStickers(); }
    catch { toast.error('No se pudo eliminar.'); }
  };

  const toggleTono  = (k) => setTono(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const toggleEmoji = (e) => setEmojis(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);
  const agregarRegla = (txt) => {
    const r = (txt || nuevaRegla).trim();
    if (!r) return;
    if (reglas.includes(r)) { toast.warning('Esa regla ya está.'); return; }
    setReglas(p => [...p, r]); setNuevaRegla('');
  };
  const quitarRegla = (i) => setReglas(p => p.filter((_, idx) => idx !== i));

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/negocios/${negocioId}/`, {
        bot_nombre: nombre,
        bot_tono: tono,
        bot_emojis: emojis.join(''),
        bot_reglas: reglas,
      });
      toast.success('Personalización guardada. El bot ya habla así. 🤖');
    } catch { toast.error('No se pudo guardar.'); }
    finally { setGuardando(false); }
  };

  const card = `rounded-[2rem] p-6 border ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'}`;
  const inp = isDark ? 'bg-[#0a0a0a] border-[#333] text-white placeholder:text-neutral-600'
                     : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const lbl = isDark ? 'text-neutral-500' : 'text-gray-400';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-neutral-400' : 'text-gray-500';
  const chipOff = isDark ? 'border-[#333] text-neutral-300' : 'border-gray-200 text-gray-600';

  if (cargando) {
    return <div className={`${card} flex items-center justify-center`}><Loader2 className="animate-spin" style={{ color: colorPrimario }} size={26} /></div>;
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
          <MessageSquare size={22} />
        </div>
        <div>
          <h3 className={`text-xl font-black ${txt}`}>Personalización</h3>
          <p className={`text-xs ${sub}`}>Cómo habla el bot. Aplica a todas las sedes.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Nombre */}
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Nombre del asistente</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={50}
            placeholder="Ej: Bravito (vacío = sin nombre)"
            className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none ${inp}`} />
        </div>

        {/* Tono (presets) */}
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Tono (elige los que quieras)</label>
          <div className="flex flex-wrap gap-2">
            {TONOS.map(t => {
              const on = tono.includes(t.k);
              return (
                <button key={t.k} onClick={() => toggleTono(t.k)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-colors ${on ? 'text-white border-transparent' : chipOff}`}
                  style={on ? { backgroundColor: colorPrimario } : {}}>
                  <span>{t.e}</span> {t.l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emojis (picker) */}
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>
            Emojis que puede usar {emojis.length > 0 && <span style={{ color: colorPrimario }}>({emojis.length})</span>}
          </label>
          <div className={`flex flex-wrap gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-[#333] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
            {EMOJI_PALETA.map(e => {
              const on = emojis.includes(e);
              return (
                <button key={e} onClick={() => toggleEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${on ? 'scale-110' : 'opacity-40 hover:opacity-80'}`}
                  style={on ? { backgroundColor: colorPrimario + '30' } : {}}
                  title={on ? 'Quitar' : 'Añadir'}>
                  {e}
                </button>
              );
            })}
          </div>
          <p className={`text-[11px] mt-1.5 ${sub}`}>Toca un emoji para activarlo/desactivarlo. Sin ninguno = el bot casi no usa emojis.</p>
        </div>

        {/* Reglas (formulario) */}
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Reglas e instrucciones</label>
          <div className="flex gap-2 mb-2">
            <input value={nuevaRegla} onChange={(e) => setNuevaRegla(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarRegla(); } }}
              placeholder="Ej: Siempre ofrece el combo del día"
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium outline-none ${inp}`} />
            <button onClick={() => agregarRegla()}
              className="px-4 rounded-xl text-white font-black flex items-center" style={{ backgroundColor: colorPrimario }}>
              <Plus size={16} />
            </button>
          </div>

          {reglas.length === 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[11px] ${sub} mr-1`}>Sugeridas:</span>
              {REGLAS_SUGERIDAS.map(r => (
                <button key={r} onClick={() => agregarRegla(r)}
                  className={`text-[11px] px-2 py-1 rounded-full border ${chipOff} flex items-center gap-1`}>
                  <Sparkles size={10} /> {r}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {reglas.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-[#161616]' : 'bg-gray-50'}`}>
                  <span className="text-xs font-black" style={{ color: colorPrimario }}>{i + 1}.</span>
                  <span className={`flex-1 text-sm ${txt}`}>{r}</span>
                  <button onClick={() => quitarRegla(i)} className={`p-1 rounded ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-200'}`}>
                    <X size={14} className={sub} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stickers */}
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>
            Stickers <span className="normal-case font-medium">(el bot los manda según el momento)</span>
          </label>
          <div className={`p-3 rounded-2xl border ${isDark ? 'border-[#333] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex gap-2 mb-3">
              <select value={ctxSticker} onChange={(e) => setCtxSticker(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold outline-none ${inp}`}>
                {STICKER_CTX.map(c => <option key={c.k} value={c.k}>{c.l}</option>)}
              </select>
              <label className="px-4 rounded-xl text-white font-black flex items-center gap-1.5 cursor-pointer text-sm"
                style={{ backgroundColor: colorPrimario, opacity: subiendo ? 0.6 : 1 }}>
                {subiendo ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                Subir
                <input type="file" accept="image/*" className="hidden" onChange={subirSticker} disabled={subiendo} />
              </label>
            </div>
            {stickers.length === 0 ? (
              <p className={`text-[11px] text-center py-3 ${sub}`}>Sin stickers. Sube uno y elige cuándo lo usa el bot.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {stickers.map(s => (
                  <div key={s.id} className="relative group">
                    <img src={s.imagen} alt="" className={`w-full aspect-square object-contain rounded-xl ${isDark ? 'bg-[#161616]' : 'bg-white'} border ${isDark ? 'border-[#222]' : 'border-gray-100'}`} />
                    <span className="absolute bottom-0 inset-x-0 text-[8px] font-black text-center text-white bg-black/60 rounded-b-xl py-0.5 truncate px-1">
                      {STICKER_CTX.find(c => c.k === s.contexto)?.l || s.contexto}
                    </span>
                    <button onClick={() => borrarSticker(s.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className={`text-[11px] mt-1.5 ${sub}`}>Ideal: imágenes cuadradas (Evolution las convierte a sticker).</p>
        </div>

        <button onClick={guardar} disabled={guardando}
          className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: colorPrimario }}>
          {guardando ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Personalización</>}
        </button>
      </div>
    </div>
  );
}
