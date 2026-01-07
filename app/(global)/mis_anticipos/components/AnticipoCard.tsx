'use client'

import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDateTime, getEstadoColor, getEstadoIcon, isPending, canGeneratePDF } from '../utils/formatters';
import { Anticipo } from '../utils/types';

interface AnticipoCardProps {
    anticipo: Anticipo;
    index: number;
    montosDisponibles: { id: number; monto: number; activo: boolean }[];
    onEditar: (id: number, monto: number) => Promise<void>;
    onEliminar: (id: number) => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    employeeId?: string;
}

export default function AnticipoCard({
    anticipo,
    index,
    montosDisponibles,
    onEditar,
    onEliminar,
    onSuccess,
    onError
}: AnticipoCardProps) {
    const [editando, setEditando] = useState(false);
    const [montoEdit, setMontoEdit] = useState(anticipo.monto);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const estaPendiente = isPending(anticipo.estado);
    const permitePDF = canGeneratePDF(anticipo.estado);

    const montosParaCambiar = useMemo(() => {
        if (!montosDisponibles || !Array.isArray(montosDisponibles)) {
            console.warn('❌ [AnticipoCard] montosDisponibles no es un array válido');
            return [];
        }

        if (montosDisponibles.length === 0) {
            console.warn('⚠️ [AnticipoCard] montosDisponibles está vacío');
            return [];
        }

        const anticipoMontoNum = Number(anticipo.monto);

        return montosDisponibles
            .filter(monto => {
                const montoNum = Number(monto.monto);
                const esActivo = monto.activo !== false;
                const esDiferente = montoNum !== anticipoMontoNum;
                return esActivo && esDiferente;
            })
            .map(monto => Number(monto.monto));
    }, [montosDisponibles, anticipo.monto]);

    const handleGuardar = async () => {
        try {
            await onEditar(anticipo.id, montoEdit);
            setEditando(false);
            onSuccess('Anticipo actualizado exitosamente');
        } catch (error: any) {
            onError(error.message || 'Error al actualizar');
        }
    };

    const handleEliminarClick = async () => {
        if (!estaPendiente) {
            alert('Solo puedes eliminar anticipos pendientes');
            return;
        }

        if (window.confirm('¿Estás seguro de eliminar este anticipo?')) {
            try {
                await onEliminar(anticipo.id);
                onSuccess('Anticipo eliminado exitosamente');
            } catch (error: any) {
                onError(error.message || 'Error al eliminar');
            }
        }
    };

    // 🔄 FUNCIÓN DE GENERACIÓN DE PDF CON DATOS DESDE LA DB
    // 🔄 FUNCIÓN DE GENERACIÓN DE PDF CON DATOS DESDE LA DB
    // 🔄 FUNCIÓN DE GENERACIÓN DE PDF CON DATOS DESDE LA DB
    // 🔄 FUNCIÓN DE GENERACIÓN DE PDF CON DATOS DESDE LA DB
const generarYDescargarPDF = async () => {
    try {
        setGenerandoPDF(true);

        // Validar estado
        const estadoLower = anticipo.estado.toLowerCase();
        if (!['aprobado', 'pendiente'].includes(estadoLower)) {
            alert('No se puede generar PDF para anticipos rechazados');
            return;
        }

        // ✅ LOS DATOS VIENEN DIRECTAMENTE DEL ANTICIPO (DB)
        const nombreUsuario = anticipo.usuario_nombre || 'Empleado';
        const departamento = anticipo.usuario_departamento || 'No especificado';
        const employeeId = anticipo.employeeid;

        // ✅ NUEVOS CAMPOS DEL TIPO ACTUALIZADO
        const tipoDocumento = anticipo.usuario_documenttype || 1;
        const numeroCuenta = anticipo.usuario_banknumber || 'No especificado';

        // Función auxiliar para tipo de documento
        const getTipoDocumento = (tipo: number): string => {
            switch (tipo) {
                case 1: return 'Cédula de Ciudadanía';
                case 2: return 'Cédula de Extranjería';
                case 3: return 'Pasaporte';
                case 4: return 'Tarjeta de Identidad';
                default: return 'Documento';
            }
        };

        console.log('📄 [AnticipoCard] Generando PDF para anticipo:', {
            anticipoId: anticipo.id,
            employeeId,
            nombreUsuario,
            departamento,
            tipoDocumento,
            numeroCuenta,
            estado: anticipo.estado
        });

        // Importar jsPDF dinámicamente
        const { jsPDF } = await import('jspdf');

        // Crear documento PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Configurar fuente
        doc.setFont('helvetica');

        // ✅ Formato de fecha DD/MM/YYYY con 2 dígitos
        const fechaActual = new Date();
        const fechaFormateada = `${fechaActual.getDate().toString().padStart(2, '0')}/${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}/${fechaActual.getFullYear()}`;

        // 1. Fecha (formato: DD/MM/YYYY)
        doc.setFontSize(11);
        doc.text(fechaFormateada, margin, 30);

        // 2. Destinatario
        doc.setFontSize(11);
        doc.text('Señores:', margin, 45);

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('CALL COMUNICADOS S.A.S', margin, 52);

        // 3. Asunto
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Asunto: Autorización descuento de Salarios, Prestaciones Sociales, Vacaciones, Comisiones y Recargos.',
            margin, 65, { maxWidth: contentWidth });

        // 4. Cuerpo del documento
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        const montoFormateado = new Intl.NumberFormat('es-CL').format(anticipo.monto);

        // ✅ Formato fecha solicitud DD/MM/YYYY
        const fechaSolicitud = new Date(anticipo.fecha_solicitud);
        const fechaSolicitudFormateada = `${fechaSolicitud.getDate().toString().padStart(2, '0')}/${(fechaSolicitud.getMonth() + 1).toString().padStart(2, '0')}/${fechaSolicitud.getFullYear()}`;

        // Texto principal
        doc.text(`Yo, ${nombreUsuario}, identificado con ${getTipoDocumento(tipoDocumento)} No. ${employeeId}, empleado del departamento de ${departamento} de la empresa CALL COMUNICADOS S.A.S.`,
            margin, 85, { maxWidth: contentWidth });

        doc.text(`Por medio de la presente, autorizo el descuento de un anticipo salarial por valor de $${montoFormateado}, el cual será descontado de mis salarios, prestaciones sociales, vacaciones, comisiones y recargos, de acuerdo con el siguiente detalle:`,
            margin, 100, { maxWidth: contentWidth });

        // Detalle del anticipo
        doc.setFont(undefined, 'bold');
        doc.text('Detalle del Anticipo:', margin, 115);
        doc.setFont(undefined, 'normal');
        doc.text(`• Valor del anticipo: $${montoFormateado}`, margin + 5, 122);
        doc.text(`• Número de cuenta bancaria: ${numeroCuenta}`, margin + 5, 126);
        doc.text(`• Fecha de solicitud: ${fechaSolicitudFormateada}`, margin + 5, 130);
        doc.text(`• Estado: ${anticipo.estado}`, margin + 5, 134);

        // Declaración
        doc.text('Declaro que esta autorización la realizo con pleno conocimiento de mis facultades y derechos, y que me veo en la obligación de solicitar este préstamo.',
            margin, 141, { maxWidth: contentWidth });

        // 📌 POSICIÓN DE FIRMAS CERCANA AL PIE DE PÁGINA
        const yPosFirmas = 210;

        // 📌 FIRMA ELECTRÓNICA DEL TRABAJADOR (IZQUIERDA) - CON IMAGEN
        const trabajadorX = margin;
        const trabajadorFirmaY = yPosFirmas;

        // Cargar y agregar imagen de firma digital del trabajador
        try {
            const firmaImagePath = '/Firma_Digital.png';
            const firmaWidth = 60;
            const firmaHeight = 21;
            const firmaImageX = trabajadorX;

            doc.addImage(
                firmaImagePath,
                'PNG',
                firmaImageX,
                trabajadorFirmaY,
                firmaWidth,
                firmaHeight
            );

        } catch (imageError) {
            console.warn('❌ No se pudo cargar la imagen de firma del trabajador:', imageError);
        }

        // LÍNEA DE FIRMA TRABAJADOR - DELGADA
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setLineWidth(0.3);
        doc.line(trabajadorX, trabajadorFirmaY + 22, trabajadorX + 60, trabajadorFirmaY + 22);

        // Nombre e información del trabajador
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(nombreUsuario, trabajadorX, trabajadorFirmaY + 26);

        doc.setFont(undefined, 'bold');
        doc.text('Trabajador', trabajadorX, trabajadorFirmaY + 30);
        doc.setFont(undefined, 'normal');
        const tipoDocAbreviado = getTipoDocumento(tipoDocumento) === 'Cédula de Ciudadanía' ? 'C.C.' : 
                                getTipoDocumento(tipoDocumento) === 'Cédula de Extranjería' ? 'C.E.' : 
                                getTipoDocumento(tipoDocumento) === 'Pasaporte' ? 'Pasap.' : 'Doc.';
        doc.text(`${tipoDocAbreviado}: ${employeeId}`, trabajadorX, trabajadorFirmaY + 34);
        doc.text(`Depto: ${departamento}`, trabajadorX, trabajadorFirmaY + 38);

        // 📌 FIRMA DE LA EMPRESA (DERECHA) - CON IMAGEN DEL REPRESENTANTE LEGAL
        const empresaX = pageWidth / 2 + 20;
        const empresaFirmaY = yPosFirmas + 22; // Línea alineada con la del trabajador

        // Cargar y agregar imagen de firma del representante legal
        try {
            const firmaRepPath = '/Firma_Representante.jpg';
            const firmaRepWidth = 60; // Mismo ancho que la firma del trabajador
            const firmaRepHeight = 21; // Misma altura proporcional
            
            // Calcular posición Y para la imagen (encima de la línea)
            const firmaRepY = empresaFirmaY - 22; // 22mm arriba de la línea

            doc.addImage(
                firmaRepPath,
                'JPG',
                empresaX,
                firmaRepY,
                firmaRepWidth,
                firmaRepHeight
            );

        } catch (imageError) {
            console.warn('❌ No se pudo cargar la imagen de firma del representante:', imageError);
            // Continuar sin imagen, solo línea de firma
        }

        // LÍNEA DE FIRMA EMPRESA - DELGADA
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setLineWidth(0.3);
        doc.line(empresaX, empresaFirmaY, empresaX + 60, empresaFirmaY);

        // Nombre e información de la empresa
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('CALL COMUNICADOS S.A.S', empresaX, empresaFirmaY + 4);

        doc.setFont(undefined, 'bold');
        doc.text('Empresa', empresaX, empresaFirmaY + 8);
        doc.setFont(undefined, 'normal');
        doc.text('NIT: 901.820.169-2', empresaX, empresaFirmaY + 12);
        doc.text('Rep. Legal: Jaime A. Zape Alzate', empresaX, empresaFirmaY + 16);
        doc.text('C.C.: 70.329.207', empresaX, empresaFirmaY + 20);

        // 7. Pie de página
        const piePaginaY = pageHeight - 20;
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        doc.setFont('helvetica', 'normal');

        doc.text(`Documento generado electrónicamente - Anticipo ID: ${anticipo.id} - Fecha solicitud: ${fechaSolicitudFormateada} - Estado: ${anticipo.estado}`,
            pageWidth / 2, piePaginaY, { align: 'center' });

        // 8. Descargar el PDF
        const filename = `Acuerdo-Anticipo-${employeeId}-${anticipo.id}.pdf`;
        doc.save(filename);

        onSuccess(`PDF "${filename}" descargado correctamente`);

    } catch (error: any) {
        console.error('❌ [AnticipoCard] Error generando PDF:', error);

        if (error.message && error.message.includes('jspdf')) {
            onError('Error al cargar la librería de PDF. Por favor, recarga la página.');
        } else {
            onError(`Error al generar el PDF: ${error.message || 'Error desconocido'}`);
        }
    } finally {
        setGenerandoPDF(false);
    }
};

    return (
        <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
                {/* Información */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <EstadoIcon estado={anticipo.estado} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                Anticipo #{index + 1}
                            </p>
                        </div>
                        <FechaInfo anticipo={anticipo} />
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3">
                    {permitePDF && (
                        <button
                            onClick={generarYDescargarPDF}
                            disabled={generandoPDF}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generandoPDF ? (
                                <>
                                    <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar PDF
                                </>
                            )}
                        </button>
                    )}

                    <div className="text-right">
                        <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(anticipo.monto)}
                            </p>
                        </div>
                    </div>

                    {estaPendiente && (
                        <AnticipoActions
                            editando={editando}
                            onEditar={() => setEditando(!editando)}
                            onGuardar={handleGuardar}
                            onCancelar={() => setEditando(false)}
                            onEliminar={handleEliminarClick}
                        />
                    )}
                </div>
            </div>

            {editando && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {montosParaCambiar.length > 0 ? (
                        <>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar nuevo monto:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {montosParaCambiar.map((monto) => (
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
                        </>
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                ⚠️ No hay montos disponibles para cambiar.
                                <br />Contacta con administración para más opciones.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Subcomponentes (sin cambios)
const EstadoIcon = ({ estado }: { estado: string }) => {
    const estaPendiente = isPending(estado);
    const aprobado = estado.toLowerCase() === 'aprobado';

    return (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${estaPendiente ? 'bg-yellow-50 dark:bg-yellow-900/20' :
            aprobado ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                'bg-gray-50 dark:bg-gray-700'
            }`}>
            <span className={`text-sm font-bold ${estaPendiente ? 'text-yellow-700 dark:text-yellow-400' :
                aprobado ? 'text-emerald-700 dark:text-emerald-400' :
                    'text-gray-700 dark:text-gray-400'
                }`}>
                {getEstadoIcon(estado)}
            </span>
        </div>
    );
};

const FechaInfo = ({ anticipo }: { anticipo: Anticipo }) => (
    <div className="flex items-center gap-2">
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {formatDateTime(anticipo.fecha_solicitud)}
        </p>
        {anticipo.fecha_firma && (
            <>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="text-xs text-gray-500">
                        Firmado: {anticipo.fecha_firma}
                    </span>
                </div>
            </>
        )}
    </div>
);

const AnticipoActions = ({
    editando,
    onEditar,
    onGuardar,
    onCancelar,
    onEliminar
}: {
    editando: boolean;
    onEditar: () => void;
    onGuardar: () => void;
    onCancelar: () => void;
    onEliminar: () => void;
}) => {
    if (editando) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={onGuardar}
                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                    title="Guardar"
                >
                    ✓ Guardar
                </button>
                <button
                    onClick={onCancelar}
                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Cancelar"
                >
                    ✗ Cancelar
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onEditar}
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                title="Editar monto"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
            <button
                onClick={onEliminar}
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                title="Eliminar"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );
};