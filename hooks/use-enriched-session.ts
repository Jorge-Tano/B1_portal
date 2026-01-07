// hooks/use-enriched-session.ts - VERSIÓN SIN LOOP
"use client";

import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface AdvanceInfo {
  employeeId?: string;
  hasBankAccount: boolean;
  bankAccount?: string;
  bankName?: string;
  bankCode?: string;
  bankNumber?: number;
  lastValidation?: string;
  dbUpdated?: string;
  source?: string;
}

interface SessionUser {
  id?: string;
  email?: string;
  name?: string;
  employeeID?: string;
  adUser?: {
    sAMAccountName?: string;
    employeeID?: string;
    [key: string]: any;
  };
  dbUser?: {
    employeeid?: string;
    advanceInfo?: AdvanceInfo;
    [key: string]: any;
  };
}

export function useEnrichedSession() {
  const { data: session, status, update } = useNextAuthSession();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const hasInitialRefreshDone = useRef(false);
  const isRefreshing = useRef(false);

  const user = useMemo((): SessionUser | null => {
    return session?.user || null;
  }, [session]);

  const employeeId = useMemo((): string | null => {
    if (!user) return null;
    return user.employeeID || user.adUser?.employeeID || user.dbUser?.employeeid || null;
  }, [user]);

  const advanceInfo = useMemo((): AdvanceInfo | null => {
    return user?.dbUser?.advanceInfo || null;
  }, [user]);

  const refreshSession = useCallback(async (force: boolean = false): Promise<boolean> => {
    if (isRefreshing.current && !force) {
      return false;
    }
    
    if (!employeeId) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    isRefreshing.current = true;
    
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId })
      });

      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await signOut({ callbackUrl: '/auth/signin' });
          return false;
        }
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        await update(data.user);
        setLastRefresh(new Date());
        return true;
      }
      
      throw new Error(data.message || 'Respuesta inválida del servidor');
      
    } catch (error: any) {
      console.error("❌ [refreshSession] Error:", error.message);
      setError(error.message || 'Error al refrescar sesión');
      return false;
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, [employeeId, update]);

  const validateBankData = useCallback((): {
    isValid: boolean;
    missingFields: string[];
    canRequestAdvance: boolean;
  } => {
    if (!advanceInfo) {
      return {
        isValid: false,
        missingFields: ['Información no disponible'],
        canRequestAdvance: false
      };
    }
    
    const missingFields: string[] = [];
    
    if (!advanceInfo.hasBankAccount) {
      missingFields.push('Cuenta bancaria no registrada');
    } else {
      if (!advanceInfo.bankAccount) missingFields.push('Número de cuenta incompleto');
      if (!advanceInfo.bankCode && !advanceInfo.bankNumber) {
        missingFields.push('Banco no seleccionado');
      }
    }
    
    const isValid = missingFields.length === 0;
    const canRequestAdvance = isValid && advanceInfo.hasBankAccount;
    
    return {
      isValid,
      missingFields,
      canRequestAdvance
    };
  }, [advanceInfo]);

  useEffect(() => {
    if (status === 'authenticated' && 
        employeeId && 
        !hasInitialRefreshDone.current && 
        !advanceInfo) {
      
      hasInitialRefreshDone.current = true;
      
      const doInitialRefresh = async () => {
        await refreshSession();
      };
      
      doInitialRefresh();
    }
  }, [status, employeeId, advanceInfo]); 

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('📊 [useEnrichedSession] Estado actual:', {
        status,
        employeeId,
        hasAdvanceInfo: !!advanceInfo,
        hasBankAccount: advanceInfo?.hasBankAccount,
        bankAccount: advanceInfo?.bankAccount,
        isLoading
      });
    }
  }, [status, employeeId, advanceInfo, isLoading]);

  return {
    session,
    status,
    user,
    employeeId,
    
    advanceInfo,
    hasCompleteBankInfo: advanceInfo?.hasBankAccount || false,
    
    isLoading,
    error,
    lastRefresh,
    
    update,
    signOut: (options?: any) => signOut(options || { callbackUrl: '/auth/signin' }),
    refreshSession,
    
    validateBankData,
    
    hasRole: (role: string) => user?.dbUser?.role === role,
    isAdmin: () => user?.dbUser?.role === 'admin',
    canRequestAdvance: () => validateBankData().canRequestAdvance
  };
}

export default useEnrichedSession;