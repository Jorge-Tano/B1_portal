'use client'

import React from 'react';
import { Header } from '@/components/ui/Header';
import { BankInfo } from '../utils/types';
import { getTextoPeriodo } from '../utils/constants';
import { SimpleAutoBreadcrumb } from '@/components/ui/SimpleAutoBreadcrumb'


interface AnticiposHeaderProps {
  employeeId?: string;
  advanceInfo?: BankInfo;
  periodoActivo: boolean;
  verifyingSession: boolean;
  checkingAdvance: boolean;
  error: string | null;
  successMessage: string | null;
  onAbrirModal: () => void;
  onManualRefresh: () => void;
  onOpenBankModal: () => void;
}

export default function AnticiposHeader({
  employeeId,
  advanceInfo,
  periodoActivo,
  verifyingSession,
  checkingAdvance,
  error,
  successMessage,
  onAbrirModal,
  onManualRefresh,
  onOpenBankModal
}: AnticiposHeaderProps) {
  return (
    <>
      <Header isNavExpanded={false} />
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis Anticipos</h1>
            
          </div>
          
          <div className="flex items-center gap-3">
            <SolicitarButton
              periodoActivo={periodoActivo} 
              employeeId={employeeId}
              checkingAdvance={checkingAdvance}
              verifyingSession={verifyingSession}
              onAbrirModal={onAbrirModal}
            />
          </div>
          
        </div>
        <SimpleAutoBreadcrumb />
      </div>
    </>
  );
}

const Badge = ({ children, variant = 'neutral', icon }: { 
  children: React.ReactNode; 
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: string;
}) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};

const Alert = ({ type, message }: { type: 'error' | 'success'; message: string }) => {
  const config = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      icon: '⚠️'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: '✅'
    }
  };

  const { bg, border, text, icon } = config[type];

  return (
    <div className={`mb-4 p-3 ${bg} border ${border} rounded-lg`}>
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0">{icon}</span>
        <p className={`text-sm ${text}`}>{message}</p>
      </div>
    </div>
  );
};



const SolicitarButton = ({
  periodoActivo, 
  employeeId,
  checkingAdvance,
  verifyingSession,
  onAbrirModal
}: {
  periodoActivo: boolean; 
  employeeId?: string;
  checkingAdvance: boolean;
  verifyingSession: boolean;
  onAbrirModal: () => void;
}) => {
  const disabled = !periodoActivo || !employeeId || checkingAdvance || verifyingSession;
  
  console.log('DEBUG SolicitarButton:', {
    periodoActivo,
    employeeId,
    checkingAdvance,
    verifyingSession,
    disabled,
    fechaActual: new Date().getDate()
  });
  
  return (
    <button
      onClick={onAbrirModal}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
        disabled
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
      }`}
    >
      {checkingAdvance ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Verificando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Solicitar Anticipo
        </>
      )}
    </button>
  );
};