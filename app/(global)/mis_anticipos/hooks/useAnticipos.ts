// app/(global)/mis_anticipos/hooks/useAnticipos.ts
import { useState, useEffect, useCallback } from 'react';
import { useEnrichedSession } from '@/hooks/use-enriched-session';
import { normalizeAdvance } from '../utils/formatters';
import { Anticipo, AdvanceAPI, BankInfo, MontoConfig } from '../utils/types';
import { estaEnPeriodoSolicitud, PERIODO_SOLICITUD } from '../utils/constants';

export const useAnticipos = () => {
    const {
        session,
        status,
        employeeId,
        advanceInfo,
        refreshSession,
        validateBankData,
        isLoading: sessionLoading,
        error: sessionError,
        signOut,
        hasCompleteBankInfo
    } = useEnrichedSession();

    console.log('useAnticipos - Datos de sesión:', {
        status,
        employeeId,
        sessionUser: session?.user,
        sessionLoading,
        hasCompleteBankInfo
    });

    const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
    const [montosDisponibles, setMontosDisponibles] = useState<MontoConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMontos, setLoadingMontos] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [checkingAdvance, setCheckingAdvance] = useState(false);
    const [verifyingSession, setVerifyingSession] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [bankModalAbierto, setBankModalAbierto] = useState(false);
    const [pendientesModalAbierto, setPendientesModalAbierto] = useState(false);
    const [pendientesCount, setPendientesCount] = useState<number>(0);
    const periodoActivo = estaEnPeriodoSolicitud();

    const fetchMontosDisponibles = useCallback(async () => {
        try {
            setLoadingMontos(true);
            console.log('🔄 [useAnticipos] Solicitando montos desde API...');

            const response = await fetch('/mis_anticipos/api/montos', {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('📊 [useAnticipos] Response montos status:', response.status);

            if (!response.ok) {
                console.error(`❌ [useAnticipos] API devolvió ${response.status}`);
                setError('Error cargando montos disponibles desde la base de datos');
                setMontosDisponibles([]);
                return;
            }

            const data: any[] = await response.json();
            console.log(`📦 [useAnticipos] Datos crudos recibidos de API:`, data);
            
            // 🔍 DEBUG: Verificar estructura de datos
            if (data.length > 0) {
                console.log('🔍 [useAnticipos] Estructura del primer item:', {
                    keys: Object.keys(data[0]),
                    valores: data[0]
                });
            }
            
            // ✅ CORRECCIÓN: La API devuelve objetos con 'amount' y 'id', no 'monto'
            const montosNormalizados: MontoConfig[] = data
                .filter(item => {
                    // Filtrar items válidos
                    if (!item || typeof item !== 'object') return false;
                    
                    // Verificar que tenga 'amount' o 'monto'
                    const tieneAmount = item.amount !== undefined && item.amount !== null;
                    const tieneMonto = item.monto !== undefined && item.monto !== null;
                    
                    if (!tieneAmount && !tieneMonto) {
                        console.warn('⚠️ [useAnticipos] Item sin amount ni monto:', item);
                        return false;
                    }
                    
                    return true;
                })
                .map((item, index) => {
                    // Determinar el valor del monto (preferir 'amount' que es lo que devuelve la API)
                    let valorMonto: number;
                    
                    if (item.amount !== undefined && item.amount !== null) {
                        // La API devuelve 'amount'
                        valorMonto = typeof item.amount === 'string' 
                            ? parseFloat(item.amount) 
                            : Number(item.amount);
                    } else if (item.monto !== undefined && item.monto !== null) {
                        // Por si acaso también viene 'monto'
                        valorMonto = typeof item.monto === 'string' 
                            ? parseFloat(item.monto) 
                            : Number(item.monto);
                    } else {
                        valorMonto = 0;
                    }
                    
                    // Validar que el monto sea un número válido y positivo
                    if (isNaN(valorMonto) || valorMonto <= 0) {
                        console.warn(`⚠️ [useAnticipos] Monto inválido en item ${index}:`, item);
                        valorMonto = 0;
                    }
                    
                    return {
                        id: Number(item.id) || index + 1,
                        monto: valorMonto,
                        activo: item.activo !== false // Si no tiene campo activo, asumir true
                    };
                })
                .filter(item => item.monto > 0); // Solo incluir montos válidos

            console.log(`✅ [useAnticipos] ${montosNormalizados.length} montos normalizados:`, 
                montosNormalizados.map(m => ({ id: m.id, monto: m.monto }))
            );

            setMontosDisponibles(montosNormalizados);

        } catch (error: any) {
            console.error('❌ [useAnticipos] Error cargando montos:', error.message);
            setError('Error de conexión al cargar montos disponibles');
            setMontosDisponibles([]);
        } finally {
            setLoadingMontos(false);
        }
    }, []);

    const fetchAnticipos = useCallback(async () => {
        console.log('🔍 [useAnticipos] fetchAnticipos iniciando con employeeId:', employeeId);

        if (!employeeId) {
            console.warn('❌ [useAnticipos] employeeId es null/undefined');
            setError('No se pudo identificar al usuario.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const url = `/mis_anticipos/api/anticipos?employeeid=${encodeURIComponent(employeeId)}`;
            console.log('🌐 [useAnticipos] Solicitando anticipos a:', url);

            const response = await fetch(url, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('📊 [useAnticipos] Response status anticipos:', response.status);

            if (!response.ok) {
                let errorDetails = `Error ${response.status}`;
                try {
                    const textResponse = await response.text();
                    console.error('❌ [useAnticipos] Error response:', textResponse.substring(0, 500));
                    
                    if (textResponse.includes('<!DOCTYPE html>')) {
                        errorDetails = `Error ${response.status}: Endpoint API devolvió HTML. Verifica que la ruta exista.`;
                    } else {
                        try {
                            const errorData = JSON.parse(textResponse);
                            errorDetails = errorData.error || errorData.message || errorDetails;
                        } catch {
                            errorDetails = `Error ${response.status}: ${textResponse.substring(0, 100)}`;
                        }
                    }
                } catch (e) {
                    console.error('❌ [useAnticipos] No se pudo obtener respuesta:', e);
                }
                throw new Error(errorDetails);
            }

            const data: AdvanceAPI[] = await response.json();
            console.log(`✅ [useAnticipos] ${data.length} anticipos cargados desde API`);

            if (data.length > 0) {
                console.log('📋 [useAnticipos] Estructura del primer anticipo:', {
                    id: data[0].id,
                    employeeid: data[0].employeeid,
                    amount: data[0].amount,
                    monto: data[0].monto,
                    status: data[0].status,
                    tipos: {
                        amountTipo: typeof data[0].amount,
                        montoTipo: typeof data[0].monto
                    }
                });
            }

            const anticiposNormalizados = data.map(item => {
                const normalizado = normalizeAdvance(item);
                console.log('🔄 [useAnticipos] Anticipo normalizado:', {
                    id: normalizado.id,
                    monto: normalizado.monto,
                    tipoMonto: typeof normalizado.monto,
                    estado: normalizado.estado
                });
                return normalizado;
            });

            console.log('✅ [useAnticipos] Anticipos normalizados listos:', anticiposNormalizados);
            setAnticipos(anticiposNormalizados);

        } catch (error: any) {
            console.error('❌ [useAnticipos] Error completo cargando anticipos:', error.message);
            setError(`Error: ${error.message || 'Error al cargar anticipos'}`);
            setAnticipos([]);
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    const cargarDatosIniciales = useCallback(async () => {
        try {
            console.log('🚀 [useAnticipos] Cargando datos iniciales...');
            await Promise.all([
                fetchAnticipos(),
                fetchMontosDisponibles()
            ]);
        } catch (error) {
            console.error('❌ [useAnticipos] Error cargando datos iniciales:', error);
        }
    }, [fetchAnticipos, fetchMontosDisponibles]);

    const verifyAndUpdateSession = useCallback(async () => {
        if (verifyingSession) return;

        setVerifyingSession(true);
        try {
            console.log('🔄 [useAnticipos] Actualizando sesión...');
            await refreshSession();
            validateBankData();
        } catch (error) {
            console.error('❌ [useAnticipos] Error verificando sesión:', error);
        } finally {
            setVerifyingSession(false);
        }
    }, [refreshSession, validateBankData, verifyingSession]);

    const handleAbrirModal = useCallback(async () => {
        console.log('🎯 [useAnticipos] handleAbrirModal iniciando...');
        setCheckingAdvance(true);
        setError(null);

        try {
            if (status !== 'authenticated' || !session?.user) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                return;
            }

            const bankValidation = validateBankData();
            console.log('🔍 [useAnticipos] Validación bancaria:', bankValidation);
            
            if (!bankValidation.canRequestAdvance) {
                setBankModalAbierto(true);
                return;
            }

            if (!periodoActivo) {
                alert(`Solo puedes solicitar anticipos del ${PERIODO_SOLICITUD.INICIO} al ${PERIODO_SOLICITUD.FIN} de cada mes`);
                return;
            }

            if (employeeId) {
                const response = await fetch(`/mis_anticipos/api/anticipos?employeeid=${employeeId}&status=Pendiente`);
                console.log('📊 [useAnticipos] Response pendientes status:', response.status);
                
                if (response.ok) {
                    const pendientes = await response.json();
                    if (pendientes.length > 0) {
                        // Mostrar modal en lugar de alerta
                        setPendientesCount(pendientes.length);
                        setPendientesModalAbierto(true);
                        return;
                    }
                } else {
                    console.warn('⚠️ [useAnticipos] No se pudo verificar anticipos pendientes');
                }
            }

            setModalAbierto(true);
        } catch (err: any) {
            console.error('❌ [useAnticipos] Error en handleAbrirModal:', err);
            setError(err.message || 'Error verificando condiciones');
        } finally {
            setCheckingAdvance(false);
        }
    }, [status, session, validateBankData, periodoActivo, employeeId]);

    const handleManualRefresh = useCallback(async () => {
        try {
            setSuccessMessage('Actualizando datos de sesión...');
            await refreshSession();
            await fetchAnticipos();
            await fetchMontosDisponibles();
            setSuccessMessage('Datos actualizados correctamente');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('❌ [useAnticipos] Error en manual refresh:', error);
            setError('Error actualizando datos');
        }
    }, [refreshSession, fetchAnticipos, fetchMontosDisponibles]);

    const actualizarAnticipo = useCallback(async (id: number, monto: number) => {
        try {
            console.log('✏️ [useAnticipos] Actualizando anticipo:', { id, monto });
            
            const response = await fetch(`/mis_anticipos/api/anticipos?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto, employeeid: employeeId })
            });

            console.log('📊 [useAnticipos] Response PUT status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ [useAnticipos] Error PUT response:', errorData);
                throw new Error(errorData.error || errorData.message || `Error ${response.status} al actualizar`);
            }

            const result = await response.json();
            console.log('✅ [useAnticipos] PUT result:', result);

            await fetchAnticipos();
            
            setSuccessMessage('Anticipo actualizado exitosamente');
            setTimeout(() => setSuccessMessage(null), 3000);
            
            return result;
        } catch (error: any) {
            console.error('❌ [useAnticipos] Error en actualizarAnticipo:', error);
            throw error;
        }
    }, [employeeId, fetchAnticipos]);

    const eliminarAnticipo = useCallback(async (id: number) => {
        try {
            console.log('🗑️ [useAnticipos] Eliminando anticipo:', { id });
            
            const response = await fetch(`/mis_anticipos/api/anticipos?id=${id}&employeeid=${employeeId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('📊 [useAnticipos] Response DELETE status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ [useAnticipos] Error DELETE response:', errorData);
                throw new Error(errorData.error || errorData.message || `Error ${response.status} al eliminar`);
            }

            const result = await response.json();
            console.log('✅ [useAnticipos] DELETE result:', result);

            await fetchAnticipos();
            
            setSuccessMessage('Anticipo eliminado exitosamente');
            setTimeout(() => setSuccessMessage(null), 3000);
            
            return result;
        } catch (error: any) {
            console.error('❌ [useAnticipos] Error en eliminarAnticipo:', error);
            throw error;
        }
    }, [employeeId, fetchAnticipos]);

    const getMontosParaCambiar = useCallback((montoActual: number) => {
        const montoActualNum = Number(montoActual);
        const montos = montosDisponibles
            .filter(monto => {
                const montoNum = Number(monto.monto);
                return montoNum !== montoActualNum && monto.activo;
            })
            .map(monto => Number(monto.monto));
        
        console.log('🔢 [useAnticipos] getMontosParaCambiar:', {
            montoActual: montoActualNum,
            disponibles: montosDisponibles.length,
            filtrados: montos.length,
            valores: montos
        });
        
        return montos;
    }, [montosDisponibles]);

    useEffect(() => {
        console.log('⚡ [useAnticipos] useEffect [employeeId, status]:', { employeeId, status });
        
        if (employeeId && status === 'authenticated') {
            cargarDatosIniciales();
        } else if (status === 'unauthenticated') {
            console.log('🔒 [useAnticipos] Usuario no autenticado');
            setLoading(false);
            setAnticipos([]);
            setMontosDisponibles([]);
        } else if (status === 'loading') {
            console.log('⏳ [useAnticipos] Cargando sesión...');
        }
    }, [employeeId, status, cargarDatosIniciales]);

    useEffect(() => {
        console.log('⚡ [useAnticipos] useEffect [status, employeeId, advanceInfo]:', {
            status,
            employeeId,
            hasAdvanceInfo: !!advanceInfo
        });
        
        if (status === 'authenticated' && employeeId && !advanceInfo) {
            verifyAndUpdateSession();
        }
    }, [status, employeeId, advanceInfo, verifyAndUpdateSession]);

    return {
        session,
        status,
        employeeId,
        advanceInfo: advanceInfo as BankInfo,
        sessionLoading,
        sessionError,
        signOut,
        hasCompleteBankInfo,

        anticipos,
        montosDisponibles,
        loading: loading || loadingMontos,
        loadingMontos,
        error,
        successMessage,
        checkingAdvance,
        verifyingSession,

        modalAbierto,
        bankModalAbierto,
        pendientesModalAbierto,
        pendientesCount,
        periodoActivo,

        fetchAnticipos,
        fetchMontosDisponibles,
        handleAbrirModal,
        handleManualRefresh,
        actualizarAnticipo,
        eliminarAnticipo,
        getMontosParaCambiar,

        setModalAbierto,
        setBankModalAbierto,
        setPendientesModalAbierto,
        setSuccessMessage,
        setError
    };
};