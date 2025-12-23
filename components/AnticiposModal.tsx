'use client'

import React, { useState } from 'react';

interface AnticiposModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnticiposModal: React.FC<AnticiposModalProps> = ({ isOpen, onClose }) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const añoActual = hoy.getFullYear();

  // Fecha de depósito: 20 del mes actual
  const fechaDeposito = new Date(añoActual, mesActual - 1, 20); 

  // Montos fijos disponibles
  const montosDisponibles = [300000, 400000, 500000];

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const handleSolicitarAnticipo = () => {
    if (!montoSeleccionado) {
      alert('Por favor selecciona un monto');
      return;
    }

    alert(`¡Solicitud de anticipo por ${formatearMoneda(montoSeleccionado)} enviada con éxito!
           Se depositará el ${formatearFecha(fechaDeposito)}.`);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitud de Anticipo</h2>
            <p className="text-gray-600 text-sm mt-1">Sistema de anticipos salariales para ejecutivos</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold mb-6">Nueva Solicitud de Anticipo</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona el monto del anticipo:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {montosDisponibles.map((monto) => (
                  <button
                    key={monto}
                    onClick={() => setMontoSeleccionado(monto)}
                    className={`p-4 border rounded-lg text-center transition ${
                      montoSeleccionado === monto
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {formatearMoneda(monto)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  💰
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Depósito programado:</strong> {formatearFecha(fechaDeposito)}
                  </p>
                  {montoSeleccionado && (
                    <p className="text-sm text-blue-800 mt-1">
                      Monto a depositar: <span className="font-bold">{formatearMoneda(montoSeleccionado)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSolicitarAnticipo}
                disabled={!montoSeleccionado}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
                  montoSeleccionado
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}>
                {montoSeleccionado
                  ? `Solicitar Anticipo de ${formatearMoneda(montoSeleccionado)}`
                  : 'Selecciona un monto para continuar'
                }
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnticiposModal;