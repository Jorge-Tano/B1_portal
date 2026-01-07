// app/encargado/anticipos/historial/components/HistorialTable.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react';
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
  fecha_aprobacion?: string;
  fecha_rechazo?: string;
  aprobado_por?: string;
  motivo_rechazo?: string;
}

interface AnticipoAPI {
  id: number;
  employeeid: string;
  monto_valor?: number;
  monto?: number;
  fecha_solicitud?: string;
  estado?: string;
  status?: string;
  request_date?: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
  amount_id?: number;
  campana?: string;
  updated_at?: string;
  approved_by?: string;
  rejection_reason?: string;
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
  const { data: session, status } = useSession(); // Agregar status
  const [sortField, setSortField] = useState<'fecha_solicitud' | 'monto' | 'estado' | 'employeeid' | 'usuario_nombre' | 'fecha_aprobacion'>('fecha_solicitud');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mapeo de amount_id a montos
  const mapeoAmountId: { [key: number]: number } = {
    1: 300000,
    2: 400000,
    3: 500000
  };

  // Función para normalizar datos de la API
  const normalizarAnticipo = useCallback((apiData: AnticipoAPI): Anticipo => {
    const estadoOriginal = apiData.status || apiData.estado || 'Pendiente';
    const fecha = apiData.request_date || apiData.fecha_solicitud || new Date().toISOString();
    const monto = apiData.monto_valor || apiData.monto || 0;

    let estadoNormalizado = estadoOriginal;
    const estadoLower = estadoNormalizado.toLowerCase().trim();
    
    if (estadoLower.includes('pend') || estadoLower === 'pending') {
      estadoNormalizado = 'Pendiente';
    } else if (estadoLower.includes('aprob') || estadoLower === 'approved') {
      estadoNormalizado = 'Aprobado';
    } else if (estadoLower.includes('rech') || estadoLower === 'rejected') {
      estadoNormalizado = 'Rechazado';
    }

    let fechaAprobacion = undefined;
    let fechaRechazo = undefined;
    
    if (estadoNormalizado === 'Aprobado' && apiData.updated_at) {
      fechaAprobacion = apiData.updated_at;
    }
    
    if (estadoNormalizado === 'Rechazado' && apiData.updated_at) {
      fechaRechazo = apiData.updated_at;
    }

    return {
      id: apiData.id,
      employeeid: apiData.employeeid || apiData.usuario_employeeid || '',
      monto: monto,
      fecha_solicitud: fecha,
      estado: estadoNormalizado,
      usuario_nombre: apiData.usuario_nombre || '',
      usuario_employeeid: apiData.usuario_employeeid || '',
      departamento: apiData.departamento || '',
      amount_id: apiData.amount_id,
      campana: apiData.campana || 'General',
      fecha_aprobacion: fechaAprobacion,
      fecha_rechazo: fechaRechazo,
      aprobado_por: apiData.approved_by,
      motivo_rechazo: apiData.rejection_reason
    };
  }, []);

  // Función para cargar datos - MEJORADA para manejar sesión
  const fetchAnticipos = useCallback(async () => {
    try {
      // Verificar si hay sesión antes de hacer fetch
      if (!session) {
        console.log('🔒 Sesión no disponible, omitiendo fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setAnticipos([]);

      console.log('🔍 Iniciando carga de historial...');
      console.log('📌 Usuario activo:', session.user?.name || 'Sin nombre');
      console.log('📌 Filtro estado:', filtros.estado || 'No especificado');
      console.log('📌 Filtro empleado:', filtros.empleado || 'No especificado');
      console.log('📌 Filtro fechas:', filtros.fechaInicio || 'sin inicio', 'a', filtros.fechaFin || 'sin fin');

      // ESTRATEGIA 1: Si hay filtro específico de estado (y no es "todos")
      if (filtros.estado && filtros.estado !== 'todos') {
        console.log(`📊 Cargando solo estado: ${filtros.estado}`);
        
        const url = `/encargado/api/en_anticipos?estado=${filtros.estado}`;
        console.log('🌐 URL:', url);
        
        try {
          const response = await fetch(url);
          
          // Verificar si la respuesta es HTML (página de login)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              console.warn('⚠️ Se recibió HTML, probablemente sesión expirada');
              // Limpiar datos y mostrar mensaje
              setAnticipos([]);
              setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
              setLoading(false);
              return;
            }
          }
          
          if (!response.ok) {
            console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
            throw new Error(`Error al cargar datos: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`📊 Datos recibidos (${filtros.estado}):`, data);
          
          if (!Array.isArray(data)) {
            console.error('❌ La API no devolvió un array:', data);
            throw new Error('Formato de datos incorrecto');
          }
          
          const normalizedData = data.map(normalizarAnticipo);
          console.log(`✅ ${normalizedData.length} anticipos normalizados`);
          
          setAnticipos(normalizedData);
          return;
          
        } catch (apiError: any) {
          // Ignorar errores de JSON si es porque recibimos HTML
          if (apiError.message && apiError.message.includes('JSON')) {
            console.warn('⚠️ Error parseando JSON, posible sesión expirada');
            setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
            setAnticipos([]);
          } else {
            console.error('❌ Error en API específica:', apiError);
            throw apiError;
          }
        }
      }

      
      const urls = [
        '/encargado/api/en_anticipos?estado=pendiente',
        '/encargado/api/en_anticipos?estado=aprobado',
        '/encargado/api/en_anticipos?estado=rechazado'
      ];
      
      console.log('🌐 URLs a cargar:', urls);
      
      const promises = urls.map(async (url) => {
        try {
          console.log(`🔍 Cargando: ${url}`);
          const response = await fetch(url);
          
          // Verificar si la respuesta es HTML
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            return []; // Retornar array vacío si es HTML
          }
          
          if (!response.ok) {
            console.warn(`⚠️ Error en ${url}: ${response.status}`);
            return [];
          }
          
          const data = await response.json();
          console.log(`📊 Respuesta de ${url}:`, Array.isArray(data) ? `${data.length} items` : 'no array');
          
          if (!Array.isArray(data)) {
            console.warn(`⚠️ ${url} no devolvió array:`, data);
            return [];
          }
          
          return data;
        } catch (error: any) {
          // Ignorar errores de JSON parsing
          if (error.message && error.message.includes('JSON')) {
            console.warn(`⚠️ ${url}: Error parseando JSON, omitiendo`);
            return [];
          }
          console.error(`❌ Error en ${url}:`, error);
          return [];
        }
      });
      
      const resultados = await Promise.all(promises);
      
      const todosLosDatos = resultados.flat();
      console.log(`📊 Total datos combinados: ${todosLosDatos.length} items`);
      
      if (todosLosDatos.length === 0) {
        console.log('ℹ️ No se encontraron datos en ninguna llamada');
        // Verificar si fue por sesión expirada
        if (!session) {
          setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        }
        setAnticipos([]);
        return;
      }
      
      const normalizedData = todosLosDatos.map(normalizarAnticipo);
      console.log(`✅ Total anticipos normalizados: ${normalizedData.length}`);
      
      let datosFiltrados = normalizedData;
      
      if (filtros.empleado && filtros.empleado !== 'todos') {
        datosFiltrados = datosFiltrados.filter(a => a.employeeid === filtros.empleado);
        console.log(`🔍 Filtrado por empleado ${filtros.empleado}: ${datosFiltrados.length} items`);
      }
      
      if (filtros.fechaInicio || filtros.fechaFin) {
        const fechaInicio = filtros.fechaInicio ? new Date(filtros.fechaInicio).getTime() : 0;
        const fechaFin = filtros.fechaFin ? new Date(filtros.fechaFin + 'T23:59:59').getTime() : Date.now();
        
        datosFiltrados = datosFiltrados.filter(a => {
          const fechaAnticipo = new Date(a.fecha_solicitud).getTime();
          return (!filtros.fechaInicio || fechaAnticipo >= fechaInicio) &&
                 (!filtros.fechaFin || fechaAnticipo <= fechaFin);
        });
        console.log(`🔍 Filtrado por fechas: ${datosFiltrados.length} items`);
      }
      
      if (filtros.campana && filtros.campana !== 'todos') {
        datosFiltrados = datosFiltrados.filter(a => a.campana === filtros.campana);
        console.log(`🔍 Filtrado por campaña ${filtros.campana}: ${datosFiltrados.length} items`);
      }
      
      setAnticipos(datosFiltrados);
      
    } catch (error: any) {
      console.error('❌ Error general cargando anticipos:', error);
      setError(error.message || 'Error al cargar anticipos');
      setAnticipos([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, normalizarAnticipo, session]); // Agregar session a las dependencias

  // useEffect 1: Cargar datos cuando cambien los filtros (EXISTENTE)
  useEffect(() => {
    fetchAnticipos();
  }, [fetchAnticipos]);

  // useEffect 2: NUEVO - Detectar cuando la sesión se pierde
  useEffect(() => {
    // status puede ser: 'loading', 'authenticated', 'unauthenticated'
    if (status === 'unauthenticated') {
      console.log('🔓 Sesión cerrada, limpiando datos del historial');
      // Limpiar datos para evitar errores
      setAnticipos([]);
      setError('Sesión finalizada. Por favor, vuelve a iniciar sesión.');
      setLoading(false);
    }
    
    // Si vuelve a autenticarse después de estar sin sesión
    if (status === 'authenticated' && session && anticipos.length === 0 && !loading && !error) {
      console.log('🔄 Sesión restaurada, recargando datos');
      // Recargar datos automáticamente
      fetchAnticipos();
    }
  }, [status, session, anticipos.length, loading, error, fetchAnticipos]);

  // Función para recargar manualmente
  const recargarDatos = () => {
    // Verificar sesión antes de recargar
    if (!session) {
      setError('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }
    setLoading(true);
    fetchAnticipos();
  };

  // Resto de funciones utilitarias
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

  const getEstadoIcon = (estado: string) => {
    const estadoLower = estado?.toLowerCase?.() || '';
    
    switch (estadoLower) {
      case 'aprobado':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pendiente':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rechazado':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
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

  // Calcular estadísticas
  const contadores = {
    todos: anticipos.length,
    aprobados: anticipos.filter(a => a.estado?.toLowerCase() === 'aprobado').length,
    pendientes: anticipos.filter(a => a.estado?.toLowerCase() === 'pendiente').length,
    rechazados: anticipos.filter(a => a.estado?.toLowerCase() === 'rechazado').length
  };

  // Función para mostrar estadísticas según el filtro aplicado
  const mostrarEstadisticasFiltradas = () => {
    const estadoFiltro = filtros.estado?.toLowerCase();
    
    // Si no hay filtro de estado o es "todos", mostrar todas las estadísticas
    if (!estadoFiltro || estadoFiltro === 'todos') {
      return (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {contadores.aprobados} Aprobados
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {contadores.pendientes} Pendientes
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
              {contadores.rechazados} Rechazados
            </span>
          </div>
        </>
      );
    }
    
    // Si hay filtro específico, mostrar solo esa estadística
    switch (estadoFiltro) {
      case 'aprobado':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {contadores.aprobados} Aprobados
            </span>
          </div>
        );
        
      case 'pendiente':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {contadores.pendientes} Pendientes
            </span>
          </div>
        );
        
      case 'rechazado':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
              {contadores.rechazados} Rechazados
            </span>
          </div>
        );
        
      default:
        // Si el filtro no coincide con ningún estado conocido, mostrar todas
        return (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {contadores.aprobados} Aprobados
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {contadores.pendientes} Pendientes
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                {contadores.rechazados} Rechazados
              </span>
            </div>
          </>
        );
    }
  };

  // Ordenar anticipos
  const sortedAnticipos = [...anticipos].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'fecha_solicitud':
        aValue = new Date(a.fecha_solicitud || 0).getTime();
        bValue = new Date(b.fecha_solicitud || 0).getTime();
        break;
      case 'fecha_aprobacion':
        const fechaA = a.fecha_aprobacion || a.fecha_solicitud || '';
        const fechaB = b.fecha_aprobacion || b.fecha_solicitud || '';
        aValue = fechaA ? new Date(fechaA).getTime() : 0;
        bValue = fechaB ? new Date(fechaB).getTime() : 0;
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {status === 'unauthenticated' ? 'Sesión expirada' : 'Error al cargar'}
              </p>
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
            {status === 'unauthenticated' ? 'Sesión expirada' : 'Error al cargar datos'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          {status === 'unauthenticated' ? (
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={recargarDatos}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Historial de Anticipos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {status === 'authenticated' && session ? (
                `${sortedAnticipos.length} registro${sortedAnticipos.length !== 1 ? 's' : ''} encontrado${sortedAnticipos.length !== 1 ? 's' : ''}`
              ) : status === 'unauthenticated' ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Sesión no activa
                </span>
              ) : (
                'Cargando estado...'
              )}
            </p>
          </div>
          
          {/* Estadísticas rápidas - SOLO LAS DEL FILTRO APLICADO */}
          <div className="flex flex-wrap gap-3">
            {mostrarEstadisticasFiltradas()}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={recargarDatos}
              disabled={!session}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm ${session ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'} rounded transition-colors`}
              title={session ? "Actualizar" : "Inicia sesión para actualizar"}
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
                  disabled={!session}
                >
                  Fecha Solicitud
                  <SortIcon field="fecha_solicitud" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('usuario_nombre')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  disabled={!session}
                >
                  Ejecutivo
                  <SortIcon field="usuario_nombre" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('monto')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  disabled={!session}
                >
                  Monto
                  <SortIcon field="monto" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('estado')}
                  className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  disabled={!session}
                >
                  Estado
                  <SortIcon field="estado" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Fecha Resolución
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
                    {status === 'unauthenticated' ? 'Sesión expirada' : 'No hay anticipos registrados'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {status === 'unauthenticated' 
                      ? 'Por favor, inicia sesión para ver el historial' 
                      : filtros.estado || filtros.fechaInicio || filtros.fechaFin || filtros.empleado
                        ? 'No se encontraron anticipos con los filtros aplicados'
                        : 'No hay anticipos en el sistema'}
                  </p>
                  {status === 'unauthenticated' ? (
                    <button
                      onClick={() => window.location.href = '/auth/signin'}
                      className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                  ) : (
                    <button
                      onClick={recargarDatos}
                      className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Reintentar carga
                    </button>
                  )}
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
                    {anticipo.departamento && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {anticipo.departamento}
                      </div>
                    )}
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
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getEstadoColor(anticipo.estado)}`}>
                      {getEstadoIcon(anticipo.estado)}
                      {anticipo.estado}
                    </span>
                    {anticipo.aprobado_por && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Por: {anticipo.aprobado_por}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {anticipo.estado?.toLowerCase() === 'aprobado' && anticipo.fecha_aprobacion ? (
                      <>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {formatDate(anticipo.fecha_aprobacion)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(anticipo.fecha_aprobacion)}
                        </div>
                      </>
                    ) : anticipo.estado?.toLowerCase() === 'rechazado' && anticipo.fecha_rechazo ? (
                      <>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {formatDate(anticipo.fecha_rechazo)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(anticipo.fecha_rechazo)}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con estadísticas */}
      {sortedAnticipos.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {sortedAnticipos.length} de {anticipos.length} anticipo{sortedAnticipos.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-500 dark:text-gray-400">Aprobados</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-gray-500 dark:text-gray-400">Pendientes</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-gray-500 dark:text-gray-400">Rechazados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}