'use client'

import React, { useState } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { useAnticipos } from './hooks/useAnticipos';
import AnticiposModal from './components/AnticiposModal';
import BankInfoModal from './components/BankInfoModal';
import AnticiposHeader from './components/AnticiposHeader';
import AnticiposList from './components/AnticiposList';
import PendientesModal from './components/PendientesModal';
import { SimpleAutoBreadcrumb } from '@/components/ui/SimpleAutoBreadcrumb'

export default function AnticiposPage() {
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const {
    session,
    status,
    sessionLoading,
    sessionError,
    signOut,
    
    anticipos,
    montosDisponibles,
    loading,
    error,
    successMessage,
    checkingAdvance,
    verifyingSession,
    modalAbierto,
    bankModalAbierto,
    
    // NUEVOS ESTADOS PARA EL MODAL DE PENDIENTES
    pendientesModalAbierto,
    pendientesCount,
    
    employeeId,
    advanceInfo,
    periodoActivo, 
    hasCompleteBankInfo,
    
    handleAbrirModal,
    handleManualRefresh,
    actualizarAnticipo,
    eliminarAnticipo,
    
    // NUEVA FUNCIÓN PARA CERRAR MODAL DE PENDIENTES
    setPendientesModalAbierto,
    
    setModalAbierto,
    setBankModalAbierto,
    setSuccessMessage,
    setError,
    fetchAnticipos 
  } = useAnticipos();

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const handleSuccessAnticipo = () => {
    fetchAnticipos(); 
    handleSuccess('✅ Anticipo solicitado exitosamente');
  };

  if (status === 'loading' || sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar onExpandChange={setIsNavExpanded} />
        <div className="transition-all duration-400 ease-in-out">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          </div>
          <div className="p-6 pt-20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {status === 'loading' ? 'Verificando sesión...' : 'Cargando anticipos...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  

  console.log('DEBUG página:', {
    periodoActivo,
    employeeId,
    checkingAdvance,
    verifyingSession,
    montosDisponiblesLength: montosDisponibles?.length
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />
      
      <div className={`transition-all duration-400 ease-in-out ${isNavExpanded ? 'pl-64' : 'pl-3'}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <AnticiposHeader
            employeeId={employeeId}
            advanceInfo={advanceInfo}
            periodoActivo={periodoActivo} 
            verifyingSession={verifyingSession}
            checkingAdvance={checkingAdvance}
            error={error}
            successMessage={successMessage}
            onAbrirModal={handleAbrirModal}
            onManualRefresh={handleManualRefresh}
            onOpenBankModal={() => setBankModalAbierto(true)}
          />
        </div>

        <div className="flex-1 p-6 pt-20">
          <div className="max-w-7xl mx-auto">
            
            <AnticiposList
              anticipos={anticipos}
              montosDisponibles={montosDisponibles}
              loading={loading}
              employeeId={employeeId}
              periodoActivo={periodoActivo} 
              advanceInfo={advanceInfo}
              onOpenBankModal={() => setBankModalAbierto(true)}
              onEditarAnticipo={actualizarAnticipo}
              onEliminarAnticipo={eliminarAnticipo}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>
      </div>

      {/* MODAL PARA SOLICITAR NUEVO ANTICIPO */}
      <AnticiposModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={handleSuccessAnticipo}
        montosDisponibles={montosDisponibles}
      />

      {/* MODAL PARA ACTUALIZAR DATOS BANCARIOS */}
      <BankInfoModal
        isOpen={bankModalAbierto}
        onClose={() => setBankModalAbierto(false)}
        onSuccess={() => {
          handleSuccess('✅ Datos bancarios actualizados correctamente');
        }}
        employeeId={employeeId || ''}
        currentData={{
          hasBankAccount: advanceInfo?.hasBankAccount || false,
          employeeId: employeeId || ''
        }}
      />

      {/* NUEVO MODAL PARA ANTICIPOS PENDIENTES */}
      <PendientesModal
        isOpen={pendientesModalAbierto}
        onClose={() => setPendientesModalAbierto(false)}
        pendientesCount={pendientesCount}
      />
    </div>
  );
}