// app/ejecutivo/anticipos/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useEnrichedSession } from '@/hooks/use-enriched-session';
import { Header } from '@/components/ui/Header';
import AnticiposModal from '@/components/AnticiposModal';
import BankInfoModal from '@/app/ejecutivo/anticipos/components/BankInfoModal'; // Añadir este import
import { NavBar } from '@/components/ui/NavBar';

// Interfaz para datos de la API (inglés)
interface AdvanceAPI {
  id: number;
  employeeid: string;
  amount?: number;
  amount_id?: number;
  request_date: string;
  status: string;
  user_name?: string;
  user_employeeid?: string;
  department?: string;
}

// Interfaz normalizada para UI (español)
interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
}

// Interfaz para datos bancarios
interface BankFormData {
  bank_account: string;
  bank_number: number;
  document_type?: number;
  telephone?: string;
  mobile?: string;
}

const AnticiposPage = () => {
  // 🔐 Usar el hook unificado de sesión
  const {
    session,
    status,
    sessionValidated,
    advanceInfo,
    validateSession,
    canRequestNewAdvance,
    checkBankAccount,
    error: sessionError,
    signOut,
    refreshDbData
  } = useEnrichedSession();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [bankModalAbierto, setBankModalAbierto] = useState(false); // Nuevo estado para modal bancario
  const [editando, setEditando] = useState<number | null>(null);
  const [montoEdit, setMontoEdit] = useState<number>(0);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingAdvance, setCheckingAdvance] = useState(false);
  const [bankInfoComplete, setBankInfoComplete] = useState<boolean>(false); // Estado para info bancaria
  const [bankInfoDetails, setBankInfoDetails] = useState<any>(null); // Detalles bancarios actuales

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const estaEnPeriodoSolicitud = diaActual >= 15 && diaActual <= 30;
  const montosDisponibles = [300000, 400000, 500000];

  // Mapeo de amount_id a montos (si es necesario)
  const mapeoAmountId = {
    1: 300000,
    2: 400000,
    3: 500000
  };

  // 🔍 FUNCIÓN: Validar datos bancarios DESDE LA SESIÓN
  const validateBankInfoFromSession = () => {
    if (!advanceInfo.employeeId) {
      return {
        hasCompleteInfo: false,
        missingFields: ['employeeId'],
        currentData: null
      };
    }

    // Los datos ya están en advanceInfo del hook
    const missingFields: string[] = [];
    
    // Verificar si tiene cuenta bancaria registrada
    if (!advanceInfo.hasBankAccount) {
      missingFields.push('Cuenta bancaria');
    }
    
    // También podríamos verificar otros campos si están en la sesión
    // Nota: advanceInfo ya tiene la propiedad "hasBankAccount" que viene del backend
    // y se calcula con: bank_account IS NOT NULL AND bank_account != '' AND bank_number IS NOT NULL
    
    return {
      hasCompleteInfo: missingFields.length === 0,
      missingFields,
      currentData: {
        hasBankAccount: advanceInfo.hasBankAccount,
        employeeId: advanceInfo.employeeId
      }
    };
  };

  // Función para normalizar datos de API a UI
  const normalizarAnticipo = (apiData: AdvanceAPI): Anticipo => {
    console.log('🔄 Normalizando anticipo:', apiData);
    
    // Determinar el monto: si hay amount, usarlo; si no, buscar por amount_id
    let monto = 0;
    if (apiData.amount !== undefined && apiData.amount !== null) {
      monto = apiData.amount;
    } else if (apiData.amount_id !== undefined && apiData.amount_id !== null) {
      monto = mapeoAmountId[apiData.amount_id as keyof typeof mapeoAmountId] || 0;
    }
    
    // Mapear estados de inglés a español
    let estado = 'Pendiente';
    const statusLower = (apiData.status || '').toLowerCase();
    
    if (statusLower === 'approved') estado = 'Aprobado';
    else if (statusLower === 'rejected') estado = 'Rechazado';
    else if (statusLower === 'pending') estado = 'Pendiente';
    else if (statusLower === 'aprobado') estado = 'Aprobado';
    else if (statusLower === 'rechazado') estado = 'Rechazado';
    else if (statusLower === 'pendiente') estado = 'Pendiente';
    else estado = apiData.status;
    
    console.log(`📊 Estado mapeado: "${apiData.status}" -> "${estado}"`);
    
    return {
      id: apiData.id,
      employeeid: apiData.employeeid || '',
      monto: monto,
      fecha_solicitud: apiData.request_date || new Date().toISOString(),
      estado: estado,
      usuario_nombre: apiData.user_name,
      usuario_employeeid: apiData.user_employeeid,
      departamento: apiData.department
    };
  };

  // 🔐 Handler para abrir modal con validación completa
  const handleAbrirModal = async () => {
    setCheckingAdvance(true);
    setError(null);
    
    try {
      // 1. Validar sesión primero
      const sessionValid = await validateSession();
      if (!sessionValid) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }

      // 2. Validar datos bancarios DESDE LA SESIÓN (sin endpoint extra)
      const bankValidation = validateBankInfoFromSession();
      
      if (!bankValidation.hasCompleteInfo) {
        // Mostrar modal de datos bancarios
        setBankInfoComplete(false);
        setBankModalAbierto(true);
        return;
      }

      // 3. Verificar otras condiciones para anticipo (período, etc.)
      const checkResult = await canRequestNewAdvance();
      
      if (!checkResult.canRequest) {
        // Si tiene cuenta pero otro problema (período, etc.)
        alert(`No puedes solicitar anticipo:\n• ${checkResult.reasons.join('\n• ')}`);
        return;
      }
      
      // 4. Todo OK, abrir modal de anticipo
      setModalAbierto(true);
      
    } catch (err: any) {
      console.error('❌ Error verificando anticipo:', err);
      setError(err.message || 'Error verificando condiciones');
    } finally {
      setCheckingAdvance(false);
    }
  };

  // 🔐 Cargar anticipos usando la sesión validada
  async function fetchAnticipos() {
    if (!sessionValidated || !advanceInfo.employeeId) {
      setError('Sesión no validada. Por favor, recarga la página.');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 INICIO fetchAnticipos');
      setLoading(true);
      setError(null);

      const url = `/ejecutivo/api/ej_anticipos?employeeid=${encodeURIComponent(advanceInfo.employeeId)}`;
      console.log('🔍 URL construida:', url);

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Session-Validated': 'true'
        }
      });

      if (!response.ok) {
        // 🔐 Manejar error de autenticación
        if (response.status === 401 || response.status === 403) {
          // Sesión expirada - validar nuevamente
          const revalidated = await validateSession(true);
          if (!revalidated) {
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          }
          // Reintentar después de revalidar
          return fetchAnticipos();
        }

        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        throw new Error(`Error al obtener anticipos: ${errorMessage}`);
      }

      const data: AdvanceAPI[] = await response.json();
      console.log('📊 Datos recibidos de API:', data);
      console.log('📊 Cantidad de registros:', data.length);
      
      if (data.length > 0) {
        console.log('📊 Primer elemento crudo:', data[0]);
        console.log('📊 Campos disponibles:', Object.keys(data[0]));
      }

      const normalizedData = data.map(normalizarAnticipo);
      console.log('📊 Datos normalizados:', normalizedData);
      setAnticipos(normalizedData);

    } catch (error: any) {
      console.error('❌ Error en fetchAnticipos:', error);
      setError(error.message || 'Error al cargar anticipos');
    } finally {
      setLoading(false);
    }
  }

  // 🔐 Cargar anticipos cuando la sesión esté validada
  useEffect(() => {
    if (sessionValidated && advanceInfo.employeeId) {
      fetchAnticipos();
    }
  }, [sessionValidated, advanceInfo.employeeId]);

  // 🔄 Verificar datos bancarios cuando cambia la sesión
  useEffect(() => {
    if (sessionValidated && advanceInfo.employeeId) {
      const validation = validateBankInfoFromSession();
      setBankInfoComplete(validation.hasCompleteInfo);
      setBankInfoDetails(validation.currentData);
    }
  }, [sessionValidated, advanceInfo]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString);
      return 'Fecha inválida';
    }
  };

  // Colores para estados
  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === 'aprobado' || estadoLower === 'approved') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (estadoLower === 'pendiente' || estadoLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
    if (estadoLower === 'rechazado' || estadoLower === 'rejected') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  // Iconos para estados
  const getEstadoIcon = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === 'aprobado' || estadoLower === 'approved') return '✓';
    if (estadoLower === 'pendiente' || estadoLower === 'pending') return '⏳';
    if (estadoLower === 'rechazado' || estadoLower === 'rejected') return '✗';
    return '?';
  };

  // Función auxiliar para verificar estado
  const estaPendiente = (estado: string): boolean => {
    const estadoLower = estado.toLowerCase();
    return estadoLower === 'pendiente' || estadoLower === 'pending';
  };

  // 🔐 Crear anticipo usando sesión validada
  const crearAnticipo = async (monto: number) => {
    try {
      // Validar sesión antes de proceder
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
      }

      if (!advanceInfo.employeeId) {
        throw new Error('No se pudo identificar al usuario.');
      }

      console.log('📤 Creando anticipo:', { monto, employeeId: advanceInfo.employeeId });

      const response = await fetch('/ejecutivo/api/ej_anticipos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Validated': 'true'
        },
        body: JSON.stringify({
          monto: monto,
          employeeid: advanceInfo.employeeId
        }),
      });

      // 🔐 Manejar error de autenticación
      if (response.status === 401 || response.status === 403) {
        // Forzar revalidación
        await validateSession(true);
        throw new Error('Sesión expirada. Por favor, intenta nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status} al crear anticipo`);
      }

      const result = await response.json();
      console.log('✅ Anticipo creado:', result);

      fetchAnticipos();
      setSuccessMessage('✅ Anticipo solicitado exitosamente. Está pendiente de aprobación.');
      setTimeout(() => setSuccessMessage(null), 4000);
      return result;
    } catch (error: any) {
      console.error('❌ Error al crear anticipo:', error);
      throw error;
    }
  };

  // 🔐 Actualizar anticipo con validación de sesión
  const actualizarAnticipo = async (id: number, monto: number) => {
    try {
      console.log('📝 Actualizando anticipo:', { id, monto, employeeId: advanceInfo.employeeId });

      // Validar sesión antes de proceder
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
      }

      const anticipoEnLista = anticipos.find(a => a.id === id);
      if (anticipoEnLista && !estaPendiente(anticipoEnLista.estado)) {
        throw new Error('Solo puedes editar anticipos que están pendientes');
      }

      const response = await fetch(`/ejecutivo/api/ej_anticipos?id=${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Validated': 'true'
        },
        body: JSON.stringify({
          monto: monto,
          employeeid: advanceInfo.employeeId
        }),
      });

      console.log('Response status:', response.status);

      // 🔐 Manejar error de autenticación
      if (response.status === 401 || response.status === 403) {
        await validateSession(true);
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(errorData.error || `Error ${response.status} al actualizar`);
      }

      const result = await response.json();
      console.log('✅ Anticipo actualizado:', result);

      fetchAnticipos();
      setSuccessMessage('Anticipo actualizado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      return result;
    } catch (error: any) {
      console.error('❌ Error al actualizar anticipo:', error);
      throw error;
    }
  };

  // 🔐 Eliminar anticipo con validación de sesión
  const eliminarAnticipo = async (id: number, estado: string) => {
    try {
      // Validar sesión antes de proceder
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
      }

      if (!estaPendiente(estado)) {
        throw new Error('No puedes eliminar un anticipo que ya ha sido aprobado o rechazado');
      }

      console.log('🗑️ Eliminando anticipo:', { id, employeeId: advanceInfo.employeeId });

      const response = await fetch(`/ejecutivo/api/ej_anticipos?id=${id}&employeeid=${advanceInfo.employeeId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Validated': 'true'
        }
      });

      console.log('Response status:', response.status);

      // 🔐 Manejar error de autenticación
      if (response.status === 401 || response.status === 403) {
        await validateSession(true);
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(errorData.error || `Error ${response.status} al eliminar`);
      }

      const result = await response.json();
      console.log('✅ Anticipo eliminado:', result);

      fetchAnticipos();
      setSuccessMessage('Anticipo eliminado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      return result;
    } catch (error: any) {
      console.error('❌ Error al eliminar anticipo:', error);
      throw error;
    }
  };

  // Handler de edición
  const handleEditar = async (anticipo: Anticipo) => {
    console.log('🔄 handleEditar llamado con:', anticipo);
    
    if (editando === anticipo.id) {
      try {
        if (!estaPendiente(anticipo.estado)) {
          alert('Solo puedes editar anticipos que están pendientes');
          setEditando(null);
          setMontoEdit(0);
          return;
        }

        await actualizarAnticipo(anticipo.id, montoEdit);
        setEditando(null);
        setMontoEdit(0);
      } catch (error: any) {
        console.error('❌ Error en handleEditar:', error);
        alert(error.message || 'Error al actualizar');
      }
    } else {
      if (!estaPendiente(anticipo.estado)) {
        alert('Solo puedes editar anticipos que están pendientes');
        return;
      }
      setMontoEdit(anticipo.monto);
      setEditando(anticipo.id);
    }
  };

  // Handler de eliminación
  const handleEliminar = async (anticipo: Anticipo) => {
    console.log('🗑️ handleEliminar llamado con:', anticipo);
    
    if (!estaPendiente(anticipo.estado)) {
      alert('Solo puedes eliminar anticipos que están pendientes');
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este anticipo?')) {
      try {
        await eliminarAnticipo(anticipo.id, anticipo.estado);
      } catch (error: any) {
        console.error('❌ Error en handleEliminar:', error);
        alert(error.message || 'Error al eliminar');
      }
    }
  };

  // 🔄 Handler para éxito del modal bancario
  const handleBankInfoSuccess = async (updatedData: any) => {
    console.log('✅ Datos bancarios actualizados:', updatedData);
    
    // Forzar actualización de la sesión
    await validateSession(true);
    
    // Opcional: también refrescar datos de la BD
    await refreshDbData();
    
    // Cerrar modal bancario
    setBankModalAbierto(false);
    setBankInfoComplete(true);
    
    // Mostrar mensaje de éxito
    setSuccessMessage('✅ Datos bancarios actualizados correctamente');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Intentar abrir modal de anticipo automáticamente
    setTimeout(() => {
      handleAbrirModal();
    }, 1000);
  };

  const montosParaCambiar = (montoActual: number) =>
    montosDisponibles.filter(m => m !== montoActual);

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3';

  // 🔐 Estados de carga/error de sesión
  if (status === 'loading' || (status === 'authenticated' && !sessionValidated && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar onExpandChange={setIsNavExpanded} />
        <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <Header isNavExpanded={isNavExpanded} />
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

  // 🔐 Estado sin sesión válida
  if (status === 'unauthenticated' || !session?.user || sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar onExpandChange={setIsNavExpanded} />
        <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <Header isNavExpanded={isNavExpanded} />
          </div>
          <div className="p-6 pt-20 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {sessionError ? 'Error de sesión' : 'Sesión requerida'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {sessionError || 'Debes iniciar sesión para acceder a los anticipos.'}
              </p>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin?callbackUrl=/ejecutivo/anticipos' })}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Ir al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="flex-1 p-6 pt-20">
          <div className="max-w-7xl mx-auto">
            {/* Header de la página */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Mis Anticipos
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      sessionValidated 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {sessionValidated ? '✅ Sesión activa' : '⚠️ Verificando sesión'}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      advanceInfo.hasBankAccount 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {advanceInfo.hasBankAccount ? '🏦 Cuenta registrada' : '🏦 Sin cuenta bancaria'}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      estaEnPeriodoSolicitud 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {estaEnPeriodoSolicitud ? '📅 Período activo' : '📅 Período inactivo'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleAbrirModal}
                  disabled={!estaEnPeriodoSolicitud || !advanceInfo.employeeId || !sessionValidated || checkingAdvance}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    estaEnPeriodoSolicitud && advanceInfo.employeeId && sessionValidated && !checkingAdvance
                      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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
              </div>

              {/* Mensajes de estado */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Información del período */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {estaEnPeriodoSolicitud
                      ? '✅ Período activo (15-30)'
                      : '⏳ Período inactivo'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Employee ID: <span className="font-medium">{advanceInfo.employeeId || '--'}</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Cuenta: <span className="font-medium">
                      {advanceInfo.hasBankAccount ? 'Registrada' : 'No registrada'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Anticipos</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{anticipos.length}</p>
                  </div>
                  <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Estado</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {advanceInfo.employeeId ? (estaEnPeriodoSolicitud ? 'Activo' : 'Inactivo') : '--'}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Datos Bancarios</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {advanceInfo.hasBankAccount ? 'Completos' : 'Incompletos'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    advanceInfo.hasBankAccount 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      advanceInfo.hasBankAccount 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de anticipos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Mis Solicitudes</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {anticipos.length} solicitud{anticipos.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {anticipos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {advanceInfo.employeeId ? 'No tienes anticipos' : 'Esperando identificación'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {advanceInfo.employeeId
                      ? (estaEnPeriodoSolicitud
                        ? (advanceInfo.hasBankAccount
                          ? 'Solicita tu primer anticipo'
                          : 'Completa tus datos bancarios primero')
                        : 'Período: 15-30 de cada mes')
                      : 'Cargando usuario...'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {anticipos.map((anticipo, index) => (
                    <div key={anticipo.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        {/* Columna izquierda: Número y fecha */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${estaPendiente(anticipo.estado) ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                            anticipo.estado.toLowerCase() === 'aprobado' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                              'bg-gray-50 dark:bg-gray-700'
                            }`}>
                            <span className={`text-sm font-bold ${estaPendiente(anticipo.estado) ? 'text-yellow-700 dark:text-yellow-400' :
                              anticipo.estado.toLowerCase() === 'aprobado' ? 'text-emerald-700 dark:text-emerald-400' :
                                'text-gray-700 dark:text-gray-400'
                              }`}>
                              {getEstadoIcon(anticipo.estado)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                Anticipo #{index + 1}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(anticipo.estado)} flex-shrink-0`}>
                                {anticipo.estado}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {formatDateTime(anticipo.fecha_solicitud)}
                              </p>
                            </div>
                          </div>
                        </div>
                                         
                        {/* Columna derecha: Monto y acciones */}
                        <div className="flex items-center gap-3">
                          {/* Monto */}
                          <div className="text-right">
                            <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(anticipo.monto)}
                              </p>
                            </div>
                          </div>

                          {/* Acciones - Solo mostrar si está pendiente */}
                          <div className="flex items-center gap-1">
                            {estaPendiente(anticipo.estado) ? (
                              <>
                                {editando === anticipo.id ? (
                                  <>
                                    <button
                                      onClick={() => handleEditar(anticipo)}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                                      title="Guardar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditando(null);
                                        setMontoEdit(0);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                      title="Cancelar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditar(anticipo)}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                      title="Editar monto"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleEliminar(anticipo)}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                      title="Eliminar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2">
                                {anticipo.estado.toLowerCase() === 'aprobado'
                                  ? 'Aprobado ✅'
                                  : 'Revisión requerida'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Opciones de edición (solo cuando está editando) */}
                      {editando === anticipo.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar nuevo monto:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {montosParaCambiar(anticipo.monto).map((monto) => (
                              <button
                                key={monto}
                                onClick={() => setMontoEdit(monto)}
                                className={`p-2 border rounded text-center transition-all text-sm ${montoEdit === monto
                                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 text-gray-700 dark:text-gray-300'
                                  }`}
                              >
                                {formatCurrency(monto)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de anticipo existente */}
      <AnticiposModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={() => fetchAnticipos()}
        employeeid={advanceInfo.employeeId || ''}
        crearAnticipo={crearAnticipo}
        sessionValidated={sessionValidated}
      />
      
      {/* Nuevo modal para datos bancarios */}
      <BankInfoModal
        isOpen={bankModalAbierto}
        onClose={() => {
          setBankModalAbierto(false);
          setBankInfoComplete(false);
        }}
        onSuccess={handleBankInfoSuccess}
        employeeId={advanceInfo.employeeId || ''}
        currentData={bankInfoDetails}
      />
    </div>
  );
};

export default AnticiposPage;