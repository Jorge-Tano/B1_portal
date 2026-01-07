// Constantes de la aplicación
export const ESTADOS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado'
} as const;

export const PERIODO_SOLICITUD = {
  INICIO: 1,      
  FIN: 31         
} as const;

export const estaEnPeriodoSolicitud = (): boolean => {
  const hoy = new Date();
  const diaActual = hoy.getDate();
  return diaActual >= PERIODO_SOLICITUD.INICIO && diaActual <= PERIODO_SOLICITUD.FIN;
};

export const getTextoPeriodo = (): string => {
  return `Activo (${PERIODO_SOLICITUD.INICIO}-${PERIODO_SOLICITUD.FIN})`;
};

export const getTextoPeriodoInactivo = (): string => {
  return `Inactivo`;
};