// app/ejecutivo/anticipos/components/BankInfoModal.tsx - CIERRE INMEDIATO
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEnrichedSession } from '@/hooks/use-enriched-session';

interface BankInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bankData: any) => void;
  employeeId: string;
  currentData?: {
    hasBankAccount: boolean;
    employeeId: string;
  };
}

interface BankData {
  bank_account: string;
  bank_number: number;
}

interface Banco {
  id: number;
  code: string;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  user?: any;
  bank_info?: {
    bank_name: string;
    bank_code: string;
  };
}

export default function BankInfoModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  currentData
}: BankInfoModalProps) {
  const { 
    refreshSession, 
    advanceInfo
  } = useEnrichedSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankTypes, setBankTypes] = useState<Banco[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  
  // Refs para control de flujo
  const isProcessingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  const [formData, setFormData] = useState<BankData>({
    bank_account: '',
    bank_number: 0,
  });

  const convertToBankNumber = (bankNumber?: number, bankCode?: string): number => {
    if (bankNumber !== undefined && bankNumber !== null && bankNumber > 0) {
      return bankNumber;
    }
    
    if (bankCode) {
      const parsed = parseInt(bankCode, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    
    return 0;
  };

  // Efecto: Inicializar cuando se abre el modal
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current && !isProcessingRef.current) {
      console.log('🔄 [BankInfoModal] Inicializando modal...');
      
      const bankNumber = convertToBankNumber(advanceInfo?.bankNumber, advanceInfo?.bankCode);
      
      setFormData({
        bank_account: advanceInfo?.bankAccount || '',
        bank_number: bankNumber,
      });
      
      setError(null);
      setProcessStatus('');
      hasInitializedRef.current = true;
    }
    
    // Reset cuando se cierra el modal
    if (!isOpen) {
      hasInitializedRef.current = false;
      isProcessingRef.current = false;
      setError(null);
      setProcessStatus('');
    }
  }, [isOpen]);

  // Efecto: Cargar bancos
  useEffect(() => {
    const fetchBankTypes = async () => {
      if (!isOpen) return;
      if (bankTypes.length > 0) return;
      if (isProcessingRef.current) return;
      
      try {
        setLoadingBanks(true);
        console.log('🏦 [BankInfoModal] Cargando bancos...');
        
        const response = await fetch('/mis_anticipos/api/bancos');
      
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los bancos`);
        }
        
        const result: ApiResponse<Banco[]> = await response.json();
        
        if (result.success && result.data) {
          console.log(`✅ [BankInfoModal] ${result.data.length} bancos cargados`);
          setBankTypes(result.data);
          
          // Establecer banco actual si existe
          const currentBankNumber = convertToBankNumber(advanceInfo?.bankNumber, advanceInfo?.bankCode);
          
          if (currentBankNumber > 0) {
            const currentBank = result.data.find(bank => bank.id === currentBankNumber);
            if (currentBank) {
              console.log('🏦 [BankInfoModal] Banco actual:', currentBank.name);
              setFormData(prev => ({
                bank_account: advanceInfo?.bankAccount || prev.bank_account,
                bank_number: currentBank.id
              }));
            }
          } else if (advanceInfo?.bankCode) {
            const bankByCode = result.data.find(bank => bank.code === advanceInfo.bankCode);
            if (bankByCode) {
              setFormData(prev => ({
                bank_account: advanceInfo?.bankAccount || prev.bank_account,
                bank_number: bankByCode.id
              }));
            }
          }
        } else {
          throw new Error(result.error || 'Error en la respuesta del servidor');
        }
        
      } catch (err: any) {
        console.error('❌ [BankInfoModal] Error cargando bancos:', err);
        setError(`Error: ${err.message}. Contacta al administrador.`);
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBankTypes();
  }, [isOpen, bankTypes.length]);

  // Función para manejar el cambio en el input de número de cuenta
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limitar a 50 caracteres (como especifica el backend)
    const trimmedValue = numericValue.slice(0, 50);
    
    setFormData({ ...formData, bank_account: trimmedValue });
  };

  // Función para prevenir la entrada de caracteres no numéricos
  const handleAccountNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de control: backspace, delete, tab, escape, enter
    if (
      e.key === 'Backspace' || 
      e.key === 'Delete' || 
      e.key === 'Tab' || 
      e.key === 'Escape' || 
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.ctrlKey || 
      e.metaKey
    ) {
      return;
    }
    
    // Permitir solo teclas numéricas
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Función para pegar solo números
  const handleAccountNumberPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Obtener texto pegado
    const pastedText = e.clipboardData.getData('text');
    
    // Filtrar solo números
    const numbersOnly = pastedText.replace(/[^0-9]/g, '');
    
    // Insertar los números en la posición actual del cursor
    const input = e.currentTarget;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = formData.bank_account;
    
    const newValue = currentValue.substring(0, start) + numbersOnly + currentValue.substring(end);
    
    // Limitar a 50 caracteres
    const trimmedValue = newValue.slice(0, 50);
    
    setFormData({ ...formData, bank_account: trimmedValue });
    
    // Ajustar posición del cursor después de la actualización
    setTimeout(() => {
      const newCursorPosition = start + numbersOnly.length;
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (isProcessingRef.current) {
      console.log('⚠️ [BankInfoModal] Ya hay un proceso en curso');
      return;
    }
    
    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    setProcessStatus('Validando datos...');

    try {
      console.log('📤 [BankInfoModal] Iniciando guardado...');
      
      // Validaciones
      if (!formData.bank_account.trim()) {
        throw new Error('El número de cuenta es requerido');
      }

      if (formData.bank_account.length < 5) {
        throw new Error('El número de cuenta debe tener mínimo 5 dígitos');
      }

      if (formData.bank_account.length > 50) {
        throw new Error('El número de cuenta debe tener máximo 50 dígitos');
      }

      if (!formData.bank_number || formData.bank_number <= 0) {
        throw new Error('Debes seleccionar un banco');
      }

      const bancoSeleccionado = bankTypes.find(bank => bank.id === formData.bank_number);
      if (!bancoSeleccionado) {
        throw new Error('El banco seleccionado no es válido');
      }

      const requestData = {
        employeeid: employeeId,
        bank_account: formData.bank_account.trim(),
        bank_number: formData.bank_number
      };

      console.log('📤 [BankInfoModal] Datos a enviar:', requestData);
      setProcessStatus('Guardando datos bancarios...');

      // Guardar en BD
      const response = await fetch('/mis_anticipos/api/bancos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      let result: ApiResponse<any>;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error ${response.status} al guardar datos`);
      }

      console.log('✅ [BankInfoModal] Datos guardados en BD');
      setProcessStatus('Actualizando sesión...');

      // Refrescar sesión
      const refreshSuccess = await refreshSession();
      
      if (!refreshSuccess) {
        throw new Error('No se pudo actualizar la sesión. Intenta recargar la página.');
      }

      console.log('✅ [BankInfoModal] Sesión actualizada - Proceso completado');
      
      // Preparar datos de éxito
      const successData = {
        success: true,
        message: result.message || 'Datos bancarios guardados exitosamente',
        user: result.user,
        bank_info: result.bank_info,
        refreshSuccess,
        processStatus: 'completado',
        hasBankAccount: true,
        bankData: {
          bankAccount: formData.bank_account.trim(),
          bankNumber: formData.bank_number,
          bankName: bancoSeleccionado.name
        }
      };
      
      // CIERRE INMEDIATO - Sin mostrar nada más
      console.log('🚪 [BankInfoModal] Cerrando inmediatamente...');
      onSuccess(successData);
      onClose();

    } catch (err: any) {
      console.error('❌ [BankInfoModal] Error:', err);
      setError(err.message || 'Error desconocido al guardar datos');
      setProcessStatus('Error en el proceso');
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleClose = () => {
    if (isProcessingRef.current) {
      console.log('⚠️ [BankInfoModal] No se puede cerrar durante el proceso');
      return;
    }
    
    console.log('🚪 [BankInfoModal] Cerrando modal manualmente');
    onClose();
  };

  if (!isOpen) return null;

  const initialHasBankAccount = advanceInfo?.hasBankAccount || false;
  const initialBankAccount = advanceInfo?.bankAccount || '';
  const initialBankName = advanceInfo?.bankName || advanceInfo?.bankCode;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {initialHasBankAccount ? 'Actualizar Datos Bancarios' : 'Completar Datos Bancarios'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              disabled={loading}
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {initialHasBankAccount 
              ? 'Actualiza tu información bancaria para recibir anticipos.'
              : 'Para solicitar anticipos, necesitas registrar tu cuenta bancaria.'
            }
          </p>

          {processStatus && (
            <div className={`mb-4 p-3 rounded border ${
              processStatus.includes('Error') 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {loading && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                <p className={`text-sm ${
                  processStatus.includes('Error') 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {processStatus}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {initialHasBankAccount && initialBankAccount && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Datos actuales:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Cuenta:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {initialBankAccount}
                  </span>
                </div>
                {initialBankName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Banco:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {initialBankName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Cuenta *
                </label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={handleAccountNumberChange}
                  onKeyDown={handleAccountNumberKeyDown}
                  onPaste={handleAccountNumberPaste}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ej: 1234567890"
                  required
                  minLength={5}
                  maxLength={50}
                  disabled={loading}
                  aria-label="Número de cuenta bancaria"
                  inputMode="numeric" // Muestra teclado numérico en dispositivos móviles
                  pattern="[0-9]*" // Para validación HTML5
                  title="Solo se permiten números"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mínimo 5 dígitos, máximo 50. Solo números permitidos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banco *
                </label>
                {loadingBanks ? (
                  <div className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                    <div className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Cargando lista de bancos...
                    </span>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.bank_number}
                      onChange={(e) => setFormData({ ...formData, bank_number: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                      disabled={loading || bankTypes.length === 0}
                      aria-label="Seleccionar banco"
                    >
                      <option value="">Selecciona un banco</option>
                      {bankTypes.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {bankTypes.length === 0 && !loadingBanks && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        No se pudieron cargar los bancos. Intenta recargar la página.
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {bankTypes.length} bancos disponibles
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                         rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || bankTypes.length === 0}
                className="px-4 py-2 text-sm font-medium bg-violet-600 text-white 
                         rounded-md hover:bg-violet-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Procesando...
                  </>
                ) : (
                  initialHasBankAccount ? 'Actualizar' : 'Registrar Cuenta'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>
                  ID: <strong className="font-medium text-gray-700 dark:text-gray-300">{employeeId}</strong>
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Estado: <strong className={`font-medium ${
                    initialHasBankAccount 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {initialHasBankAccount ? 'Registrada' : 'Sin cuenta'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}