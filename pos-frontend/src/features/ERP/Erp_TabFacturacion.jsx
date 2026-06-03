import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { getNegocio, actualizarNegocio } from '../../api/api';

const MODOS = [
  { id: 'desactivado', titulo: 'Desactivado', desc: 'No se declara nada. El POS funciona solo con el Ticket Digital.' },
  { id: 'opcional',    titulo: 'Opcional',    desc: 'Aparece un botón al cobrar para emitir solo si el cliente lo pide.' },
  { id: 'automatico',  titulo: 'Automático',  desc: 'Toda venta abre el comprobante al cobrar (boleta por defecto).' },
];

export default function Erp_TabFacturacion() {
  const { configuracionGlobal } = usePosStore();
  const isDark = (configuracionGlobal?.temaFondo || 'dark') === 'dark';
  const color  = configuracionGlobal?.colorPrimario || '#ff5a1f';

  const [emision, setEmision]   = useState('desactivado');
  const [entorno, setEntorno]   = useState('demo');
  const [ruta, setRuta]         = useState('');
  const [token, setToken]       = useState('');
  const [ruc, setRuc]           = useState('');
  const [razon, setRazon]       = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]           = useState(null);

  const negocioId = localStorage.getItem('negocio_id');

  useEffect(() => {
    (async () => {
      try {
        const res = await getNegocio(negocioId);
        const d = res.data;
        setEmision(d.facturacion_emision || 'desactivado');
        setEntorno(d.facturacion_entorno || 'demo');
        setRuta(d.facturacion_ruta || '');
        setRuc(d.ruc || '');
        setRazon(d.razon_social || '');
      } catch {
        setMsg({ tipo: 'error', texto: 'No se pudo cargar la configuración.' });
      } finally {
        setCargando(false);
      }
    })();
  }, [negocioId]);

  const guardar = async () => {
    setGuardando(true); setMsg(null);
    const payload = { facturacion_emision: emision, facturacion_entorno: entorno };
    if (entorno === 'produccion') {
      payload.facturacion_ruta = ruta;
      if (token) payload.facturacion_token = token;   // no sobreescribir si está vacío
    }
    try {
      await actualizarNegocio(negocioId, payload);
      setMsg({ tipo: 'ok', texto: 'Configuración guardada.' });
      setToken('');
    } catch (e) {
      setMsg({ tipo: 'error', texto: e?.response?.data?.error || 'No se pudo guardar.' });
    } finally {
      setGuardando(false);
    }
  };

  const card = isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200 shadow-sm';
  const inp  = isDark ? 'bg-[#0a0a0a] border-[#222] text-white placeholder:text-neutral-600'
                      : 'bg-white border-gray-200 text-gray-900';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-neutral-400' : 'text-gray-500';

  if (cargando) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin" style={{ color }} size={32} /></div>;
  }

  const faltaRucEmisor = !ruc || !razon;

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
          <FileText size={28} />
        </div>
        <div>
          <h2 className={`text-2xl font-black ${txt}`}>Facturación Electrónica</h2>
          <p className={`text-sm ${sub}`}>Emite Boletas y Facturas a SUNAT vía Nubefact.</p>
        </div>
      </div>

      {faltaRucEmisor && (
        <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-500">Configura el <b>RUC</b> y la <b>razón social</b> del negocio (en Datos del Negocio) antes de emitir.</p>
        </div>
      )}

      {/* Modo de emisión */}
      <div className={`rounded-3xl p-6 border ${card}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${sub}`}>Modo de emisión</h3>
        <div className="space-y-3">
          {MODOS.map(m => (
            <button key={m.id} onClick={() => setEmision(m.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${emision === m.id ? '' : (isDark ? 'border-[#222]' : 'border-gray-200')}`}
              style={emision === m.id ? { borderColor: color, backgroundColor: color + '10' } : {}}>
              <div className="flex items-center justify-between">
                <span className={`font-black ${txt}`}>{m.titulo}</span>
                {emision === m.id && <CheckCircle2 size={18} style={{ color }} />}
              </div>
              <p className={`text-xs mt-1 ${sub}`}>{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Entorno / credenciales */}
      {emision !== 'desactivado' && (
        <div className={`rounded-3xl p-6 border ${card}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${sub}`}>Conexión con Nubefact</h3>
          <div className={`flex p-1 rounded-xl mb-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
            {[['demo', 'Demo (pruebas)'], ['produccion', 'Producción']].map(([id, label]) => (
              <button key={id} onClick={() => setEntorno(id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${entorno === id ? 'text-white' : sub}`}
                style={entorno === id ? { backgroundColor: color } : {}}>{label}</button>
            ))}
          </div>
          {entorno === 'demo' ? (
            <p className={`text-xs ${sub}`}>Modo demo: usa las credenciales de prueba del sistema. Los comprobantes <b>no</b> tienen valor legal.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-bold uppercase ${sub}`}>Ruta / URL de tu cuenta Nubefact</label>
                <input value={ruta} onChange={e => setRuta(e.target.value)} placeholder="https://api.nubefact.com/api/v1/..."
                  className={`w-full mt-1 px-4 py-3 rounded-xl border font-medium outline-none ${inp}`} />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${sub}`}>Token (déjalo vacío para mantener el actual)</label>
                <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••••••"
                  className={`w-full mt-1 px-4 py-3 rounded-xl border font-medium outline-none ${inp}`} />
              </div>
            </div>
          )}
          <p className={`text-xs mt-4 ${sub}`}>Series: <b>B001</b> (boletas) y <b>F001</b> (facturas), correlativos automáticos.</p>
        </div>
      )}

      {/* Guardar */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl ${msg.tipo === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
          {msg.tipo === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-bold">{msg.texto}</span>
        </div>
      )}
      <button onClick={guardar} disabled={guardando}
        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: color }}>
        {guardando ? <><Loader2 size={18} className="animate-spin" /> Guardando…</> : <><Save size={18} /> Guardar configuración</>}
      </button>
    </div>
  );
}
