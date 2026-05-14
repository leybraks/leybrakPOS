import React, { useState, useEffect } from 'react';
import { loginAdministrador, loginPinEmpleado, getEstadoCaja, abrirCajaBD, getSedes } from '../api/api';
import { useToast } from '../context/ToastContext';

export default function LoginView({ onAccesoConcedido }) {
  const toast = useToast();

  const tabletConfigurada = localStorage.getItem('tablet_token') && localStorage.getItem('sede_id');
  const [modo, setModo] = useState(tabletConfigurada ? 'empleado' : 'inicio');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [pin, setPin] = useState('');
  const [horaLocal, setHoraLocal] = useState('');
  const [estadoLocal, setEstadoLocal] = useState('cargando...');
  const [modalApertura, setModalApertura] = useState(false);
  const [fondoCaja, setFondoCaja] = useState('');
  const [empleadoActual, setEmpleadoActual] = useState(null);

  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const MAX_INTENTOS = 3;
  const BLOQUEO_MS = 2 * 60 * 1000;

  const estaBlockeado = bloqueadoHasta && Date.now() < bloqueadoHasta;
  const segundosBloqueo = bloqueadoHasta ? Math.ceil((bloqueadoHasta - Date.now()) / 1000) : 0;

  const negocioInfo = {
    marca: 'CAÑA BRAVA',
    sede: localStorage.getItem('sede_nombre') || 'Sede Principal',
  };

  useEffect(() => {
    if (modo !== 'empleado') return;
    const verificarCaja = async () => {
      try {
        const res = await getEstadoCaja();
        setEstadoLocal(res.data.estado);
      } catch { console.error('Conectando...'); }
    };
    verificarCaja();
    const intervaloCaja = setInterval(verificarCaja, 5000);
    const timer = setInterval(() => {
      setHoraLocal(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => { clearInterval(intervaloCaja); clearInterval(timer); };
  }, [modo]);

  const handleLoginSubmit = async (e, destino) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const res = await loginAdministrador({ username: email, password });
      localStorage.setItem('negocio_id', res.data.negocio_id);
      if (destino === 'erp') {
        const rolSeguro = res.data.rol || 'Dueño';
        localStorage.setItem('usuario_rol', rolSeguro);
        onAccesoConcedido(rolSeguro);
      } else {
        localStorage.removeItem('empleado_id');
        const sedesRes = await getSedes();
        setSedesDisponibles(sedesRes.data);
        if (sedesRes.data.length > 0) setSedeSeleccionada(sedesRes.data[0].id);
        setModo('setup_sede');
      }
    } catch {
      toast.error('Credenciales incorrectas. Verifica usuario y contraseña.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleLogin = () => toast.info('Google Sign-In estará disponible próximamente.');

  const handleSedeSetup = (e) => {
    e.preventDefault();
    const sedeObj = sedesDisponibles.find(s => s.id.toString() === sedeSeleccionada.toString());
    if (sedeObj) {
      localStorage.setItem('sede_id', sedeObj.id);
      localStorage.setItem('sede_nombre', sedeObj.nombre);
      localStorage.removeItem('modo_dispositivo');
      setModo('empleado');
    }
  };

  const presionarTecla = (num) => { if (pin.length < 4) setPin(pin + num); };
  const borrarTecla = () => { setPin(pin.slice(0, -1)); };

  const procesarPin = async (accion) => {
    if (pin.length !== 4) return;
    if (estaBlockeado) { toast.error(`Terminal bloqueada. Intenta en ${segundosBloqueo}s.`); return; }
    try {
      const respuesta = await loginPinEmpleado({ pin, sede_id: localStorage.getItem('sede_id'), accion });
      const empleado = respuesta.data;
      setIntentosFallidos(0);
      setBloqueadoHasta(null);
      localStorage.setItem('empleado_nombre', empleado.nombre);
      localStorage.setItem('usuario_rol', empleado.rol);

      if (accion === 'asistencia') {
        toast.success(`Asistencia registrada — ${empleado.nombre}`);
        setPin('');
        return;
      }

      if (accion === 'entrar') {
        const rolLimpio = empleado.rol.toLowerCase();
        if (rolLimpio === 'cocinero' || rolLimpio === 'cocina') {
          onAccesoConcedido(empleado);
          return;
        }
        if (estadoLocal === 'cerrado') {
          if (['administrador', 'cajero', 'admin'].includes(rolLimpio)) {
            setEmpleadoActual(empleado);
            setModalApertura(true);
          } else {
            toast.warning('La caja está cerrada. Contacta al administrador.');
            setPin('');
          }
        } else {
          onAccesoConcedido(empleado);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'PIN incorrecto.';
      const restantes = error.response?.data?.segundos_restantes;
      if (error.response?.status === 429) {
        toast.error(msg);
        if (restantes) setBloqueadoHasta(Date.now() + restantes * 1000);
      } else {
        const nuevos = intentosFallidos + 1;
        setIntentosFallidos(nuevos);
        if (nuevos >= MAX_INTENTOS) {
          setBloqueadoHasta(Date.now() + BLOQUEO_MS);
          toast.error('Demasiados intentos. Terminal bloqueada 2 minutos.');
        } else {
          toast.error(`PIN incorrecto. Intento ${nuevos}/${MAX_INTENTOS}.`);
        }
      }
      setPin('');
    }
  };

  const abrirLocal = async () => {
    if (fondoCaja === '') { toast.warning('Ingresa el fondo inicial de caja.'); return; }
    try {
      const respuesta = await abrirCajaBD({ empleado_id: empleadoActual.id, fondo_inicial: parseFloat(fondoCaja) });
      localStorage.setItem('sesion_caja_id', respuesta.data.id);
      setEstadoLocal('abierto');
      setModalApertura(false);
      onAccesoConcedido(empleadoActual.rol_nombre);
    } catch {
      toast.error('No se pudo abrir la caja. Verifica la conexión.');
    }
  };

  // ─────────────────────────────────────────
  // VISTA: TERMINAL PIN (pantalla completa)
  // ─────────────────────────────────────────
  if (modo === 'empleado') {
    return (
      <div className="min-h-screen font-sans flex flex-col items-center justify-center bg-[#050505] text-white select-none px-4">
        <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center animate-fadeIn">

          {/* Header */}
          <div className="text-center mb-8 w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-3 bg-[#111] border border-[#222] px-5 py-2 rounded-full mb-6">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${estadoLocal === 'abierto' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-[11px] font-black text-neutral-300 tracking-widest uppercase">
                {estadoLocal === 'abierto' ? 'Sede Operativa' : 'Caja Cerrada'}
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-1">{negocioInfo.marca}</h1>
            <p className="text-[#ff5a1f] font-black tracking-[0.2em] text-[10px] uppercase">{negocioInfo.sede}</p>
            <p className="text-neutral-600 font-mono text-lg mt-6">{horaLocal || '--:--'}</p>
          </div>

          {/* Indicadores PIN */}
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${
                estaBlockeado
                  ? 'bg-red-500/40 border border-red-500/60'
                  : pin.length > i
                    ? 'bg-white scale-125'
                    : 'bg-[#1a1a1a] border border-[#333]'
              }`} />
            ))}
          </div>

          {estaBlockeado && (
            <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-4 animate-pulse">
              🔒 Bloqueado — {segundosBloqueo}s
            </p>
          )}
          {!estaBlockeado && intentosFallidos > 0 && (
            <p className="text-orange-400 text-xs font-bold mb-4">
              {MAX_INTENTOS - intentosFallidos} intento{MAX_INTENTOS - intentosFallidos !== 1 ? 's' : ''} restante{MAX_INTENTOS - intentosFallidos !== 1 ? 's' : ''}
            </p>
          )}

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => presionarTecla(num.toString())}
                className="h-16 sm:h-20 bg-[#0f0f0f] border border-[#222] hover:bg-[#1a1a1a] active:scale-95 text-white text-3xl font-bold rounded-2xl transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            {/* Borrar */}
            <button
              onClick={borrarTecla}
              className="h-16 sm:h-20 bg-[#0f0f0f] border border-[#222] hover:bg-red-500/10 active:scale-95 text-neutral-400 hover:text-white rounded-2xl transition-all flex items-center justify-center"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
            {/* 0 */}
            <button
              onClick={() => presionarTecla('0')}
              className="h-16 sm:h-20 bg-[#0f0f0f] border border-[#222] hover:bg-[#1a1a1a] active:scale-95 text-white text-3xl font-bold rounded-2xl transition-all flex items-center justify-center"
            >
              0
            </button>
            {/* Limpiar */}
            <button
              onClick={() => setPin('')}
              className="h-16 sm:h-20 bg-[#0f0f0f] border border-[#222] hover:bg-neutral-800 active:scale-95 text-[#ff5a1f] text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center"
            >
              Limpiar
            </button>
          </div>

          {/* Botón ingresar */}
          <button
            onClick={() => procesarPin('entrar')}
            disabled={estaBlockeado}
            className="w-full mt-8 bg-gradient-to-r from-[#ff5a1f] to-[#e0155b] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black text-base tracking-widest active:scale-95 transition-all uppercase"
          >
            {estaBlockeado ? `Bloqueado ${segundosBloqueo}s` : 'Ingresar 🚀'}
          </button>
        </div>

        {/* Modal apertura de caja */}
        {modalApertura && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
            <div className="bg-[#0f0f0f] border border-[#222] rounded-3xl w-full max-w-sm text-center p-8 mb-safe">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Apertura de Caja</h3>
              <div className="flex items-center justify-center bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 mb-8">
                <span className="text-neutral-600 text-3xl font-light mr-3">S/</span>
                <input
                  type="number"
                  value={fondoCaja}
                  onChange={e => setFondoCaja(e.target.value)}
                  className="bg-transparent w-32 text-white text-5xl font-black focus:outline-none text-center"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <button onClick={abrirLocal} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black tracking-widest uppercase transition-colors">
                Iniciar Turno
              </button>
              <button onClick={() => { setModalApertura(false); setPin(''); }} className="w-full text-neutral-600 text-xs font-bold mt-6 uppercase tracking-widest">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────
  // VISTA: SPLIT SCREEN (Lobby / Login / Setup)
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex text-white font-sans overflow-hidden bg-[#050505]">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 flex flex-col justify-center px-5 sm:px-10 lg:px-12 relative z-40 bg-[#0c0c0c] min-h-screen lg:shadow-[20px_0_50px_rgba(0,0,0,0.5)]">

        {/* Logo */}
        <div className="absolute top-6 left-5 sm:left-10 lg:left-12 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff5a1f] to-[#e0155b]" />
          <span className="font-black text-lg tracking-tighter">BRAVA<span className="text-[#ff5a1f]">POS</span></span>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 lg:mt-0 pb-16 animate-fadeIn">

          {/* ── LOBBY ── */}
          {modo === 'inicio' && (
            <>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Bienvenido</h1>
              <p className="text-neutral-500 text-sm mb-8">Selecciona tu área de trabajo para continuar.</p>
              <div className="space-y-3">
                <button
                  onClick={() => setModo('login_erp')}
                  className="w-full bg-transparent border border-[#2a2a2a] hover:border-[#ff5a1f]/40 hover:bg-[#ff5a1f]/[0.03] p-5 rounded-2xl flex items-center gap-5 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-[#161616] rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">💻</div>
                  <div>
                    <div className="font-bold text-[15px]">Panel de Control</div>
                    <div className="text-neutral-500 text-xs mt-0.5">Gestionar menú, ventas y configuraciones.</div>
                  </div>
                </button>
                <button
                  onClick={() => setModo('login_pos')}
                  className="w-full bg-transparent border border-[#2a2a2a] hover:border-[#ff5a1f]/40 hover:bg-[#ff5a1f]/[0.03] p-5 rounded-2xl flex items-center gap-5 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-[#161616] rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">📱</div>
                  <div>
                    <div className="font-bold text-[15px]">Terminal POS</div>
                    <div className="text-neutral-500 text-xs mt-0.5">Vincular esta pantalla como punto de caja.</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── LOGIN ── */}
          {(modo === 'login_erp' || modo === 'login_pos') && (
            <div className="animate-slideUp">
              <button
                onClick={() => setModo('inicio')}
                className="text-neutral-500 hover:text-white text-xs font-bold mb-7 flex items-center gap-2 transition-colors"
              >
                ← Regresar
              </button>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Accede a tu Cuenta</h1>
              <p className="text-neutral-500 text-sm mb-8">
                {modo === 'login_erp' ? 'Ingresa para administrar tu negocio.' : 'Ingresa para vincular este dispositivo.'}
              </p>

              <div className="flex gap-3 mb-7">
                <button
                  onClick={handleGoogleLogin}
                  className="flex-1 bg-transparent border border-[#2a2a2a] hover:bg-[#161616] py-3 rounded-xl flex items-center justify-center gap-2.5 transition-colors text-sm font-bold"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => toast.info('Apple Login estará disponible próximamente.')}
                  className="flex-1 bg-transparent border border-[#2a2a2a] hover:bg-[#161616] py-3 rounded-xl flex items-center justify-center gap-2.5 transition-colors text-sm font-bold"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.81-.98 0-1.42-.58-2.58-.58-1.14 0-1.63.56-2.56.59-1.05.03-2.27-.96-3.18-2.27-1.34-1.9-2.29-5.18-1.42-7.58.42-1.15 1.18-2.03 2.12-2.6.93-.57 1.98-.6 2.97-.6.94 0 1.8.46 2.51.87.69.41 1.05.65 1.58.65.57 0 1.05-.27 1.84-.73 1.05-.62 2.21-.86 3.46-.66 1.34.22 2.37.84 3.03 1.75-2.48 1.48-2.06 4.96.38 5.92-.5 1.25-1.19 2.52-2.07 3.43zM14.98 5.7c-.52.64-1.26 1.08-2.06 1.13-.12-1.37.52-2.73 1.33-3.63.53-.61 1.33-1.09 2.16-1.16.14 1.39-.46 2.65-1.43 3.66z"/>
                  </svg>
                  Apple
                </button>
              </div>

              <div className="flex items-center gap-3 mb-7 opacity-30">
                <div className="h-px bg-neutral-500 flex-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 whitespace-nowrap">— or —</span>
                <div className="h-px bg-neutral-500 flex-1" />
              </div>

              <form onSubmit={e => handleLoginSubmit(e, modo === 'login_erp' ? 'erp' : 'pos')} className="space-y-3">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] p-4 rounded-xl text-white focus:outline-none focus:border-[#ff5a1f] transition-all text-sm"
                  placeholder="Nombre de usuario o correo"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] p-4 rounded-xl text-white focus:outline-none focus:border-[#ff5a1f] transition-all text-sm"
                  placeholder="Contraseña"
                />
                <div className="flex justify-between items-center text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-500 hover:text-white transition-colors">
                    <input type="checkbox" className="accent-[#ff5a1f]" /> Recordarme
                  </label>
                  <button type="button" className="text-neutral-500 hover:text-white transition-colors">¿Olvidaste tu contraseña?</button>
                </div>
                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full bg-gradient-to-r from-[#ff5a1f] to-[#e0155b] hover:opacity-90 text-white py-4 rounded-xl font-bold mt-4 transition-all disabled:opacity-50"
                >
                  {loadingAuth ? 'Iniciando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>
          )}

          {/* ── SETUP SEDE ── */}
          {modo === 'setup_sede' && (
            <div className="animate-slideUp text-center">
              <div className="w-16 h-16 bg-[#161616] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 border border-[#2a2a2a]">🏢</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-2">Asignar Local</h2>
              <p className="text-neutral-500 text-sm mb-8">¿En qué sucursal operará esta terminal?</p>
              <form onSubmit={handleSedeSetup}>
                <select
                  value={sedeSeleccionada}
                  onChange={e => setSedeSeleccionada(e.target.value)}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] p-4 rounded-xl text-white focus:outline-none focus:border-[#ff5a1f] appearance-none font-bold text-center cursor-pointer mb-6"
                >
                  {sedesDisponibles.map(sede => (
                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                  ))}
                </select>
                <button type="submit" className="w-full bg-gradient-to-r from-[#ff5a1f] to-[#e0155b] hover:opacity-90 text-white py-4 rounded-xl font-bold transition-all">
                  Vincular Terminal 🔒
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-5 sm:left-10 lg:left-12 right-5 flex justify-between text-[10px] text-neutral-700 font-bold uppercase tracking-widest">
          <span>Privacidad</span>
          <span>Copyright 2026</span>
        </div>
      </div>

      {/* ── PANEL DERECHO (hero visual) — solo lg+ ── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-[#050505]">

        {/* Glows */}
        <div className="absolute w-[600px] h-[600px] bg-[#ff5a1f] opacity-[0.10] rounded-full blur-[130px] top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-[#e0155b] opacity-[0.10] rounded-full blur-[110px] top-[55%] left-[55%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Device scene */}
        <div className="relative z-10 flex items-end justify-center">

          {/* Laptop */}
          <div className="relative mr-[-50px] mb-6 z-10">
            <div className="w-[380px] h-[240px] bg-[#111] rounded-t-2xl border-[3px] border-[#2a2a2a] overflow-hidden shadow-2xl">
              <div className="bg-[#0d0d0d] w-full h-full p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5a1f] opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                  </div>
                  <div className="w-28 h-2 bg-[#1a1a1a] rounded-full" />
                  <div className="w-14 h-2 bg-[#1a1a1a] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#161616] border border-[#222] rounded-xl p-3">
                    <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest font-bold">Ventas hoy</p>
                    <p className="text-lg text-[#ff5a1f] font-black font-mono mt-1">S/. 4,821</p>
                    <p className="text-[8px] text-green-500 font-mono mt-1">↑ 12% vs ayer</p>
                  </div>
                  <div className="bg-[#161616] border border-[#222] rounded-xl p-3">
                    <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest font-bold">Pedidos</p>
                    <p className="text-lg text-[#e0155b] font-black font-mono mt-1">38</p>
                    <p className="text-[8px] text-green-500 font-mono mt-1">5 pendientes</p>
                  </div>
                </div>
                <div className="bg-[#161616] border border-[#222] rounded-xl p-3 flex items-end gap-2 h-[72px]">
                  <span className="text-[8px] text-neutral-700 font-mono mr-1 self-center">Sem.</span>
                  {[60, 80, 50, 90, 100, 65, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm rounded-b-none ${i === 4 ? 'bg-[#e0155b]' : 'bg-[#ff5a1f]'}`}
                      style={{ height: `${h}%`, opacity: i === 4 ? 1 : 0.35 + i * 0.08 }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-[380px] h-2 bg-[#1c1c1c] border-x-[3px] border-[#2a2a2a]" />
            <div className="w-[380px] h-3 bg-[#181818] rounded-b-lg border-[3px] border-[#2a2a2a] border-t-0" />
            <div className="w-28 h-2 bg-[#1a1a1a] rounded-b-lg mx-auto border-2 border-[#2a2a2a] border-t-0" />
          </div>

          {/* Teléfono */}
          <div className="relative z-20">
            <div className="w-[185px] h-[370px] bg-[#111] rounded-[30px] border-[4px] border-[#2a2a2a] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-black rounded-full z-10" />
              <div className="bg-[#0d0d0d] w-full h-full pt-8 px-3 pb-3 flex flex-col">
                <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest font-bold mb-0.5">Hola,</p>
                <p className="text-base text-white font-black mb-4 font-mono tracking-tighter">BravaPOS</p>
                <div className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-[#ff5a1f] to-[#e0155b]">
                  <p className="text-[8px] text-white/70 font-mono font-bold uppercase tracking-widest">Caja hoy</p>
                  <p className="text-xl text-white font-black font-mono mt-1">S/. 4,821</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#161616] rounded-xl p-3 border border-[#222]">
                    <p className="text-[8px] text-neutral-600 font-mono uppercase font-bold tracking-widest">Mesas</p>
                    <p className="text-lg text-[#ff5a1f] font-black font-mono mt-1">12</p>
                  </div>
                  <div className="bg-[#161616] rounded-xl p-3 border border-[#222]">
                    <p className="text-[8px] text-neutral-600 font-mono uppercase font-bold tracking-widest">Activas</p>
                    <p className="text-lg text-green-500 font-black font-mono mt-1">7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones físicos del teléfono */}
            <div className="absolute right-[-4px] top-24 w-[4px] h-10 bg-[#222] rounded-r-md" />
            <div className="absolute left-[-4px] top-20 w-[4px] h-7 bg-[#222] rounded-l-md" />
            <div className="absolute left-[-4px] top-[112px] w-[4px] h-7 bg-[#222] rounded-l-md" />

            {/* Tarjeta flotante: pedido */}
            <div className="absolute -top-14 -right-[110px] bg-[#0f0f0f]/95 backdrop-blur border border-white/[0.07] rounded-2xl p-4 shadow-2xl w-44 z-30">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-full bg-[#ff5a1f] flex items-center justify-center text-[9px] text-white font-black flex-shrink-0">AJ</div>
                <div>
                  <p className="text-white text-xs font-bold">Mesa 3</p>
                  <p className="text-neutral-600 text-[9px] font-mono">hace 2 min</p>
                </div>
              </div>
              <p className="text-neutral-500 text-[10px] font-bold mb-2.5">2x Lomo Saltado</p>
              <div className="flex justify-between items-center">
                <span className="text-[#ff5a1f] font-black text-sm">S/. 56</span>
                <button className="text-[9px] bg-gradient-to-r from-[#ff5a1f] to-[#e0155b] px-3 py-1 rounded-lg text-white font-bold">OK</button>
              </div>
            </div>

            {/* Tarjeta flotante: progreso caja */}
            <div className="absolute bottom-0 -left-[148px] bg-[#0f0f0f]/95 backdrop-blur border border-white/[0.07] rounded-2xl p-4 shadow-2xl w-36 z-30">
              <p className="text-white text-xs font-bold mb-1">Caja Abierta</p>
              <p className="text-neutral-600 text-[9px] mb-3 font-mono">Turno mañana</p>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-gradient-to-r from-[#ff5a1f] to-[#e0155b] rounded-full" />
              </div>
              <p className="text-neutral-700 text-[8px] mt-1.5 font-mono uppercase tracking-widest text-right">65% meta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}