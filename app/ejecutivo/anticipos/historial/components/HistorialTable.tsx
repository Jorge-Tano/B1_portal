// app/historial/components/HistorialTable.tsx
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
}

interface HistorialTableProps {
  employeeId?: string; // Puedes pasar el employeeId como prop
}

export function HistorialTable({ employeeId: propEmployeeId }: HistorialTableProps) {
  const { data: session } = useSession();
  const [sortField, setSortField] = useState<'fecha_solicitud' | 'monto' | 'estado'>('fecha_solicitud');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener employeeId de la sesión o de props
  const employeeId = propEmployeeId || 
                     session?.user?.adUser?.employeeID || 
                     session?.user?.email?.split('@')[0] || '';

  // Mapeo de amount_id a montos (ajusta según tu base de datos)
  const mapeoAmountId: { [key: number]: number } = {
    1: 300000,
    2: 400000,
    3: 500000
    // Agrega más según sea necesario
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
    
    return {
      id: apiData.id || 0,
      employeeid: apiData.employeeid || '',
      monto: monto,
      fecha_solicitud: apiData.request_date || apiData.fecha_solicitud || new Date().toISOString(),
      estado: apiData.status || 'Pendiente',
      usuario_nombre: apiData.user_name || apiData.usuario_nombre,
      usuario_employeeid: apiData.user_employeeid || apiData.usuario_employeeid,
      departamento: apiData.department || apiData.departamento,
      amount_id: apiData.amount_id
    };
  };

  // Función para cargar datos
  const fetchAnticipos = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!employeeId) {
        setError('No se pudo identificar al usuario');
        setLoading(false);
        return;
      }

      // Ajusta esta URL según tu API
      const url = `/ejecutivo/api/ej_anticipos?employeeid=${encodeURIComponent(employeeId)}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalizar los datos
      const normalizedData = data.map(normalizarAnticipo);
      setAnticipos(normalizedData);
      
    } catch (error: any) {
      console.error('Error cargando anticipos:', error);
      setError(error.message || 'Error al cargar anticipos');
      setAnticipos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (employeeId) {
      fetchAnticipos();
    }
  }, [employeeId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
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

  // Función segura para obtener color de estado
  const getEstadoColor = (estado: string) => {
    const estadoLower = estado?.toLowerCase?.() || '';
    
    switch (estadoLower) {
      case 'aprobado':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rechazado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Función segura para normalizar estado
  const normalizeEstado = (estado: any): string => {
    if (estado === undefined || estado === null) return '';
    if (typeof estado !== 'string') return String(estado);
    return estado.trim();
  };

  // Ordenar anticipos
  const sortedAnticipos = [...anticipos].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'fecha_solicitud':
        try {
          aValue = new Date(a.fecha_solicitud || '').getTime();
          bValue = new Date(b.fecha_solicitud || '').getTime();
        } catch {
          aValue = 0;
          bValue = 0;
        }
        break;
      case 'monto':
        aValue = Number(a.monto) || 0;
        bValue = Number(b.monto) || 0;
        break;
      case 'estado':
        aValue = normalizeEstado(a.estado).toLowerCase();
        bValue = normalizeEstado(b.estado).toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: 'fecha_solicitud' | 'monto' | 'estado') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'fecha_solicitud' | 'monto' | 'estado' }) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
        <div className="mt-4 text-center">
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

  // Mostrar si no hay employeeId
  if (!employeeId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
            No se identificó al usuario
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión para ver tu historial de anticipos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Historial de Anticipos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Employee ID: <span className="font-medium">{employeeId}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('fecha_solicitud')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Fecha
                  <SortIcon field="fecha_solicitud" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('monto')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Monto
                  <SortIcon field="monto" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('estado')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Estado
                  <SortIcon field="estado" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedAnticipos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No hay anticipos registrados
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No se encontraron anticipos en tu historial
                  </p>
                </td>
              </tr>
            ) : (
              sortedAnticipos.map((anticipo) => {
                const estadoSeguro = normalizeEstado(anticipo.estado);
                
                return (
                  <tr key={anticipo.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(anticipo.fecha_solicitud || '')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {anticipo.id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(anticipo.monto || 0)}
                      </div>
                      {anticipo.amount_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Amount ID: {anticipo.amount_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(estadoSeguro)}`}>
                          {estadoSeguro || 'Desconocido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {anticipo.usuario_nombre && (
                          <div className="mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Nombre:</span> {anticipo.usuario_nombre}
                          </div>
                        )}
                        {anticipo.departamento && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Depto: {anticipo.departamento}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Paginación y resumen */}
        {sortedAnticipos.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {sortedAnticipos.length} anticipo{sortedAnticipos.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: {formatCurrency(anticipos.reduce((sum, a) => sum + (a.monto || 0), 0))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}