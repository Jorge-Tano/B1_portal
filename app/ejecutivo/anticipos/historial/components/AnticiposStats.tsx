// app/historial/components/AnticiposStats.tsx
import React from 'react';

interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
}

interface AnticiposStatsProps {
  anticipos: Anticipo[];
}

export function AnticiposStats({ anticipos }: AnticiposStatsProps) {
  // Validación inicial
  if (!Array.isArray(anticipos)) {
    anticipos = [];
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Función segura para obtener el estado en minúsculas
  const getEstadoLower = (estado: any): string => {
    if (estado === undefined || estado === null) return '';
    if (typeof estado !== 'string') return String(estado).toLowerCase();
    return estado.toLowerCase();
  };

  // Función segura para obtener el monto
  const getMontoSeguro = (monto: any): number => {
    if (monto === undefined || monto === null) return 0;
    const num = Number(monto);
    return isNaN(num) ? 0 : num;
  };

  // Calcular estadísticas con validación
  const totalAnticipos = anticipos.length;
  
  const totalMonto = anticipos.reduce((sum, anticipo) => {
    return sum + getMontoSeguro(anticipo.monto);
  }, 0);
  
  const aprobadosCount = anticipos.filter(a => {
    return getEstadoLower(a.estado) === 'aprobado';
  }).length;
  
  const pendientesCount = anticipos.filter(a => {
    return getEstadoLower(a.estado) === 'pendiente';
  }).length;
  
  const rechazadosCount = anticipos.filter(a => {
    return getEstadoLower(a.estado) === 'rechazado';
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Anticipos</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{totalAnticipos}</p>
          </div>
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monto Total</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
              {formatCurrency(totalMonto)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprobados</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{aprobadosCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalAnticipos > 0 ? `${((aprobadosCount / totalAnticipos) * 100).toFixed(1)}% del total` : '0%'}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{pendientesCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalAnticipos > 0 ? `${((pendientesCount / totalAnticipos) * 100).toFixed(1)}% del total` : '0%'}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}