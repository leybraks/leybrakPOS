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
    yape_numero: '',
    plin_numero: '',
    modulos: {
      salon: true, cocina: false, delivery: false,
      inventario: false, clientes: false, facturacion: false,
      cartaQr: false, botWsp: false, machineLearning: false,
    },
  },
  setConfiguracionGlobal: (nueva) => set({ configuracionGlobal: nueva }),
}));

export default useAppStore;