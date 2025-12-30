// hooks/use-enriched-session.ts - VERSIÓN FINAL CON CORRECCIÓN DE URL
"use client";

import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";

interface AdvanceSessionInfo {
  validated: boolean;
  employeeId: string | null;
  hasBankAccount: boolean | null;
  canRequestAdvance: boolean;
  reasons: string[];
  lastValidation: number | null;
  periodValid: boolean;
}

interface BankInfo {
  bank_account?: string;
  bank_number?: number;
  bank_name?: string;
  has_bank_account: boolean;
}

interface EnrichedSessionReturn {
  session: any;
  status: string;
  update: (data?: any) => Promise<void>;
  refreshing: boolean;
  sessionValidated: boolean;
  advanceInfo: AdvanceSessionInfo;
  refreshDbData: () => Promise<any>;
  validateSession: (force?: boolean) => Promise<boolean>;
  hasRole: (requiredRole: string) => boolean;
  hasCampaignAccess: (campaignId: number) => boolean;
  checkBankAccount: () => Promise<BankInfo | null>;
  canRequestNewAdvance: () => Promise<{
    canRequest: boolean;
    reasons: string[];
    details: AdvanceSessionInfo;
  }>;
  error: string | null;
  clearError: () => void;
  signOut: (options?: any) => Promise<void>;
}

export function useEnrichedSession(): EnrichedSessionReturn {
  const { data: session, status, update } = useNextAuthSession();
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationTimestamp, setValidationTimestamp] = useState<number | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  // 🔐 Obtener employeeId
  const employeeId = useMemo((): string | null => {
    if (!session?.user) return null;
    
    console.log('🔍 Sesión actual:', {
      email: session.user.email,
      adUser: session.user.adUser,
      dbUser: session.user.dbUser
    });
    
    const id = session.user.adUser?.employeeID || 
               session.user.dbUser?.employeeid || 
               session.user.email?.split('@')[0] || 
               null;
    
    console.log('🔍 EmployeeId calculado:', id);
    return id;
  }, [session]);

  // 🔐 Calcular período
  const periodValid = useMemo((): boolean => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const enPeriodo = diaActual >= 15 && diaActual <= 30;
    console.log('📅 Período válido (15-30):', { diaActual, enPeriodo });
    return enPeriodo;
  }, []);

  // 🔐 Info de sesión
  const advanceInfo: AdvanceSessionInfo = useMemo(() => {
    const info = {
      validated: validationTimestamp !== null,
      employeeId,
      hasBankAccount: bankInfo?.has_bank_account || false,
      canRequestAdvance: false,
      reasons: [],
      lastValidation: validationTimestamp,
      periodValid
    };
    
    console.log('🔍 AdvanceInfo actualizado:', info);
    return info;
  }, [validationTimestamp, employeeId, bankInfo, periodValid]);

  // 🔐 Verificar cuenta bancaria - URL CORREGIDA
  const checkBankAccount = useCallback(async (): Promise<BankInfo | null> => {
    if (!employeeId) {
      console.warn('⚠️ No hay employeeId para verificar cuenta bancaria');
      return null;
    }

    try {
      console.log(`🔍 [checkBankAccount] Verificando para employeeId: ${employeeId}`);
      
      // URL CORREGIDA: /ejecutivo/api/user/bank-info
      const url = `/ejecutivo/api/user/bank-info?employeeid=${employeeId}`;
      console.log(`🔍 [checkBankAccount] URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log(`📊 [checkBankAccount] Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [checkBankAccount] Datos recibidos:', data);
        console.log('📊 [checkBankAccount] Campos:', Object.keys(data));
        
        // Procesar datos bancarios
        const bankInfoData: BankInfo = {
          has_bank_account: data.has_bank_account || false,
          bank_account: data.bank_account,
          bank_number: data.bank_number,
          bank_name: data.bank_name || data.bank_name
        };
        
        console.log('🏦 [checkBankAccount] Datos procesados:', {
          hasBankAccount: bankInfoData.has_bank_account,
          cuenta: bankInfoData.bank_account,
          bancoNumero: bankInfoData.bank_number,
          bancoNombre: bankInfoData.bank_name
        });
        
        setBankInfo(bankInfoData);
        return bankInfoData;
        
      } else if (response.status === 404) {
        console.warn('❌ [checkBankAccount] Usuario no encontrado o sin cuenta (404)');
        const defaultInfo: BankInfo = { has_bank_account: false };
        setBankInfo(defaultInfo);
        return defaultInfo;
        
      } else {
        console.error(`❌ [checkBankAccount] Error ${response.status}`);
        try {
          const errorText = await response.text();
          console.error('❌ [checkBankAccount] Error response:', errorText);
        } catch (e) {
          console.error('❌ [checkBankAccount] No se pudo leer error');
        }
        return null;
      }
      
    } catch (err: any) {
      console.error('❌ [checkBankAccount] Error general:', err.message || err);
      return null;
    }
  }, [employeeId]);

  // 🔐 Validar sesión
  const validateSession = useCallback(async (force: boolean = false): Promise<boolean> => {
    console.log(`🔄 [validateSession] Iniciando validación, force: ${force}, status: ${status}`);
    
    // Si no hay sesión, no validar
    if (status !== 'authenticated' || !session?.user) {
      console.log('❌ [validateSession] No hay sesión activa');
      setError('No hay sesión activa');
      return false;
    }

    // Si ya validamos recientemente y no forzamos
    if (!force && validationTimestamp && Date.now() - validationTimestamp < 30000) {
      console.log('✅ [validateSession] Validación reciente, usando cache');
      return true;
    }

    // Validar employeeId
    if (!employeeId) {
      console.log('❌ [validateSession] Usuario no tiene Employee ID');
      setError('Usuario no tiene Employee ID');
      return false;
    }

    try {
      console.log('🔄 [validateSession] Verificando cuenta bancaria...');
      
      // Verificar cuenta bancaria
      const bankData = await checkBankAccount();
      
      if (bankData === null) {
        console.log('❌ [validateSession] Error al verificar datos bancarios');
        setError('Error al verificar datos bancarios');
        return false;
      }
      
      console.log('✅ [validateSession] Datos bancarios:', {
        hasBankAccount: bankData.has_bank_account,
        cuenta: bankData.bank_account,
        banco: bankData.bank_name
      });
      
      setValidationTimestamp(Date.now());
      setError(null);
      console.log('✅ [validateSession] Sesión validada correctamente');
      return true;
      
    } catch (err: any) {
      console.error('❌ [validateSession] Error:', err.message || err);
      setError('Error de conexión al servidor');
      return false;
    }
  }, [status, session, employeeId, validationTimestamp, checkBankAccount]);

  // 🔐 Refrescar datos de la base de datos
  const refreshDbData = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('❌ [refreshDbData] No hay usuario en sesión');
      return null;
    }
    
    console.log('🔄 [refreshDbData] Iniciando refresh...');
    setRefreshing(true);
    
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Validated': 'true'
        },
        body: JSON.stringify({ username: session.user.id })
      });

      console.log(`📊 [refreshDbData] Status: ${response.status}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log('⚠️ [refreshDbData] Sesión expirada durante refresh');
        await signOut({ callbackUrl: '/auth/signin' });
        return null;
      }

      const data = await response.json();
      console.log('📊 [refreshDbData] Respuesta:', data);
      
      if (data.success && data.user) {
        // Actualizar sesión con nuevos datos
        await update({ dbUser: data.user });
        
        // Si hay info de anticipos en la respuesta, actualizarla
        if (data.user.advanceInfo) {
          setValidationTimestamp(Date.now());
          console.log('✅ [refreshDbData] AdvanceInfo actualizado');
        }
        
        // Actualizar info bancaria si viene en la respuesta
        if (data.user.advanceInfo) {
          setBankInfo({
            has_bank_account: data.user.advanceInfo.hasBankAccount || false,
            bank_account: data.user.advanceInfo.bankAccount,
            bank_name: data.user.advanceInfo.bankName
          });
        }
        
        console.log('✅ [refreshDbData] Datos actualizados correctamente');
        return data.user;
      }
      
      console.log('❌ [refreshDbData] Respuesta sin éxito');
      return null;
      
    } catch (error: any) {
      console.error("❌ [refreshDbData] Error:", error.message || error);
      return null;
    } finally {
      setRefreshing(false);
      console.log('🔄 [refreshDbData] Finalizado');
    }
  }, [session, update]);

  // 🔐 Verificar si puede solicitar nuevo anticipo
  const canRequestNewAdvance = useCallback(async () => {
    console.log('🔄 [canRequestNewAdvance] Verificando condiciones...');
    
    const reasons: string[] = [];
    const details: AdvanceSessionInfo = { ...advanceInfo };

    // 1. Verificar sesión básica
    if (status !== 'authenticated') {
      reasons.push('No hay sesión activa');
      console.log('❌ [canRequestNewAdvance] No hay sesión');
    }

    // 2. Verificar employeeId
    if (!employeeId) {
      reasons.push('No se pudo identificar al empleado');
      console.log('❌ [canRequestNewAdvance] No hay employeeId');
    }

    // 3. Verificar período
    if (!periodValid) {
      reasons.push('Período de solicitud: 15-30 de cada mes');
      console.log('❌ [canRequestNewAdvance] Período inválido');
    }

    // 4. Verificar cuenta bancaria
    if (bankInfo?.has_bank_account === false) {
      reasons.push('No tiene cuenta bancaria registrada');
      console.log('❌ [canRequestNewAdvance] Sin cuenta bancaria');
    } else if (bankInfo?.has_bank_account === true) {
      console.log('✅ [canRequestNewAdvance] Cuenta bancaria OK');
    }

    // 5. Verificar si ya tiene anticipos pendientes
    if (employeeId && status === 'authenticated') {
      try {
        const response = await fetch(
          `/ejecutivo/api/ej_anticipos?employeeid=${employeeId}&status=pending`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            reasons.push('Ya tiene anticipos pendientes');
            console.log('❌ [canRequestNewAdvance] Tiene anticipos pendientes:', data.length);
          } else {
            console.log('✅ [canRequestNewAdvance] Sin anticipos pendientes');
          }
        }
      } catch (err) {
        console.warn('⚠️ [canRequestNewAdvance] Error verificando anticipos pendientes:', err);
      }
    }

    const canRequest = reasons.length === 0;
    
    // Actualizar info con resultados
    details.canRequestAdvance = canRequest;
    details.reasons = reasons;

    console.log('📊 [canRequestNewAdvance] Resultado:', {
      canRequest,
      reasons,
      employeeId,
      hasBankAccount: bankInfo?.has_bank_account,
      periodValid
    });

    return {
      canRequest,
      reasons,
      details
    };
  }, [status, employeeId, periodValid, bankInfo, advanceInfo]);

  // 🔐 Función hasRole
  const hasRole = useCallback((requiredRole: string): boolean => {
    const has = session?.user?.dbUser?.role === requiredRole;
    console.log(`🔐 [hasRole] ${requiredRole}: ${has}`);
    return has;
  }, [session]);

  // 🔐 Función hasCampaignAccess
  const hasCampaignAccess = useCallback((campaignId: number): boolean => {
    if (!session?.user?.dbUser) {
      console.log(`🔐 [hasCampaignAccess] No hay dbUser`);
      return false;
    }
    
    if (session.user.dbUser.role === 'admin') {
      console.log(`🔐 [hasCampaignAccess] Admin, acceso permitido a campaña ${campaignId}`);
      return true;
    }
    
    const hasAccess = session.user.dbUser.campaign_id === campaignId;
    console.log(`🔐 [hasCampaignAccess] Campaña ${campaignId}: ${hasAccess}`);
    return hasAccess;
  }, [session]);

  // 🔐 Clear error
  const clearError = () => {
    console.log('🗑️ [clearError] Limpiando error');
    setError(null);
  };

  // 🔐 Verificar sesión automáticamente al cargar
  useEffect(() => {
    console.log(`🔄 [useEffect] Status cambiado: ${status}, employeeId: ${employeeId}`);
    
    if (status === 'authenticated' && employeeId) {
      console.log('🔄 [useEffect] Iniciando validación automática...');
      
      const validate = async () => {
        await validateSession();
      };
      validate();
      
      // Configurar refresco automático cada 5 minutos
      console.log('⏰ [useEffect] Configurando intervalo de 5 minutos');
      const interval = setInterval(() => {
        console.log('🔄 [useEffect] Validación periódica (5 min)...');
        validateSession(true);
      }, 5 * 60 * 1000);

      return () => {
        console.log('🗑️ [useEffect] Limpiando intervalo');
        clearInterval(interval);
      };
      
    } else if (status === 'unauthenticated') {
      console.log('🚫 [useEffect] Sesión no autenticada, limpiando estados');
      setValidationTimestamp(null);
      setBankInfo(null);
      setError(null);
    }
  }, [status, employeeId]); // validateSession no está en dependencias

  // 🔐 Manejar redirección automática en errores de sesión
  useEffect(() => {
    if (error?.includes('Sesión expirada') || error?.includes('No hay sesión activa')) {
      console.log('⚠️ [useEffect] Error de sesión detectado, redirigiendo en 3s...');
      
      const timeout = setTimeout(() => {
        console.log('🔀 [useEffect] Redirigiendo a login...');
        signOut({ callbackUrl: '/auth/signin' });
      }, 3000);

      return () => {
        console.log('🗑️ [useEffect] Limpiando timeout de redirección');
        clearTimeout(timeout);
      };
    }
  }, [error, signOut]);

  // 🔐 Log cuando cambia el bankInfo
  useEffect(() => {
    console.log('🏦 [useEffect] bankInfo actualizado:', bankInfo);
  }, [bankInfo]);

  // 🔐 Log cuando cambia advanceInfo
  useEffect(() => {
    console.log('📊 [useEffect] advanceInfo actualizado:', advanceInfo);
  }, [advanceInfo]);

  return {
    // Estados básicos
    session,
    status,
    update,
    
    // Estados extendidos
    refreshing,
    sessionValidated: validationTimestamp !== null,
    
    // Info específica de anticipos
    advanceInfo,
    
    // Funciones principales
    refreshDbData,
    validateSession,
    
    // Funciones de utilidad
    hasRole,
    hasCampaignAccess,
    
    // Funciones específicas de anticipos
    checkBankAccount,
    canRequestNewAdvance,
    
    // Manejo de errores
    error,
    clearError,
    
    // Cierre de sesión
    signOut: (options?: any) => signOut(options || { callbackUrl: '/auth/signin' })
  };
}