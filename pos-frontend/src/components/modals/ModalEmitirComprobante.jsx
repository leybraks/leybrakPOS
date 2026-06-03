import React, { useState } from 'react';
import { FileText, Search, X, CheckCircle2, Loader2, Download, AlertTriangle } from 'lucide-react';
import { emitirComprobante, consultarRuc } from '../../api/api';

/**
 * Modal para emitir un comprobante SUNAT (Boleta/Factura) de una orden pagada.
 * Reutiliza el lookup de RUC existente para autollenar la razón social en facturas.
 */
export default function ModalEmitirComprobante({ isOpen, onClose, ordenId, isDark = true, colorPrimario = '#ff5a1f' }) {
  const [tipo, setTipo]           = useState('boleta');
  const [ruc, setRuc]             = useState('');
  const [dni, setDni]             = useState('');
  const [razonSocial, setRazon]   = useState('');
  const [direccion, setDireccion] = useState('');
  const [buscando, setBuscando]   = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [error, setError]         = useState(null);
  const [resultado, setResultado] = useState(null);   // comprobante emitido

  if (!isOpen) return null;

  const card = isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200';
  const inp  = isDark ? 'bg-[#111] border-[#222] text-white placeholder:text-neutral-600'
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-neutral-400' : 'text-gray-500';

  const buscarRuc = async () => {
    if (ruc.length !== 11) { setError('El RUC debe tener 11 dígitos.'); return; }
    setBuscando(true); setError(null);
    try {
      const res = await consultarRuc(ruc);
      setRazon(res.data?.razon_social || '');
    } catch {
      setError('No se pudo consultar el RUC.');
    } finally {
      setBuscando(false);
    }
  };

  const emitir = async () => {
    setEmitiendo(true); setError(null);
    const receptor = tipo === 'factura'
      ? { num_doc: ruc, denominacion: razonSocial, direccion }
      : (dni ? { num_doc: dni, denominacion: razonSocial } : {});
    try {
      const res = await emitirComprobante(ordenId, { tipo, receptor });
      setResultado(res.data);
    } catch (e) {
      const d = e?.response?.data;
      setError(d?.error || 'No se pudo emitir el comprobante.');
      if (d?.comprobante) setResultado(d.comprobante.estado_sunat === 'rechazado' ? null : d.comprobante);
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden ${card}`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colorPrimario + '20', color: colorPrimario }}>
              <FileText size={20} />
            </div>
            <h2 className={`text-lg font-black ${txt}`}>Comprobante SUNAT</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-[#1a1a1a] text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18} /></button>
        </div>

        <div className="p-6">
          {resultado && resultado.aceptado_por_sunat ? (
            /* ── Éxito ── */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-4">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h3 className={`text-xl font-black ${txt}`}>¡Comprobante emitido!</h3>
              <p className={`text-sm mt-1 ${sub}`}>{resultado.tipo === 'factura' ? 'Factura' : 'Boleta'} {resultado.serie}-{resultado.numero} · Aceptado por SUNAT</p>
              {resultado.enlace_pdf && (
                <a href={resultado.enlace_pdf} target="_blank" rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colorPrimario }}>
                  <Download size={18} /> Ver / Descargar PDF
                </a>
              )}
              <button onClick={onClose} className={`mt-3 w-full py-3 rounded-xl font-bold text-sm ${isDark ? 'bg-[#111] text-neutral-400' : 'bg-gray-100 text-gray-600'}`}>Cerrar</button>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              {/* Tipo */}
              <div className={`flex p-1 rounded-xl mb-5 ${isDark ? 'bg-[#111]' : 'bg-gray-100'}`}>
                {['boleta', 'factura'].map(t => (
                  <button key={t} onClick={() => { setTipo(t); setError(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${tipo === t ? 'text-white' : (isDark ? 'text-neutral-500' : 'text-gray-500')}`}
                    style={tipo === t ? { backgroundColor: colorPrimario } : {}}>
                    {t === 'boleta' ? 'Boleta' : 'Factura'}
                  </button>
                ))}
              </div>

              {tipo === 'factura' ? (
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-bold uppercase ${sub}`}>RUC</label>
                    <div className="flex gap-2 mt-1">
                      <input value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="20123456789" className={`flex-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
                      <button onClick={buscarRuc} disabled={buscando}
                        className={`px-4 rounded-xl font-bold ${isDark ? 'bg-[#1a1a1a] text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                        {buscando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase ${sub}`}>Razón social</label>
                    <input value={razonSocial} onChange={e => setRazon(e.target.value)}
                      placeholder="EMPRESA SAC" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase ${sub}`}>Dirección</label>
                    <input value={direccion} onChange={e => setDireccion(e.target.value)}
                      placeholder="Av. Ejemplo 123" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={`text-xs ${sub}`}>Boleta a consumidor final. El DNI es opcional (obligatorio si supera S/700).</p>
                  <div>
                    <label className={`text-xs font-bold uppercase ${sub}`}>DNI (opcional)</label>
                    <input value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="12345678" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
                  </div>
                  {dni && (
                    <div>
                      <label className={`text-xs font-bold uppercase ${sub}`}>Nombre (opcional)</label>
                      <input value={razonSocial} onChange={e => setRazon(e.target.value)}
                        placeholder="Nombre del cliente" className={`w-full mt-1 px-4 py-3 rounded-xl border font-bold outline-none ${inp}`} />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button onClick={emitir} disabled={emitiendo}
                className="mt-5 w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: colorPrimario }}>
                {emitiendo ? <><Loader2 size={18} className="animate-spin" /> Emitiendo…</> : 'Emitir a SUNAT'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
