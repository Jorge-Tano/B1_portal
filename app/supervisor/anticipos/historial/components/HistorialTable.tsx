// app/encargado/anticipos/historial/components/HistorialTable.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
  amount_id?: number;
  campana?: string;
}

interface HistorialTableProps {
  filtros?: {
    campana?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    empleado?: string;
  };
}

export function HistorialTable({ filtros = {} }: HistorialTableProps) {
  const { data: session } = useSession();
  const [sortField, setSortField] = useState<'fecha_solicitud' | 'monto' | 'estado' | 'employeeid' | 'usuario_nombre'>('fecha_solicitud');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener datos del encargado
  const employeeId = session?.user?.adUser?.employeeID || 
                     session?.user?.email?.split('@')[0] || '';
  const nombreEncargado = session?.user?.name || 'Encargado';

  // Mapeo de amount_id a montos
  const mapeoAmountId: { [key: number]: number } = {
    1: 300000,
    2: 400000,
    3: 500000
  };

  // Función para normalizar datos de la API
  const normalizarAnticipo = (apiData: any): Anticipo => {
    // Convertir amount_id a monto
    let monto = 0;
    if (apiData.amount_id && mapeoAmountId[apiData.amount_id]) {
      monto = mapeoAmountId[apiData.amount_id];
    } else if (apiData.amount) {
      monto = Number(apiData.amount) || 0;
    }
    
    // Asegurar que el estado tenga un valor válido
    let estado = apiData.status || 'Pendiente';
    if (estado.toLowerCase() === 'pending') estado = 'Pendiente';
    if (estado.toLowerCase() === 'approved') estado = 'Aprobado';
    if (estado.toLowerCase() === 'rejected') estado = 'Rechazado';
    
    return {
      id: apiData.id || 0,
      employeeid: apiData.employeeid || '',
      monto: monto,
      fecha_solicitud: apiData.request_date || apiData.fecha_solicitud || new Date().toISOString(),
      estado: estado,
      usuario_nombre: apiData.user_name || apiData.usuario_nombre || 'Ejecutivo',
      usuario_employeeid: apiData.user_employeeid || apiData.usuario_employeeid,
      departamento: apiData.department || apiData.departamento || 'Sin departamento',
      amount_id: apiData.amount_id,
      campana: apiData.campana || 'General'
    };
  };

  // Función para cargar datos desde la API
  const fetchAnticipos = async () => {
    try {
      setLoading(true);
      setError(null);

      // URL para encargados - usa el mismo endpoint que ejecutivos por ahora
      const url = `/encargado/api/en_anticipos`;
      
      console.log('🔍 Cargando historial para encargado...');
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      
      // Normalizar los datos
      const normalizedData = data.map(normalizarAnticipo);
      console.log('📊 Datos normalizados:', normalizedData);
      
      setAnticipos(normalizedData);
      
    } catch (error: any) {
      console.error('❌ Error cargando anticipos:', error);
      setError(error.message || 'Error al cargar anticipos');
      setAnticipos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAnticipos();
  }, []);

  // Función segura para obtener color de estado
  const getEstadoColor = (estado: string) => {
    const estadoLower = estado?.toLowerCase?.() || '';
    
    switch (estadoLower) {
      case 'aprobado':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'rechazado':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Aplicar filtros
  const anticiposFiltrados = anticipos.filter(anticipo => {
    // Filtro por estado
    if (filtros.estado && filtros.estado !== 'todos') {
      if (anticipo.estado?.toLowerCase() !== filtros.estado.toLowerCase()) {
        return false;
      }
    }

    // Filtro por fecha
    if (filtros.fechaInicio || filtros.fechaFin) {
      const fechaAnticipo = new Date(anticipo.fecha_solicitud).getTime();
      
      if (filtros.fechaInicio) {
        const fechaInicio = new Date(filtros.fechaInicio).getTime();
        if (fechaAnticipo < fechaInicio) return false;
      }
      
      if (filtros.fechaFin) {
        const fechaFin = new Date(filtros.fechaFin + 'T23:59:59').getTime();
        if (fechaAnticipo > fechaFin) return false;
      }
    }

    // Filtro por empleado
    if (filtros.empleado && filtros.empleado !== 'todos') {
      if (anticipo.employeeid !== filtros.empleado) {
        return false;
      }
    }

    return true;
  });

  // Ordenar anticipos
  const sortedAnticipos = [...anticiposFiltrados].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'fecha_solicitud':
        aValue = new Date(a.fecha_solicitud || 0).getTime();
        bValue = new Date(b.fecha_solicitud || 0).getTime();
        break;
      case 'monto':
        aValue = Number(a.monto) || 0;
        bValue = Number(b.monto) || 0;
        break;
      case 'estado':
        aValue = a.estado?.toLowerCase?.() || '';
        bValue = b.estado?.toLowerCase?.() || '';
        break;
      case 'employeeid':
        aValue = a.employeeid?.toLowerCase?.() || '';
        bValue = b.employeeid?.toLowerCase?.() || '';
        break;
      case 'usuario_nombre':
        aValue = a.usuario_nombre?.toLowerCase?.() || '';
        bValue = b.usuario_nombre?.toLowerCase?.() || '';
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' 
      ? (aValue > bValue ? 1 : -1)
      : (aValue < bValue ? 1 : -1);
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return (
      <svg className={`w-4 h-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Historial de Anticipos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cargando datos...
              </p>
            </div>
          </div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando historial de anticipos...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Historial de Anticipos
              </h3>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
            Error al cargar datos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={fetchAnticipos}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Historial de Anticipos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {sortedAnticipos.length} registro{sortedAnticipos.length !== 1 ? 's' : ''} encontrado{sortedAnticipos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnticipos}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Actualizar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('fecha_solicitud')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Fecha
                  <SortIcon field="fecha_solicitud" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('usuario_nombre')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Ejecutivo
                  <SortIcon field="usuario_nombre" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('monto')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Monto
                  <SortIcon field="monto" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('estado')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Estado
                  <SortIcon field="estado" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedAnticipos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No hay anticipos registrados
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filtros.estado || filtros.fechaInicio || filtros.fechaFin
                      ? 'No se encontraron anticipos con los filtros aplicados'
                      : 'Aún no hay anticipos en el sistema'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedAnticipos.map((anticipo) => (
                <tr 
                  key={anticipo.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {formatDate(anticipo.fecha_solicitud)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(anticipo.fecha_solicitud)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {anticipo.usuario_nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {anticipo.employeeid}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatMonto(anticipo.monto)}
                    </div>
                    {anticipo.amount_id && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Plan: {anticipo.amount_id === 1 ? '300K' : 
                               anticipo.amount_id === 2 ? '400K' : 
                               anticipo.amount_id === 3 ? '500K' : 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(anticipo.estado)}`}>
                      {anticipo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {anticipo.departamento && (
                        <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          {anticipo.departamento}
                        </div>
                      )}
                      <button 
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver detalles"
                        onClick={() => {
                          console.log('Detalles del anticipo:', anticipo);
                          alert(`Detalles del anticipo:\n\nID: ${anticipo.id}\nEjecutivo: ${anticipo.usuario_nombre}\nMonto: ${formatMonto(anticipo.monto)}\nEstado: ${anticipo.estado}\nFecha: ${formatDateTime(anticipo.fecha_solicitud)}\nDepartamento: ${anticipo.departamento || 'N/A'}`);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Descargar comprobante"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con información */}
      {sortedAnticipos.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {sortedAnticipos.length} de {anticipos.length} anticipo{sortedAnticipos.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Total:</span> {formatMonto(
                  sortedAnticipos.reduce((sum, a) => sum + (a.monto || 0), 0)
                )}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-500 dark:text-gray-400">Aprobados</span>
                <div className="w-3 h-3 rounded-full bg-amber-500 ml-2"></div>
                <span className="text-gray-500 dark:text-gray-400">Pendientes</span>
                <div className="w-3 h-3 rounded-full bg-rose-500 ml-2"></div>
                <span className="text-gray-500 dark:text-gray-400">Rechazados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}