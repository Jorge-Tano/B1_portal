// app/supervisor/anticipos/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useAnticipos, Anticipo } from '../hooks/useanticipos'; 
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { NavBar } from '@/components/ui/NavBar'
import { SimpleAutoBreadcrumb } from '@/components/ui/SimpleAutoBreadcrumb'

const AnticiposSupervisorPage = () => {
  const { data: session } = useSession();
  const {
    loading,
    error,
    employeeId,
    anticiposPendientes,
    anticiposAprobados,
    anticiposRechazados, 
    aprobarAnticipo,
    rechazarAnticipo,
    aprobarAnticiposMasivos,
    rechazarAnticiposMasivos,
    cargarTodosDatos,
    isUpdating
  } = useAnticipos();

  
  const [activeTab, setActiveTab] = useState<'pendientes' | 'aprobados' | 'rechazados'>('pendientes'); 
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [showModalMasivo, setShowModalMasivo] = useState(false);
  const [accionMasiva, setAccionMasiva] = useState<'aprobar' | 'rechazar' | null>(null);

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const estaEnPeriodoSolicitud = diaActual >= 1 && diaActual <= 31;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'aprobado':
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pendiente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rechazado':
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const estaPendiente = (estado: string): boolean => {
    const estadoLower = estado.toLowerCase();
    return estadoLower === 'pendiente' || estadoLower === 'pending';
  };

  const estaAprobado = (estado: string): boolean => {
    const estadoLower = estado.toLowerCase();
    return estadoLower === 'aprobado' || estadoLower === 'approved';
  };

  const handleAprobarAnticipo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de aprobar este anticipo?')) return;

    try {
      const result = await aprobarAnticipo(id);
      if (result.success) {
        console.log('✅ Anticipo aprobado exitosamente');
      } else {
        alert(result.error || 'Error al aprobar anticipo');
      }
    } catch (error: any) {
      alert(error.message || 'Error al aprobar anticipo');
    }
  };

  const handleRechazarAnticipo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de rechazar este anticipo?')) return;

    try {
      const result = await rechazarAnticipo(id);
      if (result.success) {
        console.log('✅ Anticipo rechazado exitosamente');
      } else {
        alert(result.error || 'Error al rechazar anticipo');
      }
    } catch (error: any) {
      alert(error.message || 'Error al rechazar anticipo');
    }
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === anticiposPendientes.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(anticiposPendientes.map(a => a.id));
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleAccionMasiva = async () => {
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un anticipo');
      return;
    }

    if (!accionMasiva) return;

    try {
      let resultado;
      
      if (accionMasiva === 'aprobar') {
        if (!window.confirm(`¿Estás seguro de aprobar ${seleccionados.length} anticipo(s)?`)) return;
        resultado = await aprobarAnticiposMasivos(seleccionados);
      } else {
        if (!window.confirm(`¿Estás seguro de rechazar ${seleccionados.length} anticipo(s)?`)) return;
        resultado = await rechazarAnticiposMasivos(seleccionados);
      }

      if (resultado.success) {
        alert(resultado.message || `${seleccionados.length} anticipos procesados exitosamente`);
        setSeleccionados([]);
        setAccionMasiva(null);
        setShowModalMasivo(false);
      } else {
        alert(resultado.error || 'Error al procesar la acción');
      }
    } catch (error: any) {
      alert(error.message || 'Error al procesar acción masiva');
    }
  };

  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3';

  useEffect(() => {
    setSeleccionados([]);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar onExpandChange={setIsNavExpanded} />
        <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <Header isNavExpanded={isNavExpanded} />
          </div>
          <div className="p-8 pt-20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Panel de Supervisor - Anticipos
                  </h1>
                  <SimpleAutoBreadcrumb />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {session?.user?.name ? `Bienvenido, ${session.user.name}` : 'Supervisor'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">ID del Empleado:</span> {employeeId || '--'}
                  </div>
                  <div className={`text-sm px-3 py-1 rounded-full ${estaEnPeriodoSolicitud
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                    {estaEnPeriodoSolicitud ? '✅ Período activo' : '⏳ Período inactivo'}
                  </div>
                </div>
              </div>

              {seleccionados.length > 0 && (
                <div className="mb-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <span className="text-violet-600 dark:text-violet-400 font-bold">{seleccionados.length}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {seleccionados.length} anticipo(s) seleccionado(s)
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Haz clic en los botones para realizar una acción masiva
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAccionMasiva('aprobar');
                          setShowModalMasivo(true);
                        }}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {isUpdating ? 'Procesando...' : 'Aprobar Seleccionados'}
                      </button>
                      <button
                        onClick={() => {
                          setAccionMasiva('rechazar');
                          setShowModalMasivo(true);
                        }}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-red-500 hover:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rechazar Seleccionados
                      </button>
                      <button
                        onClick={() => setSeleccionados([])}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Por Aprobar', value: anticiposPendientes.length, color: 'yellow', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Aprobados', value: anticiposAprobados.length, color: 'emerald', icon: 'M5 13l4 4L19 7' },
                { label: 'Rechazados', value: anticiposRechazados.length, color: 'red', icon: 'M6 18L18 6M6 6l12 12' }, 
                { label: 'Estado Período', value: estaEnPeriodoSolicitud ? 'Activo' : 'Inactivo', color: 'blue', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-lg`}>
                      <svg className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'pendientes', label: 'Por Aprobar', count: anticiposPendientes.length },
                    { key: 'aprobados', label: 'Aprobados', count: anticiposAprobados.length },
                    { key: 'rechazados', label: 'Rechazados', count: anticiposRechazados.length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.key
                          ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      {tab.label}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tab.key === 'pendientes' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          tab.key === 'aprobados' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="space-y-6">
              {activeTab === 'pendientes' && (
                <TabPendientes
                  anticipos={anticiposPendientes}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  aprobarAnticipo={handleAprobarAnticipo}
                  rechazarAnticipo={handleRechazarAnticipo}
                  isUpdating={isUpdating}
                  seleccionados={seleccionados}
                  toggleSeleccion={toggleSeleccion}
                  toggleSeleccionarTodos={toggleSeleccionarTodos}
                />
              )}

              {activeTab === 'aprobados' && (
                <TabAprobados
                  anticipos={anticiposAprobados}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                />
              )}

              {activeTab === 'rechazados' && (
                <TabRechazados
                  anticipos={anticiposRechazados}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                />
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/supervisor/anticipos/historial"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ver Historial Completo
              </Link>
            </div>
          </div>
        </div>

        {showModalMasivo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {accionMasiva === 'aprobar' ? 'Aprobar Anticipos' : 'Rechazar Anticipos'}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {accionMasiva === 'aprobar'
                    ? `¿Confirmas que deseas aprobar ${seleccionados.length} anticipo(s)?`
                    : `¿Confirmas que deseas rechazar ${seleccionados.length} anticipo(s)?`
                  }
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowModalMasivo(false);
                      setAccionMasiva(null);
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAccionMasiva}
                    disabled={isUpdating}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${accionMasiva === 'aprobar'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {isUpdating ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

const TabPendientes = ({
  anticipos,
  formatDate,
  formatCurrency,
  aprobarAnticipo,
  rechazarAnticipo,
  isUpdating,
  seleccionados,
  toggleSeleccion,
  toggleSeleccionarTodos
}: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Anticipos Por Aprobar</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {anticipos.length} solicitud{anticipos.length !== 1 ? 'es' : ''} por revisar
        </p>
      </div>
      
      {anticipos.length > 0 && (
        <button
          onClick={toggleSeleccionarTodos}
          className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium flex items-center gap-2"
        >
          {seleccionados.length === anticipos.length ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Deseleccionar todos
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Seleccionar todos
            </>
          )}
        </button>
      )}
    </div>

    {anticipos.length === 0 ? (
      <EmptyState message="No hay anticipos por aprobar" submessage="Todos los anticipos han sido procesados" />
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo: Anticipo) => (
          <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(anticipo.id)}
                  onChange={() => toggleSeleccion(anticipo.id)}
                  className="h-4 w-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                  disabled={isUpdating}
                />
              </div>
              
              <div className="flex items-center justify-between gap-3 flex-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">⏳</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {anticipo.usuario_nombre || 'Ejecutivo'}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(anticipo.fecha_solicitud)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {anticipo.employeeid}</div>
                      {anticipo.departamento && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Depto: {anticipo.departamento}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(anticipo.monto)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => aprobarAnticipo(anticipo.id)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${isUpdating
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                        }`}
                      title="Aprobar"
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-700"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => rechazarAnticipo(anticipo.id)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${isUpdating
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                      title="Rechazar"
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TabAprobados = ({ anticipos, formatDateTime, formatCurrency }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Anticipos Aprobados</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {anticipos.length} anticipo{anticipos.length !== 1 ? 's' : ''} aprobado{anticipos.length !== 1 ? 's' : ''}
      </p>
    </div>

    {anticipos.length === 0 ? (
      <EmptyState message="No hay anticipos aprobados" submessage="Aún no hay anticipos aprobados en el sistema" />
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo: Anticipo) => (
          <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">✓</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {anticipo.usuario_nombre || 'Ejecutivo'}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex-shrink-0">
                      Aprobado
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDateTime(anticipo.fecha_solicitud)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {anticipo.employeeid}</div>
                    {anticipo.departamento && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Depto: {anticipo.departamento}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(anticipo.monto)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TabRechazados = ({ anticipos, formatDateTime, formatCurrency }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Anticipos Rechazados</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {anticipos.length} anticipo{anticipos.length !== 1 ? 's' : ''} rechazado{anticipos.length !== 1 ? 's' : ''}
      </p>
    </div>

    {anticipos.length === 0 ? (
      <EmptyState 
        message="No hay anticipos rechazados" 
        submessage="No se han rechazado anticipos en el sistema" 
      />
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo: Anticipo) => (
          <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">✗</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {anticipo.usuario_nombre || 'Ejecutivo'}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex-shrink-0">
                      Rechazado
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDateTime(anticipo.fecha_solicitud)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {anticipo.employeeid}</div>
                    {anticipo.departamento && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Depto: {anticipo.departamento}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      {formatCurrency(anticipo.monto)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const EmptyState = ({ message, submessage }: { message: string, submessage: string }) => (
  <div className="text-center py-8">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">{message}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{submessage}</p>
  </div>
);

export default AnticiposSupervisorPage;