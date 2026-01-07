'use client'

import React from 'react';
import AnticipoCard from './AnticipoCard';
import { Anticipo } from '../utils/types';

// Componentes de Iconos SVG
const MoneyIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
  </svg>
);

const DocumentIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
  </svg>
);

const ClockIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
  </svg>
);

const BankIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
    <path fillRule="evenodd" d="M20.25 10.332H3.75V15a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0v-4.418ZM4.25 19.5a.75.75 0 0 1 .75-.75h.75v-3.375a.75.75 0 0 1 1.5 0V18.75h6v-3.375a.75.75 0 0 1 1.5 0V18.75h.75a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const UserIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PlusCircleIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
  </svg>
);

interface AnticiposListProps {
  anticipos: Anticipo[];
  montosDisponibles: { id: number; monto: number; activo: boolean }[];
  loading: boolean;
  employeeId?: string;
  estaEnPeriodoSolicitud: boolean;
  advanceInfo?: any;
  onOpenBankModal: () => void;
  onEditarAnticipo: (id: number, monto: number) => Promise<void>;
  onEliminarAnticipo: (id: number) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onNewRequest?: () => void;
}

export default function AnticiposList({
  anticipos,
  montosDisponibles,
  loading,
  employeeId,
  estaEnPeriodoSolicitud,
  advanceInfo,
  onOpenBankModal,
  onEditarAnticipo,
  onEliminarAnticipo,
  onSuccess,
  onError,
  onNewRequest
}: AnticiposListProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center items-center">
          <SpinnerIcon />
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando anticipos...</p>
      </div>
    );
  }

  if (anticipos.length === 0) {
    return (
      <EmptyState
        employeeId={employeeId}
        estaEnPeriodoSolicitud={estaEnPeriodoSolicitud}
        hasBankAccount={advanceInfo?.hasBankAccount}
        onOpenBankModal={onOpenBankModal}
        onNewRequest={onNewRequest}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <ListHeader anticipos={anticipos} onNewRequest={onNewRequest} />
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {anticipos.map((anticipo, index) => (
          <AnticipoCard
            key={anticipo.id}
            anticipo={anticipo}
            index={index}
            montosDisponibles={montosDisponibles}
            onEditar={onEditarAnticipo}
            onEliminar={onEliminarAnticipo}
            onSuccess={onSuccess}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}

const ListHeader = ({ anticipos, onNewRequest }: { anticipos: Anticipo[], onNewRequest?: () => void }) => {
  const pdfCount = anticipos.filter(a => a.pdf_url).length;
  
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MoneyIcon className="text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Mis Solicitudes</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {anticipos.length} solicitud{anticipos.length !== 1 ? 'es' : ''}
              </span>
              {pdfCount > 0 && (
                <div className="flex items-center gap-1">
                  <DocumentIcon className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {pdfCount} con PDF
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-xs">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {onNewRequest && (
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ 
  employeeId, 
  estaEnPeriodoSolicitud, 
  hasBankAccount, 
  onOpenBankModal,
  onNewRequest
}: {
  employeeId?: string;
  estaEnPeriodoSolicitud: boolean;
  hasBankAccount?: boolean;
  onOpenBankModal: () => void;
  onNewRequest?: () => void;
}) => {
  if (!employeeId) {
    return (
      <div className="text-center py-8 px-4">
        <UserIcon className="w-8 h-8 mx-auto mb-3 text-gray-500 dark:text-gray-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Identificando usuario
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Cargando tu información para mostrarte los anticipos disponibles...
        </p>
      </div>
    );
  }

  if (!hasBankAccount) {
    return (
      <div className="text-center py-8 px-4">
        <BankIcon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Configura tu cuenta bancaria
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
          Para solicitar anticipos, primero necesitas registrar tu información bancaria.
        </p>
        <button
          onClick={onOpenBankModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <BankIcon />
          Completar datos bancarios
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-8 px-4">
      <MoneyIcon className="w-8 h-8 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        ¡Solicita tu primer anticipo!
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
        Todavía no has solicitado ningún anticipo. Comienza ahora para acceder a tu salario de manera anticipada.
      </p>
    </div>
  );
};