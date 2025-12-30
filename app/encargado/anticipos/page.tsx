// app/encargado/anticipos/page.tsx
'use client'

import React, { useState } from 'react';
import { useAnticipos, Anticipo } from '@/hooks/useanticipos';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import AnticiposModal from '@/components/AnticiposModal';
import { NavBar } from '@/components/ui/NavBar'
import ExportExcelButton from '@/components/ui/ExportExcelButton';

const AnticiposEncargadoPage = () => {
  const { data: session } = useSession();
  const {
    loading,
    error,
    employeeId,
    misAnticipos,
    anticiposPendientes,
    anticiposAprobados,
    fetchMisAnticipos,
    recargarTodos
  } = useAnticipos();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [montoEdit, setMontoEdit] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'aprobados' | 'mis-anticipos'>('pendientes');
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const estaEnPeriodoSolicitud = diaActual >= 15 && diaActual <= 30;
  const montosDisponibles = [300000, 400000, 500000];

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fecha y hora
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

  // Formatear solo fecha
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

  // Colores para estados
  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'aprobado':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pendiente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rechazado':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Verificar estado
  const estaPendiente = (estado: string): boolean => {
    const estadoLower = estado.toLowerCase();
    return estadoLower === 'pendiente' || estadoLower === 'pending';
  };

  const estaAprobado = (estado: string): boolean => {
    const estadoLower = estado.toLowerCase();
    return estadoLower === 'aprobado' || estadoLower === 'approved';
  };

  // Funciones CRUD
  const crearAnticipo = async (monto: number) => {
    try {
      const response = await fetch('/encargado/api/en_anticipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: monto,
          employeeid: employeeId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear anticipo');
      }

      fetchMisAnticipos(employeeId);
      alert('✅ Anticipo solicitado exitosamente. Está pendiente de aprobación.');
      return await response.json();
    } catch (error: any) {
      alert(error.message || 'Error al crear anticipo');
      throw error;
    }
  };

  const aprobarAnticipo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de aprobar este anticipo?')) return;

    try {
      const response = await fetch(`/encargado/api/en_anticipos?id=${id}&accion=aprobar`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aprobar anticipo');
      }

      recargarTodos();
      alert('Anticipo aprobado exitosamente');
    } catch (error: any) {
      alert(error.message || 'Error al aprobar anticipo');
    }
  };

  const rechazarAnticipo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de rechazar este anticipo?')) return;

    try {
      const response = await fetch(`/encargado/api/en_anticipos?id=${id}&accion=rechazar`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al rechazar anticipo');
      }

      recargarTodos();
      alert('Anticipo rechazado exitosamente');
    } catch (error: any) {
      alert(error.message || 'Error al rechazar anticipo');
    }
  };

  const actualizarAnticipo = async (id: number, monto: number) => {
    try {
      const response = await fetch(`/encargado/api/en_anticipos?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar');
      }

      fetchMisAnticipos(employeeId);
      alert('Anticipo actualizado exitosamente');
      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar anticipo');
    }
  };

  const eliminarAnticipo = async (id: number, estado: string) => {
    try {
      if (estaAprobado(estado)) {
        throw new Error('No puedes eliminar un anticipo que ya ha sido aprobado');
      }

      const response = await fetch(`/encargado/api/en_anticipos?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      fetchMisAnticipos(employeeId);
      alert('Anticipo eliminado exitosamente');
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar anticipo');
    }
  };

  // Handlers
  const handleEditar = async (anticipo: Anticipo) => {
    if (editando === anticipo.id) {
      try {
        if (!estaPendiente(anticipo.estado)) {
          alert('Solo puedes editar anticipos que están pendientes');
          setEditando(null);
          setMontoEdit(0);
          return;
        }

        await actualizarAnticipo(anticipo.id, montoEdit);
        setEditando(null);
        setMontoEdit(0);
      } catch (error: any) {
        alert(error.message || 'Error al actualizar');
      }
    } else {
      if (!estaPendiente(anticipo.estado)) {
        alert('Solo puedes editar anticipos que están pendientes');
        return;
      }
      setMontoEdit(anticipo.monto);
      setEditando(anticipo.id);
    }
  };

  const handleEliminar = async (anticipo: Anticipo) => {
    if (!estaPendiente(anticipo.estado)) {
      alert('Solo puedes eliminar anticipos que están pendientes');
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este anticipo?')) {
      try {
        await eliminarAnticipo(anticipo.id, anticipo.estado);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar');
      }
    }
  };

  const montosParaCambiar = (montoActual: number) =>
    montosDisponibles.filter(m => m !== montoActual);

  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3';

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

        {/* Botón flotante para solicitar anticipo */}
        <div className="fixed top-28 right-8 z-40 flex flex-col gap-2">
          <button
            onClick={() => setModalAbierto(true)}
            disabled={!estaEnPeriodoSolicitud || !employeeId}
            className={`px-4 py-2 rounded-lg font-medium text-sm shadow-md transition-all ${estaEnPeriodoSolicitud && employeeId
              ? 'bg-violet-600 hover:bg-violet-700 text-white hover:shadow-lg'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            {!employeeId ? '⏳ Obteniendo usuario...' :
              !estaEnPeriodoSolicitud ? '📅 Fuera de período' :
                '💰 Solicitar Anticipo'}
          </button>
        </div>

        <div className="p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Panel de Encargado - Anticipos
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {session?.user?.name ? `Bienvenid@, ${session.user.name}` : 'Encargado'}
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
                  <ExportExcelButton
                    anticiposAprobados={anticiposAprobados}
                    tipo="simple"
                    disabled={anticiposAprobados.length === 0}
                  />
                  <ExportExcelButton
                    anticiposAprobados={anticiposAprobados}
                    tipo="bancario"
                    disabled={anticiposAprobados.length === 0}
                  />
                </div>
              </div>

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

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Por Aprobar', value: anticiposPendientes.length, color: 'yellow', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Aprobados', value: anticiposAprobados.length, color: 'emerald', icon: 'M5 13l4 4L19 7' },
                { label: 'Mis Anticipos', value: misAnticipos.length, color: 'violet', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
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

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'pendientes', label: 'Por Aprobar', count: anticiposPendientes.length },
                    { key: 'aprobados', label: 'Aprobados', count: anticiposAprobados.length },
                    { key: 'mis-anticipos', label: 'Mis Anticipos', count: misAnticipos.length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                        ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      {tab.label}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tab.key === 'pendientes' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        tab.key === 'aprobados' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Contenido de las tabs */}
            <div className="space-y-6">
              {/* Tab Pendientes */}
              {activeTab === 'pendientes' && (
                <TabPendientes
                  anticipos={anticiposPendientes}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  aprobarAnticipo={aprobarAnticipo}
                  rechazarAnticipo={rechazarAnticipo}
                />
              )}

              {/* Tab Aprobados */}
              {activeTab === 'aprobados' && (
                <TabAprobados
                  anticipos={anticiposAprobados}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                />
              )}

              {/* Tab Mis Anticipos */}
              {activeTab === 'mis-anticipos' && (
                <TabMisAnticipos
                  anticipos={misAnticipos}
                  employeeId={employeeId}
                  estaEnPeriodoSolicitud={estaEnPeriodoSolicitud}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  getEstadoColor={getEstadoColor}
                  estaPendiente={estaPendiente}
                  estaAprobado={estaAprobado}
                  editando={editando}
                  montoEdit={montoEdit}
                  montosParaCambiar={montosParaCambiar}
                  handleEditar={handleEditar}
                  handleEliminar={handleEliminar}
                  setEditando={setEditando}
                  setMontoEdit={setMontoEdit}
                />
              )}
            </div>

            {/* Enlace al historial */}
            <div className="mt-6 flex justify-end">
              <Link
                href="/encargado/anticipos/historial"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ver Historial Completo
              </Link>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnticiposModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => fetchMisAnticipos(employeeId)}
          employeeid={employeeId}
        />
      </div>
    </div>
  );
};

// Componentes para las tabs
const TabPendientes = ({ anticipos, formatDate, formatCurrency, aprobarAnticipo, rechazarAnticipo }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Anticipos Por Aprobar</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {anticipos.length} solicitud{anticipos.length !== 1 ? 'es' : ''} por revisar
      </p>
    </div>

    {anticipos.length === 0 ? (
      <EmptyState message="No hay anticipos por aprobar" submessage="Todos los anticipos han sido procesados" />
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo: Anticipo) => (
          <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
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
                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                    title="Aprobar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => rechazarAnticipo(anticipo.id)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Rechazar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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

const TabMisAnticipos = ({
  anticipos, employeeId, estaEnPeriodoSolicitud, formatDateTime, formatCurrency,
  getEstadoColor, estaPendiente, estaAprobado, editando, montoEdit,
  montosParaCambiar, handleEditar, handleEliminar, setEditando, setMontoEdit
}: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Mis Anticipos</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {anticipos.length} solicitud{anticipos.length !== 1 ? 'es' : ''}
      </p>
    </div>

    {anticipos.length === 0 ? (
      <EmptyState
        message="No tienes anticipos registrados"
        submessage={employeeId
          ? (estaEnPeriodoSolicitud
            ? 'Solicita tu primer anticipo usando el botón "Solicitar Anticipo"'
            : 'Período: 15-30 de cada mes')
          : 'Cargando usuario...'
        }
      />
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo: Anticipo, index: number) => (
          <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${estaAprobado(anticipo.estado) ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                  estaPendiente(anticipo.estado) ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-gray-50 dark:bg-gray-700'
                  }`}>
                  <span className={`text-sm font-bold ${estaAprobado(anticipo.estado) ? 'text-emerald-700 dark:text-emerald-400' :
                    estaPendiente(anticipo.estado) ? 'text-yellow-700 dark:text-yellow-400' :
                      'text-gray-700 dark:text-gray-400'
                    }`}>
                    {estaAprobado(anticipo.estado) ? '✓' :
                      estaPendiente(anticipo.estado) ? '⏳' : '✗'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      Anticipo #{index + 1}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(anticipo.estado)} flex-shrink-0`}>
                      {anticipo.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatDateTime(anticipo.fecha_solicitud)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(anticipo.monto)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {estaPendiente(anticipo.estado) ? (
                    <>
                      {editando === anticipo.id ? (
                        <>
                          <button
                            onClick={() => handleEditar(anticipo)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                            title="Guardar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setEditando(null);
                              setMontoEdit(0);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="Cancelar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditar(anticipo)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Editar monto"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEliminar(anticipo)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2">
                      {estaAprobado(anticipo.estado)
                        ? 'Aprobado ✅'
                        : 'Revisión requerida'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editando === anticipo.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar nuevo monto:</p>
                <div className="grid grid-cols-3 gap-2">
                  {montosParaCambiar(anticipo.monto).map((monto: number) => (
                    <button
                      key={monto}
                      onClick={() => setMontoEdit(monto)}
                      className={`p-2 border rounded text-center transition-all text-sm ${montoEdit === monto
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {formatCurrency(monto)}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

export default AnticiposEncargadoPage;