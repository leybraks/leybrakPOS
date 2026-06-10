import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Save, Loader2, Coins, Sparkles, Check, History, RefreshCw } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

const fmtFecha = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/** Programa de puntos / fidelización (a nivel negocio). Activar, configurar canje, ver historial. */
export default function Crm_Puntos({ isDark, colorPrimario }) {
  const toast = useToast();
  const negocioId = localStorage.getItem('negocio_id');

  const [activo, setActivo]   = useState(false);
  const [porSol, setPorSol]   = useState('1');
  const [minimo, setMinimo]   = useState('100');
  const [valor, setValor]     = useState('0.10');
  const [canjes, setCanjes]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [neg, can] = await Promise.all([
        api.get(`/negocios/${negocioId}/`),
        api.get('/canjes-puntos/').catch(() => ({ data: { canjes: [] } })),
      ]);
      const d = neg.data;
      setActivo(!!d.puntos_activo);
      setPorSol(String(d.puntos_por_sol ?? '1'));
      setMinimo(String(d.puntos_canje_minimo ?? '100'));
      setValor(String(d.puntos_valor_soles ?? '0.10'));
      setCanjes(can.data?.canjes || []);
    } catch { toast.error('No se pudo cargar el programa de puntos.'); }
    finally { setCargando(false); }
  }, [negocioId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/negocios/${negocioId}/`, {
        puntos_activo: activo,
        puntos_por_sol: Number(porSol) || 0,
        puntos_canje_minimo: parseInt(minimo) || 0,
        puntos_valor_soles: Number(valor) || 0,
      });
      toast.success('Programa de puntos guardado.');
    } catch { toast.error('No se pudo guardar.'); }
    finally { setGuardando(false); }
  };

  const card = `rounded-[2rem] p-6 border ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'}`;
  const inp = isDark ? 'bg-[#0a0a0a] border-[#333] text-white' : 'bg-white border-gray-200 text-gray-900';
  const lbl = isDark ? 'text-neutral-500' : 'text-gray-400';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-neutral-400' : 'text-gray-500';

  if (cargando) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin" style={{ color: colorPrimario }} size={32} /></div>;
  }

  // Ejemplo en vivo
  const ejPuntos = parseInt(minimo) || 0;
  const ejSoles = (ejPuntos * (Number(valor) || 0)).toFixed(2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">

      {/* CONFIG */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
              <Gift size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-black ${txt}`}>Programa de Puntos</h3>
              <p className={`text-xs ${sub}`}>Fideliza a tus clientes. Lo usa el bot y el POS.</p>
            </div>
          </div>
          <button onClick={() => setActivo(a => !a)}
            className={`w-14 h-7 rounded-full transition-colors relative flex items-center shrink-0 ${activo ? '' : 'bg-neutral-500'}`}
            style={activo ? { backgroundColor: colorPrimario } : {}}>
            <div className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${activo ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>

        {!activo && <p className={`text-xs mb-4 ${sub}`}>Programa desactivado: el bot no menciona puntos y no se puede canjear.</p>}

        <div className={`space-y-4 ${activo ? '' : 'opacity-50 pointer-events-none'}`}>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${lbl}`}>Cómo se ganan puntos</label>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${sub}`}>Por cada S/ 1 gastado, el cliente gana</span>
              <input type="number" min="0" step="0.5" value={porSol} onChange={(e) => setPorSol(e.target.value)}
                className={`w-20 px-3 py-2 rounded-xl border text-sm font-black text-center outline-none ${inp}`} />
              <span className={`text-sm font-bold ${sub}`}>puntos</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#161616]' : 'bg-gray-50'}`}>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-3 ${lbl}`}>Cómo se canjean</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={`text-[11px] ${sub} block mb-1`}>Mínimo para canjear</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" min="0" value={minimo} onChange={(e) => setMinimo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-black outline-none ${inp}`} />
                  <span className={`text-xs font-bold ${sub}`}>pts</span>
                </div>
              </div>
              <div>
                <span className={`text-[11px] ${sub} block mb-1`}>Valor de cada punto</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${sub}`}>S/</span>
                  <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-black outline-none ${inp}`} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm font-bold" style={{ color: colorPrimario }}>
              <Sparkles size={15} /> Ejemplo: {ejPuntos} puntos = S/ {ejSoles} de descuento
            </div>
          </div>
        </div>

        <button onClick={guardar} disabled={guardando}
          className="w-full mt-5 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: colorPrimario }}>
          {guardando ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Programa</>}
        </button>
      </div>

      {/* HISTORIAL DE CANJES */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <History size={18} style={{ color: colorPrimario }} />
            <h3 className={`text-xl font-black ${txt}`}>Canjes realizados</h3>
          </div>
          <button onClick={() => { setCargando(true); cargar(); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
            <RefreshCw size={16} className={sub} />
          </button>
        </div>

        {canjes.length === 0 ? (
          <div className="text-center py-16">
            <Coins size={36} className={`mx-auto mb-3 ${isDark ? 'text-[#333]' : 'text-gray-200'}`} />
            <p className={`text-sm ${sub}`}>Aún no hay canjes registrados.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {canjes.map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'border-[#222] bg-[#161616]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colorPrimario + '15', color: colorPrimario }}>
                  <Coins size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm ${txt}`}>{c.cliente || c.telefono || 'Cliente'}</p>
                  <p className={`text-[11px] ${sub}`}>{fmtFecha(c.creado_en)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: colorPrimario }}>-S/ {Number(c.valor_soles).toFixed(2)}</p>
                  <p className={`text-[11px] ${sub}`}>{c.puntos} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
