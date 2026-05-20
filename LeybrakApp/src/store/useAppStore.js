import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Estado de caja — nivel raíz (separado de configuracion)
  estadoCaja: null,
  setEstadoCaja: (estado) => set({ estadoCaja: estado }),

  configuracionGlobal: {
    colorPrimario: '#3b82f6',
    temaFondo: 'dark',
    negocio_id: null,
    nombre: '',
    confirmacion_automatica: false,
    device_token: null,
    yape_numero: '',
    yape_qr: null,
    plin_numero: '',
    plin_qr: null,
    modulos: {
      salon: true, cocina: false, delivery: false,
      inventario: false, clientes: false, facturacion: false,
      cartaQr: false, botWsp: false, machineLearning: false,
    },
  },
  setConfiguracionGlobal: (nueva) => set({ configuracionGlobal: nueva }),
}));

export default useAppStore;