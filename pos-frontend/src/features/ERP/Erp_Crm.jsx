import React, { useState, useEffect } from 'react';
import { Percent, BadgeDollarSign, ShoppingBag, X } from 'lucide-react';
import Crm_CombosPromociones from './CRM/Crm_CombosPomociones';
import Crm_Cumpleanos from './CRM/Crm_Cumpleaños'; // Ajusta la ruta si es necesario
import Crm_Puntos from './CRM/Crm_Puntos';
import api from '../../api/api'; // Asegúrate de tener tu instancia de Axios configurada
export default function Erp_Crm({ config, sedesReales = [], productosReales = [], categoriasReales = [] }) {
  const isDark = config.temaFondo === 'dark';
  const colorPrimario = config.colorPrimario || '#ff5a1f';

  // Control de pestañas dentro del CRM
  const [tabActiva, setTabActiva] = useState('clientes');
  
  // Selector de Sede para configurar la promo
  const [sedeActivaId, setSedeActivaId] = useState(sedesReales[0]?.id || '');

  // 📒 Base de Datos (CRM) — clientes reales del negocio
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await api.get('/clientes/');
        if (!activo) return;
        const lista = res.data?.results || res.data || [];
        setClientes(Array.isArray(lista) ? lista : []);
      } catch (e) {
        console.error('Error cargando clientes:', e);
      } finally {
        if (activo) setCargandoClientes(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  const tiempoRelativo = (fecha) => {
    if (!fecha) return 'Nunca';
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
    if (dias <= 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  };

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (c.telefono || '').toLowerCase().includes(q) ||
           (c.nombre || '').toLowerCase().includes(q);
  });

  const abrirChat = (telefono) => {
    const num = (telefono || '').replace(/\D/g, '');
    if (!num) return;
    const conPais = num.length === 9 ? `51${num}` : num;
    window.open(`https://wa.me/${conPais}`, '_blank');
  };

  // Estado para el Motor Cumpleañero (Cargado de la sede activa)
  const sedeActual = sedesReales.find(s => String(s.id) === String(sedeActivaId)) || {};
  const [promoCumple, setPromoCumple] = useState({
    activo: sedeActual.bot_cumple_activo || false,
    tipo: sedeActual.bot_cumple_tipo || 'porcentaje',
    valor: sedeActual.bot_cumple_valor || '',
    minimo: sedeActual.bot_cumple_minimo || '',
    productos: sedeActual.bot_cumple_productos || []
  });

  // Funciones del armador de combos (Recicladas de tu Bot_Fidelizacion)
  const manejarAgregarProducto = (e) => {
    const prodId = e.target.value;
    if (!prodId || promoCumple.productos.includes(prodId)) return;
    setPromoCumple({ ...promoCumple, productos: [...promoCumple.productos, prodId] });
    e.target.value = '';
  };
  const manejarQuitarProducto = (prodId) => {
    setPromoCumple({ ...promoCumple, productos: promoCumple.productos.filter(id => id !== prodId) });
  };

  const nombresProductosCombo = promoCumple.productos
    .map(id => productosReales.find(p => String(p.id) === String(id))?.nombre)
    .filter(Boolean).join(" + ");

  const guardarPromocionCumple = async () => {
    try {
      // Reemplaza 'api' por el nombre de tu cliente axios si es distinto
      await api.patch(`/api/sedes/${sedeActivaId}/`, {
        bot_cumple_activo: promoCumple.activo,
        bot_cumple_tipo: promoCumple.tipo,
        bot_cumple_valor: promoCumple.valor || null,
        bot_cumple_minimo: promoCumple.minimo || null,
        bot_cumple_productos: promoCumple.productos // Tu backend ya acepta IDs en array gracias al M2M
      });
      
      alert("¡Reglas de cumpleaños guardadas con éxito! 🎂");
      
    } catch (error) {
      console.error("Error al guardar cumpleaños:", error);
      alert("Ups, hubo un error al guardar las reglas.");
    }
  };
  

  return (
    <div className="animate-fadeIn space-y-6 flex flex-col w-full min-w-0 pb-20">
      
      {/* 🧭 NAVEGACIÓN DEL CRM */}
      <div className={`flex gap-8 border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>
        {[
          { id: 'clientes', label: 'Base de Datos (CRM)' },
          { id: 'puntos', label: 'Puntos y Canje' },
          { id: 'cumpleanos', label: 'Motor de Cumpleaños' },
          { id: 'promociones', label: 'Combos y Promociones' },
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setTabActiva(tab.id)}
            className="pb-4 text-sm font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap"
            style={tabActiva === tab.id 
              ? { color: colorPrimario, borderBottomColor: colorPrimario } 
              : { color: isDark ? '#737373' : '#9ca3af', borderColor: 'transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* 👥 PESTAÑA 1: BASE DE DATOS (Tu código original) */}
      {/* ========================================== */}
      {tabActiva === 'clientes' && (
        <>
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center text-center md:text-left shadow-xl w-full gap-4">
            <div className="w-full min-w-0">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-1">Generador de Campañas</h3>
              <p className="text-green-100 text-sm">
                Tienes <strong className="text-white">{cargandoClientes ? '…' : clientes.length}</strong> {clientes.length === 1 ? 'cliente' : 'clientes'}. Lanza una promoción por WhatsApp.
              </p>
            </div>
            <button className="w-full md:w-auto bg-white text-green-600 px-6 py-3 rounded-xl font-black shadow-lg shrink-0 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">
              <span className="text-xl">📱</span> ENVIAR PROMO
            </button>
          </div>

          <div className={`rounded-3xl flex flex-col w-full min-w-0 relative overflow-hidden border ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row justify-between gap-3 ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>
              <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Directorio</h4>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o número..."
                className={`w-full sm:w-64 px-4 py-2 rounded-lg outline-none focus:ring-2 text-sm ${isDark ? 'bg-[#1a1a1a] border-[#333] text-white focus:ring-[#ff5a1f]' : 'bg-gray-100 border-gray-300 text-gray-800 focus:ring-[#ff5a1f]'}`}
              />
            </div>

            <div className="w-full overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                <thead className={`text-[10px] uppercase tracking-widest ${isDark ? 'bg-[#1a1a1a] text-neutral-500' : 'bg-gray-100 text-gray-500'}`}>
                  <tr>
                    <th className="px-5 py-4 font-black">Cliente</th>
                    <th className="px-5 py-4 font-black">WhatsApp</th>
                    <th className="px-5 py-4 font-black text-center">Visitas</th>
                    <th className="px-5 py-4 font-black text-center">Puntos</th>
                    <th className="px-5 py-4 font-black">Última Visita</th>
                    <th className="px-5 py-4 font-black text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'text-neutral-300 divide-[#222]' : 'text-gray-700 divide-gray-200'}`}>
                  {cargandoClientes ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm opacity-60">Cargando clientes…</td></tr>
                  ) : clientesFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm opacity-60">
                      {clientes.length === 0 ? 'Aún no hay clientes registrados. Se crean al cobrar con un número de WhatsApp.' : 'Sin resultados para tu búsqueda.'}
                    </td></tr>
                  ) : (
                    clientesFiltrados.map((c) => {
                      const nombre = c.nombre || 'Cliente';
                      const dias = c.ultima_compra ? Math.floor((Date.now() - new Date(c.ultima_compra).getTime()) / 86400000) : null;
                      const inactivo = dias !== null && dias >= 30;
                      return (
                        <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-50'}`}>
                          <td className="px-5 py-4 font-bold flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? 'bg-[#222] text-[#ff5a1f]' : 'bg-gray-200 text-gray-700'}`}>{nombre.charAt(0).toUpperCase()}</div>
                            <span className={isDark ? 'text-white' : 'text-gray-800'}>{nombre}</span>
                            {Array.isArray(c.tags) && c.tags.includes('VIP') && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">VIP</span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono">{c.telefono || '—'}</td>
                          <td className="px-5 py-4 font-bold text-green-500 text-center">{c.cantidad_pedidos ?? 0}</td>
                          <td className="px-5 py-4 font-bold text-center">{c.puntos_acumulados ?? 0}</td>
                          <td className="px-5 py-4 text-xs"><span className={inactivo ? 'text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded' : ''}>{tiempoRelativo(c.ultima_compra)}</span></td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => abrirChat(c.telefono)} className="px-4 py-2 rounded-lg font-bold text-xs transition-colors bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white">Chat</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 🎂 PESTAÑA 2: MOTOR CUMPLEAÑERO GLOBAL */}
      {/* ========================================== */}
      {tabActiva === 'puntos' && (
        <Crm_Puntos isDark={isDark} colorPrimario={colorPrimario} />
      )}
      {tabActiva === 'cumpleanos' && (
        <Crm_Cumpleanos
          isDark={isDark}
          colorPrimario={colorPrimario}
          sedeActivaId={sedeActivaId}
          setSedeActivaId={setSedeActivaId}
          sedesReales={sedesReales}
          productosReales={productosReales}
          promoCumple={promoCumple}
          setPromoCumple={setPromoCumple}
          guardarPromocionCumple={guardarPromocionCumple}
        />
      )}
      {/* ========================================== */}
      {/* 🚀 PESTAÑA 3: MOTOR DE PROMOCIONES GLOBAL */}
      {/* ========================================== */}
      {tabActiva === 'promociones' && (
        <div className="w-full">
          <Crm_CombosPromociones 
            config={config} 
            productosReales={productosReales} 
            categoriasReales={categoriasReales}
            sedesReales={sedesReales} 
          />
        </div>
      )}

    </div>
  );
}