import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, CheckCircle2, AlertTriangle, Download, Receipt } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { getNegocio, actualizarNegocio, getComprobantes } from '../../api/api';

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const ESTADO_COLOR = {
  aceptado:  { bg: 'rgba(16,185,129,0.1)', fg: '#10b981', t: 'Aceptado' },
  rechazado: { bg: 'rgba(239,68,68,0.1)',  fg: '#ef4444', t: 'Rechazado' },
  pendiente: { bg: 'rgba(234,179,8,0.1)',  fg: '#eab308', t: 'Pendiente' },
  anulado:   { bg: 'rgba(107,114,128,0.1)',fg: '#6b7280', t: 'Anulado' },
};

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
  const [serieBoleta, setSerieBoleta] = useState('B001');
  const [serieFactura, setSerieFactura] = useState('F001');
  const [ruc, setRuc]           = useState('');
  const [razon, setRazon]       = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]           = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(true);

  const negocioId = localStorage.getItem('negocio_id');

  const cargarHistorial = async () => {
    setCargandoHist(true);
    try {
      const res = await getComprobantes();
      setHistorial(res.data?.comprobantes || []);
    } catch {
      setHistorial([]);
    } finally {
      setCargandoHist(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarHistorial(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNegocio(negocioId);
        const d = res.data;
        setEmision(d.facturacion_emision || 'desactivado');
        setEntorno(d.facturacion_entorno || 'demo');
        setRuta(d.facturacion_ruta || '');
        setSerieBoleta(d.facturacion_serie_boleta || 'B001');
        setSerieFactura(d.facturacion_serie_factura || 'F001');
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
    const payload = {
      facturacion_emision: emision,
      facturacion_entorno: entorno,
      facturacion_ruta: ruta,
      facturacion_serie_boleta: serieBoleta.toUpperCase(),
      facturacion_serie_factura: serieFactura.toUpperCase(),
    };
    if (token) payload.facturacion_token = token;   // no sobreescribir si está vacío
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
          <p className={`text-xs mb-3 ${entorno === 'demo' ? 'text-amber-500' : sub}`}>
            {entorno === 'demo'
              ? 'Modo DEMO: usa una cuenta de prueba de demo.nubefact.com. Los comprobantes NO tienen valor legal.'
              : 'Producción: comprobantes reales declarados a SUNAT bajo tu RUC.'}
          </p>
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
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className={`text-xs font-bold uppercase ${sub}`}>Serie Boleta</label>
              <input value={serieBoleta} onChange={e => setSerieBoleta(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="B001" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase ${sub}`}>Serie Factura</label>
              <input value={serieFactura} onChange={e => setSerieFactura(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="F001" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
            </div>
          </div>
          <p className={`text-xs mt-2 ${sub}`}>Las series deben coincidir con las registradas en tu cuenta Nubefact. Los correlativos son automáticos.</p>
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

      {/* ── Historial de comprobantes ── */}
      <div className={`rounded-3xl p-6 border ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-black flex items-center gap-2 ${txt}`}><Receipt size={18} style={{ color }} /> Comprobantes emitidos</h3>
          <button onClick={cargarHistorial} className={`text-xs font-bold ${sub}`}>Actualizar</button>
        </div>

        {cargandoHist ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color }} size={24} /></div>
        ) : historial.length === 0 ? (
          <p className={`text-sm text-center py-8 ${sub}`}>Aún no se ha emitido ningún comprobante.</p>
        ) : (
          <div className="space-y-2">
            {historial.map(c => {
              const e = ESTADO_COLOR[c.estado_sunat] || ESTADO_COLOR.pendiente;
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'border-[#222]' : 'border-gray-100'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-sm ${txt}`}>{c.tipo === 'factura' ? 'Factura' : 'Boleta'} {c.serie}-{c.numero}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: e.bg, color: e.fg }}>{e.t}</span>
                    </div>
                    <p className={`text-xs truncate ${sub}`}>{c.receptor_denominacion}{c.receptor_num_doc ? ` · ${c.receptor_num_doc}` : ''} · {fmtFecha(c.creado_en)}</p>
                  </div>
                  <span className={`font-bold text-sm ${txt}`}>S/ {parseFloat(c.total).toFixed(2)}</span>
                  {c.enlace_pdf && (
                    <a href={c.enlace_pdf} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg" style={{ backgroundColor: color + '20', color }}><Download size={16} /></a>
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
