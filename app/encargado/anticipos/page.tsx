'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import AnticiposModal from '@/components/AnticiposModal';
import { NavBar } from '@/components/ui/NavBar'

interface Anticipo {
  id: number;
  monto: number;
  fechaSolicitud: string;
  fechaDeposito: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  descripcion: string;
}

const AnticiposPage = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [descripcionEdit, setDescripcionEdit] = useState('');
  const [montoEdit, setMontoEdit] = useState<number>(0);

  const hoy = new Date();
  const estaEnPeriodoSolicitud = hoy.getDate() >= 15 && hoy.getDate() <= 20;

  // Montos disponibles
  const montosDisponibles = [300000, 400000, 500000];

  // Datos de ejemplo - un anticipo solicitado
  const [anticipoEjemplo, setAnticipoEjemplo] = useState<Anticipo>({
    id: 1,
    monto: 500000,
    fechaSolicitud: '2024-01-15',
    fechaDeposito: '2024-01-20',
    estado: 'Pendiente',
    descripcion: 'Anticipo para gastos personales'
  });

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'bg-green-100 text-green-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditar = () => {
    if (editando === anticipoEjemplo.id) {
      setAnticipoEjemplo({
        ...anticipoEjemplo,
        monto: montoEdit,
        descripcion: descripcionEdit
      });
      setEditando(null);
      alert(`Anticipo actualizado a ${formatearMoneda(montoEdit)}`);
    } else {
      setDescripcionEdit(anticipoEjemplo.descripcion);
      setMontoEdit(anticipoEjemplo.monto);
      setEditando(anticipoEjemplo.id);
    }
  };

  const handleEliminar = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta solicitud de anticipo?')) {
      setAnticipoEjemplo(null as any);
      alert('Anticipo eliminado correctamente');
    }
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
  };

  // Funciones temporales para los nuevos botones
  const handleDescargarExcel = () => {
    alert('Descargando plantilla de Excel... (Función en desarrollo)');
  };

  const handleAprobarAnticipo = () => {
    alert('Accediendo a aprobaciones de anticipo... (Función en desarrollo)');
  };

  const montosParaCambiar = montosDisponibles.filter(m => m !== anticipoEjemplo.monto);
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        {/* Header con z-index más alto */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>
        
        {/* Botón flotante para solicitar anticipo */}
        <div className="fixed top-28 right-8 z-40">
          <button
            onClick={() => setModalAbierto(true)}
            disabled={!estaEnPeriodoSolicitud}
            className={`
              px-4 py-2 
              rounded-lg 
              font-medium 
              text-sm
              transition-all 
              duration-200
              shadow-md
              ${estaEnPeriodoSolicitud
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {estaEnPeriodoSolicitud
              ? '📝 Solicitar Anticipo'
              : '⏳ Fuera de período'
            }
          </button>
        </div>

        {/* Contenido principal */}
        <div className="bg-gray-50 dark:bg-gray-900">
          <div className="p-4 md:p-8 pt-6">
            <div className="max-w-6xl mx-auto">
              {/* Header de la página con botones organizados */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                      Mis Anticipos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Gestiona tus solicitudes de anticipo de salario
                    </p>
                  </div>
                  
                  {/* Botones de acción principales - alineados a la derecha */}
                  <div className="flex flex-col sm:flex-row gap-3 mr-8">
                    <button
                      onClick={handleAprobarAnticipo}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>✅</span> Aprobar anticipo
                    </button>
                    
                    <Link
                      href="/encargado/anticipos/historial"
                      className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>📋</span> Ver Historial
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Anticipo Solicitado
                  </h2>
                  <div className="flex gap-2">
                    {editando === anticipoEjemplo.id ? (
                      <>
                        <button
                          onClick={handleEditar}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <span>💾</span> Guardar Cambios
                        </button>
                        <button
                          onClick={handleCancelarEdicion}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleEditar}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          ✏️ Editar Anticipo
                        </button>
                        <button
                          onClick={handleEliminar}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <span>🗑️</span> Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Monto Solicitado</p>

                    {editando === anticipoEjemplo.id ? (
                      <div>
                        <div className="mb-4">
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            Monto actual: <span className="font-bold">{formatearMoneda(anticipoEjemplo.monto)}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Selecciona uno de los otros montos disponibles:
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                            {montosParaCambiar.map((monto) => (
                              <button
                                key={monto}
                                onClick={() => setMontoEdit(monto)}
                                className={`p-4 border rounded-lg text-center transition ${montoEdit === monto
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                              >
                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                  {formatearMoneda(monto)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {monto === 300000 ? 'Monto básico' :
                                    monto === 400000 ? 'Monto intermedio' :
                                      'Monto máximo'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mr-3">💡</div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              Al cambiar el monto, se actualizará el depósito programado manteniendo la misma fecha.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
                        <div>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                            {formatearMoneda(anticipoEjemplo.monto)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {anticipoEjemplo.monto === 300000 ? 'Monto básico' :
                              anticipoEjemplo.monto === 400000 ? 'Monto intermedio' :
                                'Monto máximo'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Depósito programado</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {formatearFecha(anticipoEjemplo.fechaDeposito)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Solicitud</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {formatearFecha(anticipoEjemplo.fechaSolicitud)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoColor(anticipoEjemplo.estado)}`}>
                        {anticipoEjemplo.estado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {!anticipoEjemplo && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-4xl">📭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    No tienes anticipos solicitados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Solicita tu primer anticipo usando el botón superior derecho
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnticiposModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        />
      </div>
    </div>
  );
};

export default AnticiposPage;