// app/anticipos/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/ui/Header';
import AnticiposModal from '@/components/AnticiposModal';
import { NavBar } from '@/components/ui/NavBar';

interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeID?: string;
}

const AnticiposPage = () => {
  const { data: session } = useSession();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [montoEdit, setMontoEdit] = useState<number>(0);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const estaEnPeriodoSolicitud = diaActual >= 15 && diaActual <= 25;
  const montosDisponibles = [300000, 400000, 500000];

  // Obtener employeeId del usuario logueado
  useEffect(() => {
    const obtenerEmployeeId = () => {
      if (!session?.user) return;
      
      // Dependiendo de dónde esté el employeeID en tu session
      console.log('Session user:', session.user);
      
      // Opción 1: Si session.user.name es el employeeID
      if (session.user.name && typeof session.user.name === 'string') {
        setEmployeeId(session.user.name);
        console.log('EmployeeID obtenido de session.user.name:', session.user.name);
      }
      
      // Opción 2: Si session.user.email contiene el employeeID
      else if (session.user.email) {
        const emailParts = session.user.email.split('@');
        if (emailParts[0]) {
          setEmployeeId(emailParts[0]);
          console.log('EmployeeID obtenido de email:', emailParts[0]);
        }
      }
    };
    
    obtenerEmployeeId();
  }, [session]);

  // Cargar anticipos
  useEffect(() => {
    fetchAnticipos();
  }, []);

  const fetchAnticipos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/anticipos');
      
      if (!response.ok) {
        throw new Error('Error al cargar anticipos');
      }
      
      const data = await response.json();
      setAnticipos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const crearAnticipo = async (monto: number) => {
    if (!employeeId) {
      throw new Error('No se pudo identificar tu Employee ID');
    }
    
    const response = await fetch('/api/anticipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        employeeid: employeeId, 
        monto: monto 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear anticipo');
    }
    
    return await response.json();
  };

  const actualizarAnticipo = async (id: number, monto: number) => {
    const response = await fetch(`/api/anticipos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar');
    }
    
    return await response.json();
  };

  const eliminarAnticipo = async (id: number) => {
    const response = await fetch(`/api/anticipos/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar');
    }
  };

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleEditar = async (anticipo: Anticipo) => {
    if (editando === anticipo.id) {
      try {
        await actualizarAnticipo(anticipo.id, montoEdit);
        setEditando(null);
        alert(`Anticipo actualizado a ${formatearMoneda(montoEdit)}`);
        fetchAnticipos();
      } catch (error: any) {
        alert(error.message || 'Error al actualizar');
      }
    } else {
      setMontoEdit(anticipo.monto);
      setEditando(anticipo.id);
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este anticipo?')) {
      try {
        await eliminarAnticipo(id);
        alert('Anticipo eliminado');
        fetchAnticipos();
      } catch (error: any) {
        alert(error.message || 'Error al eliminar');
      }
    }
  };

  const montosParaCambiar = (montoActual: number) => 
    montosDisponibles.filter(m => m !== montoActual);

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando anticipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ${contentPadding}`}>
        <div className="sticky top-0 z-50 bg-white border-b">
          <Header isNavExpanded={isNavExpanded} />
        </div>
        
        {/* Información del usuario */}
        {employeeId && (
          <div className="p-4 bg-blue-50">
            <p className="text-sm text-blue-800">
              👤 Employee ID: <span className="font-bold">{employeeId}</span>
            </p>
          </div>
        )}
        
        {/* Botón flotante */}
        <div className="fixed top-28 right-8 z-40">
          <button
            onClick={() => setModalAbierto(true)}
            disabled={!estaEnPeriodoSolicitud || !employeeId}
            className={`px-4 py-2 rounded-lg font-medium text-sm shadow-md ${
              estaEnPeriodoSolicitud && employeeId
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {!employeeId ? '⏳ Obteniendo usuario...' : 
             !estaEnPeriodoSolicitud ? '📅 Fuera de período' : 
             '💰 Solicitar Anticipo'}
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Mis Anticipos</h1>
              <p className="text-gray-600 mt-2">
                {anticipos.length} anticipo{anticipos.length !== 1 ? 's' : ''}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {anticipos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No tienes anticipos
                </h3>
                <p className="text-gray-600 mb-6">
                  {employeeId 
                    ? (estaEnPeriodoSolicitud 
                      ? 'Solicita tu primer anticipo usando el botón arriba' 
                      : 'Solo puedes solicitar entre el 15 y 20 de cada mes')
                    : 'Esperando identificación de usuario...'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {anticipos.map((anticipo) => (
                  <div key={anticipo.id} className="bg-white rounded-xl shadow-lg overflow-hidden border">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Anticipo #{anticipo.id}
                        </h3>
                        {anticipo.usuario_nombre && (
                          <p className="text-sm text-gray-600">
                            {anticipo.usuario_nombre}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editando === anticipo.id ? (
                          <>
                            <button
                              onClick={() => handleEditar(anticipo)}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditar(anticipo)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(anticipo.id)}
                              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-2">Monto Solicitado</p>
                        
                        {editando === anticipo.id ? (
                          <div className="space-y-4">
                            <p className="text-gray-700">
                              Monto actual: <span className="font-bold">{formatearMoneda(anticipo.monto)}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-md">
                              {montosParaCambiar(anticipo.monto).map((monto) => (
                                <button
                                  key={monto}
                                  onClick={() => setMontoEdit(monto)}
                                  className={`p-4 border rounded-lg text-center transition ${
                                    montoEdit === monto
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="font-bold text-gray-900">
                                    {formatearMoneda(monto)}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-6 rounded-xl">
                            <p className="text-3xl font-bold text-gray-800">
                              {formatearMoneda(anticipo.monto)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Fecha de Solicitud</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {formatearFecha(anticipo.fecha_solicitud)}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Estado</p>
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoColor(anticipo.estado)}`}>
                            {anticipo.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <AnticiposModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSuccess={fetchAnticipos}
          employeeid={employeeId}
        />
      </div>
    </div>
  );
};

export default AnticiposPage;