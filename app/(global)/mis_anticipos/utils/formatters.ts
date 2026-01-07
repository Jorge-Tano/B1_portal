// app/(global)/mis_anticipos/utils/formatters.ts
import { Anticipo } from './types';

export const normalizeAdvance = (data: any): Anticipo => {
  console.log('📦 Normalizando datos de API:', {
    id: data.id,
    amount: data.amount,
    monto: data.monto,
    status: data.status
  });

  const monto = data.amount || data.monto || 0;
  
  return {
    id: data.id,
    employeeid: data.employeeid,
    monto: monto,
    fecha_solicitud: data.request_date,
    estado: data.status,
    pdf_url: data.agreement_pdf_url,
    fecha_firma: data.agreement_signed_at,
    usuario_nombre: data.user_name,
    usuario_email: data.user_email,
    usuario_departamento: data.user_department,
    usuario_documenttype: data.user_documenttype,
    usuario_banknumber: data.user_banknumber
  };
};

export const canGeneratePDF = (estado: string): boolean => {
  const estadoLower = estado.toLowerCase();
  return estadoLower === 'aprobado' || estadoLower === 'pendiente' || 
         estadoLower === 'approved' || estadoLower === 'pending';
};

export const isPending = (estado: string): boolean => {
  const estadoLower = estado.toLowerCase();
  return estadoLower === 'pendiente' || estadoLower === 'pending';
};

export const getEstadoColor = (estado: string): string => {
  const estadoLower = estado.toLowerCase();
  switch (estadoLower) {
    case 'aprobado':
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'pendiente':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'rechazado':
    case 'rejected':
    case 'denied':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

export const getEstadoIcon = (estado: string): string => {
  const estadoLower = estado.toLowerCase();
  switch (estadoLower) {
    case 'aprobado':
    case 'approved':
      return '✓';  // Check mark simple
    case 'pendiente':
    case 'pending':
      return '...';  // Puntos suspensivos
    case 'rechazado':
    case 'rejected':
    case 'denied':
      return '✗';  // X simple
  }
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No disponible';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'No disponible';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatSolicitudFecha = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const getTipoDocumentoText = (tipo: number | undefined): string => {
  if (!tipo) return 'Documento';
  
  switch(tipo) {
    case 1: return 'Cédula de Ciudadanía';
    case 2: return 'Cédula de Extranjería';
    case 3: return 'Pasaporte';
    case 4: return 'Tarjeta de Identidad';
    default: return 'Documento';
  }
};

export const formatNombreCompleto = (nombre: string | undefined): string => {
  if (!nombre) return 'Empleado';
  
  return nombre
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatCuentaBancaria = (cuenta: string | undefined): string => {
  if (!cuenta) return 'No especificado';
  
  if (/^\d+$/.test(cuenta)) {
    return cuenta.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
  }
  
  return cuenta;
};

export const getEstadoPDFInfo = (estado: string): { texto: string, color: string } => {
  const estadoLower = estado.toLowerCase();
  
  switch (estadoLower) {
    case 'aprobado':
    case 'approved':
      return { texto: 'Aprobado', color: '#10B981' }; 
    case 'pendiente':
    case 'pending':
      return { texto: 'Pendiente', color: '#F59E0B' }; 
    case 'rechazado':
    case 'rejected':
    case 'denied':
      return { texto: 'Rechazado', color: '#EF4444' }; 
    default:
      return { texto: estado, color: '#6B7280' };
  }
};

export const tieneDatosCompletosPDF = (anticipo: Anticipo): boolean => {
  return !!(anticipo.usuario_nombre && 
           anticipo.employeeid && 
           anticipo.usuario_departamento && 
           anticipo.monto);
};