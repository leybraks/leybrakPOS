import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/api';
import { TIPOS_PRESENTACION, FONDOS_PRESET, COLORES_ACENTO } from './constantes';
import { Seccion } from './componentesUI';
import VistaPrevia from './VistaPrevia';
import Notificacion from '../../../components/common/Notificacion';
// ── Helpers ──
const getCartaConfig  = () => api.get('/negocios/carta_config/');
const saveCartaConfig = (config) => api.patch('/negocios/carta_config/', { carta_config: config });
const subirImagenCarta = (tipo, file) => {
  const form = new FormData();
  form.append('tipo', tipo);
  form.append('imagen', file);
  return api.post('/negocios/subir_imagen_carta/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
const subirFotoProducto = (id, file) => {
  const form = new FormData();
  form.append('imagen', file);
  return api.post(`/productos/${id}/subir_imagen/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
// Genera un preview mejorado (no guarda todavía). modo: 'realce' | 'ia'
const mejorarFotoProducto = (id, modo) =>
  api.post(`/productos/${id}/mejorar_imagen/`, { modo });
// Guarda definitivamente el preview (base64) como la foto del producto
const aplicarFotoProducto = (id, imagen_base64) =>
  api.post(`/productos/${id}/aplicar_imagen/`, { imagen_base64 });

export default function VistaEditor({ esDueño, colorPrimario, isDark }) {
  const cardCls  = isDark ? 'bg-[#141414] border-[#222]' : 'bg-white border-gray-200 shadow-sm';
  const inputCls = isDark ? 'bg-[#1a1a1a] border-[#333] text-white outline-none' : 'bg-gray-50 border-gray-200 text-gray-900 outline-none';
  const labelCls = isDark ? 'text-neutral-500' : 'text-gray-500';
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'success' });  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState('modelo');
  const [productos, setProductos] = useState([]);
  
  const [carta, setCarta] = useState({
    nombreNegocio: localStorage.getItem('negocio_nombre') || 'Mi Restaurante',
    tipoPresentacion: 'lista',
    slogan: '',
    logoUrl: '',
    colorPrimario: colorPrimario, 
    colorFondo: 'negro',
  });

  const logoRef = useRef(null);
  const fotoRef = useRef(null);
  const [productoEditandoId, setProductoEditandoId] = useState(null);

  // Estado del modal "Mejorar con IA"
  // { producto, preview, modo, cargando, guardando }
  const [mejora, setMejora] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resConfig = await getCartaConfig();
        if (resConfig.data?.carta_config) {
          setCarta(prev => ({ ...prev, ...resConfig.data.carta_config }));
        }

        // Recuperar ID del negocio para filtrar los platos correctamente
        const negocioId = localStorage.getItem('negocio_id'); 
        const urlProds = negocioId ? `/productos/?negocio_id=${negocioId}` : `/productos/`;
        const resProds = await api.get(urlProds);
        
        // Manejar estructura de paginación si existe
        const listaProds = resProds.data?.results || resProds.data || [];
        setProductos(Array.isArray(listaProds) ? listaProds : []);

      } catch (err) {
        console.error('Error cargando editor:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const setCampo = (c, v) => setCarta(p => ({ ...p, [c]: v }));

  const onGuardar = async () => {
  setGuardando(true);
  try {
    await saveCartaConfig(carta); // Llama al endpoint PATCH /negocios/carta_config/[cite: 4]
    
    // Mostramos feedback visual en lugar de alert()
    setNotificacion({
      mostrar: true,
      mensaje: '¡Configuración guardada correctamente!',
      tipo: 'success'
    });
  } catch (error) {
    setNotificacion({
      mostrar: true,
      mensaje: 'Error al guardar los cambios',
      tipo: 'error'
    });
  } finally {
    setGuardando(false);
  }
};

  const onUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCampo('logoUrl', URL.createObjectURL(file)); // Preview rápida
    const res = await subirImagenCarta('logo', file);
    setCampo('logoUrl', res.data.url);
  };

  const onUploadFotoProducto = async (e) => {
    const file = e.target.files[0];
    if (!file || !productoEditandoId) return;
    
    setProductos(prev => prev.map(p => p.id === productoEditandoId ? { ...p, imagen: URL.createObjectURL(file) } : p));
    try {
      const res = await subirFotoProducto(productoEditandoId, file);
      setProductos(prev => prev.map(p => p.id === productoEditandoId ? { ...p, imagen: res.data.url } : p));
    } catch (err) { console.error('Error subiendo foto:', err); }
  };

  // ── Mejorar con IA ──
  const abrirMejora = (producto) => setMejora({ producto, preview: null, modo: null, cargando: false, guardando: false });
  const cerrarMejora = () => setMejora(null);

  const generarMejora = async (modo) => {
    if (!mejora) return;
    setMejora(m => ({ ...m, modo, cargando: true, preview: null }));
    try {
      const res = await mejorarFotoProducto(mejora.producto.id, modo);
      setMejora(m => ({ ...m, cargando: false, preview: res.data.preview }));
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo generar la mejora.';
      setMejora(m => ({ ...m, cargando: false }));
      setNotificacion({ mostrar: true, mensaje: msg, tipo: 'error' });
    }
  };

  const aplicarMejora = async () => {
    if (!mejora?.preview) return;
    setMejora(m => ({ ...m, guardando: true }));
    try {
      const res = await aplicarFotoProducto(mejora.producto.id, mejora.preview);
      const nuevaUrl = `${res.data.url}?t=${Date.now()}`; // cache-bust
      setProductos(prev => prev.map(p => p.id === mejora.producto.id ? { ...p, imagen: nuevaUrl } : p));
      setNotificacion({ mostrar: true, mensaje: '¡Foto mejorada y guardada!', tipo: 'success' });
      cerrarMejora();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo guardar la foto.';
      setMejora(m => ({ ...m, guardando: false }));
      setNotificacion({ mostrar: true, mensaje: msg, tipo: 'error' });
    }
  };

  if (!esDueño) return <div className="text-center p-10">Solo el dueño puede editar la carta.</div>;
  if (cargando) return <div className="text-center p-10">Cargando...</div>;


  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      {notificacion.mostrar && (
      <Notificacion 
        mensaje={notificacion.mensaje} 
        tipo={notificacion.tipo} 
        onClose={() => setNotificacion({ ...notificacion, mostrar: false })} 
        />
      )}
      {/* ── PANEL IZQUIERDO (EDITOR - SIEMPRE USA colorPrimario DEL SISTEMA) ── */}
      <div className="flex-1 w-full min-w-0 space-y-4">
        {/* Cabecera Guardar */}
        <div className={`flex justify-between items-center p-4 rounded-2xl border ${cardCls}`}>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Configurar Carta</h2>
          <button 
            onClick={onGuardar} disabled={guardando}
            className="px-6 py-2.5 rounded-xl text-white font-bold transition-all text-sm"
            style={{ backgroundColor: colorPrimario, opacity: guardando ? 0.7 : 1 }}
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Pestañas */}
        <div className={`flex gap-2 p-1.5 rounded-2xl border ${cardCls} overflow-x-auto`}>
          {[
            { id: 'modelo', icon: 'fi-rr-layout-fluid', label: 'Modelo' },
            { id: 'identidad', icon: 'fi-rr-id-badge', label: 'Marca' },
            { id: 'colores', icon: 'fi-rr-palette', label: 'Colores' },
            { id: 'fotos', icon: 'fi-rr-camera', label: 'Fotos Platos' },
          ].map(t => (
            <button
              key={t.id} onClick={() => setPestana(t.id)}
              className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${pestana === t.id ? 'text-white' : labelCls}`}
              style={{ backgroundColor: pestana === t.id ? colorPrimario : 'transparent' }}
            >
              <i className={`fi ${t.icon} mr-2`} />{t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className={`p-6 rounded-3xl border ${cardCls}`}>
          
          {pestana === 'modelo' && (
            <Seccion titulo="Selecciona el Diseño de tu Carta">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TIPOS_PRESENTACION.map(tp => (
                  <button
                    key={tp.id} onClick={() => setCampo('tipoPresentacion', tp.id)}
                    className="p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden"
                    style={{ borderColor: carta.tipoPresentacion === tp.id ? colorPrimario : (isDark ? '#333' : '#e5e7eb') }}
                  >
                    {carta.tipoPresentacion === tp.id && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: colorPrimario }} />}
                    <i className={`fi ${tp.icon} text-2xl mb-2 block`} style={{ color: carta.tipoPresentacion === tp.id ? colorPrimario : '#888' }} />
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tp.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{tp.desc}</p>
                  </button>
                ))}
              </div>
            </Seccion>
          )}

          {pestana === 'identidad' && (
            <div className="space-y-6">
              <Seccion titulo="Slogan / Mensaje de Bienvenida">
                <input 
                  value={carta.slogan || ''} onChange={e => setCampo('slogan', e.target.value)} 
                  placeholder="Ej: El mejor sabor de la ciudad..." 
                  className={`w-full p-4 rounded-xl border ${inputCls}`} 
                />
              </Seccion>
              <Seccion titulo="Logo del Negocio">
                <div className="flex gap-4 items-center">
                  <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden ${isDark ? 'border-[#444] bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`}>
                    {carta.logoUrl ? <img src={carta.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <i className="fi fi-rr-picture text-2xl text-gray-400" />}
                  </div>
                  <button onClick={() => logoRef.current.click()} className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all" style={{ borderColor: colorPrimario, color: colorPrimario }}>
                    Subir Imagen
                  </button>
                  <input ref={logoRef} type="file" hidden accept="image/*" onChange={onUploadLogo} />
                </div>
              </Seccion>
            </div>
          )}

          {pestana === 'colores' && (
            <div className="space-y-8">
              <Seccion titulo="Color Principal de la Carta (Detalles y Precios)">
                <div className="flex flex-wrap gap-3">
                  {COLORES_ACENTO.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setCampo('colorPrimario', c)} 
                      className="w-10 h-10 rounded-full transition-all" 
                      style={{ 
                        backgroundColor: c, 
                        transform: carta.colorPrimario === c ? 'scale(1.2)' : 'scale(1)', 
                        border: carta.colorPrimario === c ? `3px solid ${isDark ? '#fff' : '#000'}` : 'none' 
                      }} 
                    />
                  ))}
                </div>
              </Seccion>
              <Seccion titulo="Fondo de la Carta">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {FONDOS_PRESET.map(f => (
                    <button key={f.id} onClick={() => setCampo('colorFondo', f.id)} className="flex flex-col items-center gap-2">
                      <div className="w-full h-12 rounded-xl border-2 transition-all" style={{ backgroundColor: f.color || '#000', borderColor: carta.colorFondo === f.id ? colorPrimario : 'transparent' }} />
                      <span className={`text-[10px] font-bold uppercase ${labelCls}`}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </Seccion>
            </div>
          )}

          {pestana === 'fotos' && (
            <Seccion titulo="Imágenes de tus Platos">
              {productos.length === 0 ? (
                <div className="text-center p-10 bg-black/10 rounded-2xl border border-dashed border-gray-600">
                  <p className={labelCls}>No hemos encontrado productos. Asegúrate de haberlos creado primero en la sección de Menú.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productos.map(plato => (
                    <div key={plato.id} className={`p-2 border rounded-2xl flex flex-col gap-2 ${isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="w-full aspect-square rounded-xl bg-black/20 overflow-hidden flex items-center justify-center relative">
                        {plato.imagen 
                          ? <img src={plato.imagen} className="w-full h-full object-cover" alt={plato.nombre} />
                          : <i className="fi fi-rr-room-service text-3xl opacity-20" />
                        }
                      </div>
                      <p className={`text-xs font-bold text-center line-clamp-1 px-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plato.nombre}</p>
                      <button
                        onClick={() => { setProductoEditandoId(plato.id); fotoRef.current.click(); }}
                        className="w-full py-1.5 text-xs font-bold rounded-lg border transition-all"
                        style={{ borderColor: colorPrimario, color: colorPrimario }}
                      >
                        {plato.imagen ? 'Cambiar Foto' : 'Subir Foto'}
                      </button>
                      {plato.imagen && (
                        <button
                          onClick={() => abrirMejora(plato)}
                          className="w-full py-1.5 text-xs font-bold rounded-lg text-white transition-all flex items-center justify-center gap-1.5"
                          style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
                        >
                          <i className="fi fi-rr-magic-wand" />Mejorar con IA
                        </button>
                      )}
                    </div>
                  ))}
                  <input ref={fotoRef} type="file" hidden accept="image/*" onChange={onUploadFotoProducto} />
                </div>
              )}
            </Seccion>
          )}

        </div>
      </div>

      {/* ── PANEL DERECHO (VISTA PREVIA) ── */}
      <VistaPrevia
      carta={carta}
      colorPrimario={colorPrimario}
      isDark={isDark}
      productos={productos}
      />

      {/* ── MODAL: MEJORAR CON IA ── */}
      {mejora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={cerrarMejora}>
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 ${isDark ? 'bg-[#141414] border-[#222]' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fi fi-rr-magic-wand mr-2" style={{ color: '#a855f7' }} />Mejorar foto con IA
              </h3>
              <button onClick={cerrarMejora} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-gray-500 mb-4 line-clamp-1">{mejora.producto.nombre}</p>

            {/* Comparación Antes / Después */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelCls}`}>Original</p>
                <div className="aspect-square rounded-2xl overflow-hidden bg-black/20">
                  <img src={mejora.producto.imagen} className="w-full h-full object-cover" alt="original" />
                </div>
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelCls}`}>Mejorada</p>
                <div className="aspect-square rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center">
                  {mejora.cargando
                    ? <div className="flex flex-col items-center gap-2 text-gray-400"><i className="fi fi-rr-spinner animate-spin text-2xl" /><span className="text-xs">Mejorando…</span></div>
                    : mejora.preview
                      ? <img src={mejora.preview} className="w-full h-full object-cover" alt="mejorada" />
                      : <span className="text-xs text-gray-500 px-4 text-center">Elige un modo para generar la versión mejorada</span>
                  }
                </div>
              </div>
            </div>

            {/* Selector de modo */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => generarMejora('realce')}
                disabled={mejora.cargando || mejora.guardando}
                className={`p-3 rounded-2xl border-2 text-left transition-all disabled:opacity-50 ${mejora.modo === 'realce' ? '' : (isDark ? 'border-[#333]' : 'border-gray-200')}`}
                style={{ borderColor: mejora.modo === 'realce' ? '#a855f7' : undefined }}
              >
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>✨ Realce automático</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Ajusta luz, color y nitidez. Rápido y gratis.</p>
              </button>
              <button
                onClick={() => generarMejora('ia')}
                disabled={mejora.cargando || mejora.guardando}
                className={`p-3 rounded-2xl border-2 text-left transition-all disabled:opacity-50 ${mejora.modo === 'ia' ? '' : (isDark ? 'border-[#333]' : 'border-gray-200')}`}
                style={{ borderColor: mejora.modo === 'ia' ? '#ec4899' : undefined }}
              >
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>🤖 Generativa (IA)</p>
                <p className="text-[11px] text-gray-500 mt-0.5">La IA reilumina la foto tipo estudio.</p>
              </button>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <button
                onClick={cerrarMejora}
                disabled={mejora.guardando}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${isDark ? 'border-[#333] text-gray-300' : 'border-gray-200 text-gray-600'}`}
              >
                Cancelar
              </button>
              <button
                onClick={aplicarMejora}
                disabled={!mejora.preview || mejora.cargando || mejora.guardando}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
              >
                {mejora.guardando ? 'Guardando…' : 'Usar esta foto'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
