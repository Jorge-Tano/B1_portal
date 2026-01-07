'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useEnrichedSession } from '@/hooks/use-enriched-session';

interface MontoConfig {
  id: number;
  amount: number;
  descripcion?: string;
  activo?: boolean;
}

interface AnticiposModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeid?: string;
}

type ModalStep = 'select-monto' | 'review-agreement' | 'sign-agreement' | 'confirmation';

const AnticiposModal: React.FC<AnticiposModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeid
}) => {
  const { employeeId: sessionEmployeeId, user } = useEnrichedSession();
  
  const employeeId = employeeid || sessionEmployeeId;

  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<ModalStep>('select-monto');
  const [acuerdoAceptado, setAcuerdoAceptado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anticipoCreado, setAnticipoCreado] = useState<any>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [montosActivos, setMontosActivos] = useState<MontoConfig[]>([]);
  const [cargandoMontos, setCargandoMontos] = useState(false);

  useEffect(() => {
    const obtenerMontos = async () => {
      if (isOpen) {
        setCargandoMontos(true);
        setError(null);
        
        try {
          const response = await fetch('/mis_anticipos/api/montos');
          
          if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const montosFormateados: MontoConfig[] = data.map((item: any, index: number) => ({
              id: item.id || index + 1,
              amount: Number(item.amount) || 0,
              descripcion: item.descripcion || `Anticipo ${index + 1}`,
              activo: true
            }));
            
            const montosValidos = montosFormateados.filter(m => m.amount > 0);
            setMontosActivos(montosValidos);
            
            if (montosValidos.length === 1) {
              setMontoSeleccionado(montosValidos[0].amount);
            }
          } else if (data.error) {
            throw new Error(data.error);
          } else {
            throw new Error('Formato de respuesta inválido');
          }
        } catch (err: any) {
          console.error('❌ Error cargando montos:', err.message || err);
          setError(`Error al cargar montos: ${err.message || 'Intenta nuevamente'}`);
          setMontosActivos([]);
        } finally {
          setCargandoMontos(false);
        }
      }
    };

    obtenerMontos();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-monto');
      setMontoSeleccionado(null);
      setAcuerdoAceptado(false);
      setError(null);
      setAnticipoCreado(null);
      setShowPDFModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStep, isOpen]);

  const handleFinalizar = useCallback(() => {
    onClose();
    
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 100);
    }
  }, [onClose, onSuccess]);

  const getDatosUsuario = useCallback(() => {
    if (!user) return null;

    return {
      id: employeeId || '',
      name: user.name ||
        user.dbUser?.name ||
        user.adUser?.displayName ||
        'Empleado',
      email: user.email ||
        user.dbUser?.email ||
        'No especificado',
      department: user.dbUser?.department ||
        user.adUser?.department ||
        'No especificado'
    };
  }, [user, employeeId]);

  const crearAnticipo = async () => {
    if (!montoSeleccionado || !employeeId) {
      setError('Datos incompletos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usuario = getDatosUsuario();

      const response = await fetch('/mis_anticipos/api/anticipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: montoSeleccionado,
          employeeid: employeeId,
          employeeName: usuario?.name,
          employeeEmail: usuario?.email,
          employeeDepartment: usuario?.department
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const resultado = await response.json();

      setAnticipoCreado({
        id: resultado.id,
        employeeid: resultado.employeeid,
        amount: resultado.amount,
        request_date: resultado.request_date,
        status: resultado.status
      });

      

      setCurrentStep('confirmation');

    } catch (err: any) {
      console.error('❌ Error al crear anticipo:', err);
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = useCallback((monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  }, []);

  const prepararDatosPDF = useCallback(() => {
    const usuario = getDatosUsuario();
    if (!usuario || !montoSeleccionado || !anticipoCreado) return null;

    const hoy = new Date();

    return {
      employee: {
        id: usuario.id,
        name: usuario.name,
        department: usuario.department,
        email: usuario.email,
        date: hoy.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      advance: {
        amount: montoSeleccionado,
        amountText: montoSeleccionado.toLocaleString('es-CL'),
        currency: 'CLP'
      },
      anticipoId: anticipoCreado.id.toString()
    };
  }, [getDatosUsuario, montoSeleccionado, anticipoCreado]);

  if (!isOpen) return null;

  const renderStepContent = () => {
    const usuario = getDatosUsuario();

    switch (currentStep) {
      case 'select-monto':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecciona el monto
              </h3>
              
              {cargandoMontos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 text-sm mt-2">Cargando montos disponibles...</p>
                </div>
              ) : montosActivos.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-600 mb-2">⚠️</div>
                  <p className="text-sm text-yellow-800 font-medium">No hay montos disponibles</p>
                  <p className="text-xs text-yellow-600 mt-1">Contacta con administración para configurar montos</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Elige el monto del anticipo que necesitas
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {montosActivos.map((monto) => (
                      <button
                        key={monto.id}
                        onClick={() => {
                          setMontoSeleccionado(monto.amount);
                          setCurrentStep('review-agreement');
                        }}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${montoSeleccionado === monto.amount
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className="font-bold text-gray-900 text-lg">
                          {formatearMoneda(monto.amount)}
                        </div>
                        {monto.descripcion && (
                          <div className="text-xs text-gray-500 mt-1 truncate">{monto.descripcion}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">CLP</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Información del usuario */}
            {usuario && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Solicitud a nombre de:
                </p>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Nombre:</span> {usuario.name}</p>
                  <p><span className="font-medium">Employee ID:</span> {usuario.id}</p>
                  <p><span className="font-medium">Departamento:</span> {usuario.department}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        );

      case 'review-agreement':
        if (!montoSeleccionado) {
          setCurrentStep('select-monto');
          return null;
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Revisa tu acuerdo
              </h3>
              <button
                onClick={() => setCurrentStep('select-monto')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Cambiar monto
              </button>
            </div>

            {/* Resumen */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-blue-900">Resumen del acuerdo</p>
                <div className="text-lg font-bold text-blue-900">
                  {formatearMoneda(montoSeleccionado)}
                </div>
              </div>
              <div className="text-sm text-blue-700">
                <p className="mb-1"><span className="font-medium">Empleado:</span> {usuario?.name}</p>
                <p><span className="font-medium">Employee ID:</span> {employeeId}</p>
              </div>
            </div>

            {/* Términos del acuerdo */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">ACUERDO DE AUTORIZACIÓN DE DESCUENTO</h4>
              </div>

              <div className="p-4 max-h-60 overflow-y-auto">
                <div className="space-y-4 text-sm text-gray-700">
                  {/* ... contenido del acuerdo (igual que antes) ... */}
                  <div className="text-center text-xs text-gray-500 mb-4">
                    {new Date().toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>

                  <div>
                    <p className="font-medium mb-2">Señores:</p>
                    <p className="font-bold">CALL COMUNICADOS S.A.S</p>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Asunto:</p>
                    <p>Autorización descuento de Salarios, Prestaciones Sociales, Vacaciones, Comisiones y Recargos.</p>
                  </div>

                  <div>
                    <p>
                      Por medio de la presente, me permito suscribir el presente documento, con el fin de <strong>AUTORIZAR</strong> el descuento de los siguientes emolumentos y en la forma que se detalla, por un valor total de <strong>{formatearMoneda(montoSeleccionado)}</strong>, los cuales se deducirán de: 1. Salarios, 2. Prestaciones Sociales, 3. Vacaciones, 4. Comisiones y 6. Recargos.
                    </p>
                  </div>

                  <div>
                    <p>
                      Esta autorización, la realizo con pleno conocimiento de mis facultades y derechos, me veo en la obligación de solicitar este préstamo y por ende esta autorización.
                    </p>
                  </div>

                  {/* Firma del trabajador */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="font-medium">{usuario?.name}</p>
                    <p className="text-xs text-gray-600">Trabajador</p>
                    <p className="text-xs text-gray-600">C.C.: {employeeId}</p>
                    <p className="text-xs text-gray-600 mt-2">CALL COMUNICADOS S.A.S</p>
                  </div>

                  {/* Información de la empresa */}
                  <div className="mt-4 text-xs text-gray-600">
                    <p className="font-bold">CALL COMUNICADOS S.A.S</p>
                    <p>NIT 901.820.169-2</p>
                    <p>Representante Legal</p>
                    <p>Jaime Alberto Zape Alzate</p>
                    <p>C.C.: 70.329.207</p>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Nota Legal:</strong> Este acuerdo será generado como PDF firmado digitalmente y tendrá validez como mensaje de datos según la Ley 527 de 1999.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox de aceptación */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acuerdoAceptado}
                  onChange={(e) => setAcuerdoAceptado(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    He leído, comprendo y ACEPTO los términos del acuerdo de descuento
                  </span>
                  <p className="text-gray-600 mt-1">
                    Al marcar esta casilla, autorizo formalmente el descuento y reconozco que
                    esta acción tiene validez legal como firma digital.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('select-monto')}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ← Volver
              </button>

              <button
                onClick={() => setCurrentStep('sign-agreement')}
                disabled={!acuerdoAceptado}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${acuerdoAceptado
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 'sign-agreement':
        if (!montoSeleccionado) {
          setCurrentStep('select-monto');
          return null;
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Firma del acuerdo
              </h3>
              <p className="text-gray-600">
                Al continuar, generarás el acuerdo firmado digitalmente.
              </p>
            </div>

            {/* Confirmación de datos */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium">👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{usuario?.name}</p>
                  <p className="text-sm text-gray-500">Employee ID: {employeeId}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Monto del anticipo:</span>
                <span className="font-bold text-lg">{formatearMoneda(montoSeleccionado)}</span>
              </div>
            </div>

            {/* Declaración legal */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Declaración:</strong> Al firmar, reconozco que este acuerdo tiene
                validez legal como mensaje de datos y autorizo el descuento en los términos
                establecidos.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('review-agreement')}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ← Atrás
              </button>

              <button
                onClick={crearAnticipo}
                disabled={loading}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Procesando...
                  </span>
                ) : (
                  'Firmar y enviar'
                )}
              </button>
            </div>
          </div>
        );

      case 'confirmation':
        if (!montoSeleccionado || !anticipoCreado) {
          setCurrentStep('select-monto');
          return null;
        }

        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✅</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¡Anticipo solicitado exitosamente!
              </h3>
              <p className="text-gray-600">
                Tu solicitud ha sido registrada y está pendiente de aprobación.
              </p>
            </div>

            {/* Resumen final */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de solicitud:</span>
                  <span className="font-medium">#{anticipoCreado.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-bold">{formatearMoneda(montoSeleccionado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pendiente
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span>{new Date().toLocaleDateString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleFinalizar}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                ✅ Finalizar
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Modal principal con fondo difuminado */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Fondo difuminado - IMPORTANTE: Solo cerrar si no está en confirmación */}
        <div 
          className="fixed inset-0 bg-gray-500/70 backdrop-blur-sm transition-opacity"
          onClick={currentStep === 'confirmation' ? undefined : onClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all">
          {/* Header del modal */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {currentStep === 'select-monto' && 'Solicitar Anticipo'}
                {currentStep === 'review-agreement' && 'Acuerdo de Descuento'}
                {currentStep === 'sign-agreement' && 'Firma Digital'}
                {currentStep === 'confirmation' && 'Solicitud Completada'}
              </h2>
              
              {/* Botón de cerrar - NO mostrar en confirmación */}
              {currentStep !== 'confirmation' ? (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  disabled={loading}
                  aria-label="Cerrar modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <div className="w-8"></div>
              )}
            </div>

            {/* Indicador de progreso */}
            <div className="flex justify-center mb-2">
              <div className="flex items-center">
                {['select-monto', 'review-agreement', 'sign-agreement', 'confirmation'].map((stepName, index) => (
                  <React.Fragment key={stepName}>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep === stepName
                        ? 'bg-blue-600 text-white'
                        : index < ['select-monto', 'review-agreement', 'sign-agreement', 'confirmation'].indexOf(currentStep)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div className={`
                        w-12 h-1
                        ${index < ['select-monto', 'review-agreement', 'sign-agreement', 'confirmation'].indexOf(currentStep)
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                        }
                      `}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Labels de pasos */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className={currentStep === 'select-monto' ? 'font-medium text-blue-600' : ''}>
                Monto
              </span>
              <span className={currentStep === 'review-agreement' ? 'font-medium text-blue-600' : ''}>
                Acuerdo
              </span>
              <span className={currentStep === 'sign-agreement' ? 'font-medium text-blue-600' : ''}>
                Firma
              </span>
              <span className={currentStep === 'confirmation' ? 'font-medium text-blue-600' : ''}>
                Listo
              </span>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {renderStepContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnticiposModal;