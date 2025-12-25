// components/AnticiposModal.tsx
'use client'

import React, { useState } from 'react';

interface AnticiposModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeid: string;
}

const AnticiposModal: React.FC<AnticiposModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  employeeid 
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montosDisponibles = [300000, 400000, 500000];

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

    console.log('🔄 Enviando solicitud de anticipo...');
    console.log('🔍 EmployeeID a enviar:', employeeid);
    console.log('🔍 Monto a enviar:', montoSeleccionado);

    setCargando(true);
    setError(null);

    try {
      // ENVIAR TANTO EL EMPLOYEEID COMO EL MONTO
      const response = await fetch('/api/anticipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeid: employeeid,  // ← ¡IMPORTANTE! Enviar employeeid
          monto: montoSeleccionado 
        }),
      });

      const data = await response.json();
      console.log('📡 Respuesta API completa:', data);

      if (!response.ok) {
        // Mensaje de error mejorado
        let mensajeError = data.error || `Error ${response.status}`;
        
        if (data.message) {
          mensajeError += `\n${data.message}`;
        }
        
        if (data.valid_employeeids) {
          mensajeError += `\nIDs válidos: ${data.valid_employeeids.join(', ')}`;
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

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Employee ID: <span className="font-bold">{employeeid}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Este ID será enviado al servidor para crear tu anticipo
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el monto:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {montosDisponibles.map((monto) => (
                <button
                  key={monto}
                  onClick={() => setMontoSeleccionado(monto)}
                  disabled={cargando}
                  className={`p-3 border rounded-lg text-center transition ${
                    montoSeleccionado === monto
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

          <div className="flex gap-3">
            <button
              onClick={handleSolicitarAnticipo}
              disabled={!montoSeleccionado || cargando}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                montoSeleccionado && !cargando
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {cargando ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Procesando...
                </span>
              ) : 'Solicitar'}
            </button>
            
            <button
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnticiposModal;