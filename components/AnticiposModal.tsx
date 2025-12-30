// components/AnticiposModal.tsx
'use client'

import React, { useState, useEffect } from 'react';

interface AnticiposModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeid: string;
}

interface Monto {
  id: number;
  amount: number;
}

const AnticiposModal: React.FC<AnticiposModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeid
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoMontos, setCargandoMontos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [montosDisponibles, setMontosDisponibles] = useState<Monto[]>([]);

  // Función para cargar los montos desde la API de encargado
  const cargarMontosDisponibles = async () => {
    try {
      setCargandoMontos(true);
      console.log('🔄 Cargando montos disponibles desde API de encargado...');

      const response = await fetch('/encargado/api/montos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });

      console.log('📡 Status de respuesta (montos):', response.status);

      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar montos`);
      }

      const data = await response.json();
      console.log('✅ Montos cargados desde API:', data);

      setMontosDisponibles(data);

    } catch (err) {
      console.error('❌ Error al cargar montos desde API:', err);

      // Intentar cargar montos usando el endpoint directo de la tabla
      try {
        console.log('🔄 Intentando cargar montos con endpoint alternativo...');
        const fallbackResponse = await fetch('/api/montos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Montos cargados desde endpoint alternativo:', fallbackData);
          setMontosDisponibles(fallbackData);
        } else {
          throw new Error('Endpoint alternativo también falló');
        }
      } catch (fallbackErr) {
        console.error('❌ Error con endpoint alternativo:', fallbackErr);
        // Si hay error, usar montos por defecto
        setMontosDisponibles([
          { id: 1, amount: 300000 },
          { id: 2, amount: 400000 },
          { id: 3, amount: 500000 }
        ]);
        setError('No se pudieron cargar los montos desde el sistema. Usando valores por defecto.');
      }
    } finally {
      setCargandoMontos(false);
    }
  };

  // Cargar montos cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      cargarMontosDisponibles();
      setMontoSeleccionado(null); // Resetear selección
      setError(null); // Limpiar errores anteriores
    }
  }, [isOpen]);

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const handleSolicitarAnticipo = async () => {
    if (!montoSeleccionado) {
      setError('Por favor selecciona un monto');
      return;
    }

    if (!employeeid) {
      setError('No se pudo identificar tu Employee ID');
      return;
    }

    // Verificar que el monto seleccionado esté en la lista de montos disponibles
    const montoValido = montosDisponibles.some(m => m.amount === montoSeleccionado);
    if (!montoValido) {
      setError('El monto seleccionado no es válido. Por favor selecciona otro.');
      return;
    }

    console.log('🔄 Enviando solicitud de anticipo...');
    console.log('🔍 Ruta API: /encargado/api/en_anticipos');
    console.log('🔍 EmployeeID a enviar:', employeeid);
    console.log('🔍 Monto a enviar:', montoSeleccionado);

    setCargando(true);
    setError(null);

    try {
      const response = await fetch('/encargado/api/en_anticipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employeeid: employeeid,
          monto: montoSeleccionado
        }),
      });

      console.log('📡 Status de respuesta:', response.status);
      console.log('📡 Status text:', response.statusText);

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      console.log('📡 Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('💥 La API devolvió HTML en lugar de JSON. Primeros 500 caracteres:', text.substring(0, 500));

        // Verificar si es un error de NextAuth (página de login)
        if (text.includes('Sign in') || text.includes('next-auth')) {
          throw new Error('Error de autenticación: No estás autenticado. Por favor, inicia sesión nuevamente.');
        }

        throw new Error(`Error ${response.status}: El servidor devolvió HTML en lugar de JSON`);
      }

      const data = await response.json();
      console.log('✅ Respuesta API completa:', data);

      if (!response.ok) {
        let mensajeError = data.error || `Error ${response.status}`;

        if (data.message) {
          mensajeError += `\n${data.message}`;
        }

        if (data.details) {
          console.error('🔍 Detalles del error:', data.details);
          mensajeError += `\nDetalles: ${data.details}`;
        }

        // Mostrar montos permitidos si están disponibles
        if (data.montos_permitidos) {
          mensajeError += `\nMontos permitidos: ${data.montos_permitidos.join(', ')}`;
        }

        throw new Error(mensajeError);
      }

      alert(`¡Anticipo por ${formatearMoneda(montoSeleccionado)} creado con éxito!\n${data.message || ''}`);

      if (onSuccess) onSuccess();
      onClose();
      setMontoSeleccionado(null);

    } catch (err) {
      console.error('💥 Error completo:', err);
      setError(err instanceof Error ? err.message : 'Error al solicitar anticipo');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Solicitar Anticipo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={cargando}
            >
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el monto:
              {cargandoMontos && (
                <span className="ml-2 text-xs text-gray-500">(Cargando desde BD...)</span>
              )}
              {!cargandoMontos && montosDisponibles.length > 0 && (
                <span className="ml-2 text-xs text-green-600">({montosDisponibles.length} disponibles)</span>
              )}
            </label>

            {cargandoMontos ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-sm text-gray-500">Cargando montos desde la base de datos...</p>
              </div>
            ) : montosDisponibles.length === 0 ? (
              <div className="p-4 text-center border border-yellow-300 bg-yellow-50 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  No hay montos configurados en el sistema. Contacte al administrador.
                </p>
                <button
                  onClick={cargarMontosDisponibles}
                  className="mt-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Reintentar carga
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {montosDisponibles.map((monto) => (
                    <button
                      key={monto.id}
                      onClick={() => setMontoSeleccionado(monto.amount)}
                      disabled={cargando}
                      className={`p-3 border rounded-lg text-center transition ${montoSeleccionado === monto.amount
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                        } ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-bold text-gray-900">
                        {formatearMoneda(monto.amount)}
                      </div>
                    </button>
                  ))}
                </div>

                {montoSeleccionado && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
                    <p className="text-sm text-green-700">
                      Monto seleccionado: <span className="font-bold">{formatearMoneda(montoSeleccionado)}</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSolicitarAnticipo}
              disabled={!montoSeleccionado || cargando || cargandoMontos || montosDisponibles.length === 0}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${montoSeleccionado && !cargando && !cargandoMontos && montosDisponibles.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {cargando ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : 'Solicitar Anticipo'}
            </button>

            <button
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>

          {montosDisponibles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Los montos se cargan automáticamente desde la base de datos
                </p>
                <button
                  onClick={cargarMontosDisponibles}
                  disabled={cargandoMontos}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {cargandoMontos ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnticiposModal;