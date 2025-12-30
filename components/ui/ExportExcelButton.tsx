// components/ExportExcelButton.tsx
'use client'

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Anticipo } from '@/types/anticipo';

interface ExportExcelButtonProps {
  anticiposAprobados: Anticipo[];
  tipo?: 'simple' | 'bancario';
  disabled?: boolean;
  className?: string;
  empresaData?: {
    nit: string;
    cuenta_debito: string;
    tipo_cuenta_debito: string;
    nombre_empresa: string;
  };
}

// Datos estáticos para bancos y listas (más completos)
const bancosData = [
  { BANCO: 'BANCO DE BOGOTA', 'CODIGO BANCO ACH': '1001' },
  { BANCO: 'BANCO POPULAR', 'CODIGO BANCO ACH': '1002' },
  { BANCO: 'ITAU antes Corpbanca', 'CODIGO BANCO ACH': '1006' },
  { BANCO: 'BANCOLOMBIA', 'CODIGO BANCO ACH': '1007' },
  { BANCO: 'CITIBANK', 'CODIGO BANCO ACH': '1009' },
  { BANCO: 'BANCO GNB SUDAMERIS', 'CODIGO BANCO ACH': '1012' },
  { BANCO: 'BBVA COLOMBIA', 'CODIGO BANCO ACH': '1013' },
  { BANCO: 'ITAU', 'CODIGO BANCO ACH': '1014' },
  { BANCO: 'SCOTIABANK COLPATRIA S.A', 'CODIGO BANCO ACH': '1019' },
  { BANCO: 'BANCO DE OCCIDENTE', 'CODIGO BANCO ACH': '1023' },
  { BANCO: 'BANCOLDEX S.A.', 'CODIGO BANCO ACH': '1031' },
  { BANCO: 'BANCO CAJA SOCIAL BCSC SA', 'CODIGO BANCO ACH': '1032' },
  { BANCO: 'BANCO AGRARIO', 'CODIGO BANCO ACH': '1040' },
  { BANCO: 'BANCO MUNDO MUJER', 'CODIGO BANCO ACH': '1047' },
  { BANCO: 'BANCO DAVIVIENDA SA', 'CODIGO BANCO ACH': '1051' },
  { BANCO: 'BANCO AV VILLAS', 'CODIGO BANCO ACH': '1052' },
  { BANCO: 'BANCO W', 'CODIGO BANCO ACH': '1053' },
  { BANCO: 'BANCO DE LAS MICROFINANZAS - BANCAMIA S.A.', 'CODIGO BANCO ACH': '1059' },
  { BANCO: 'BANCO PICHINCHA', 'CODIGO BANCO ACH': '1060' },
  { BANCO: 'BANCOOMEVA', 'CODIGO BANCO ACH': '1061' },
  { BANCO: 'BANCO FALABELLA S.A.', 'CODIGO BANCO ACH': '1062' },
  { BANCO: 'BANCO FINANDINA S.A.', 'CODIGO BANCO ACH': '1063' },
  { BANCO: 'BANCO SANTANDER DE NEGOCIOS COLOMBIA S.A', 'CODIGO BANCO ACH': '1065' },
  { BANCO: 'BANCO COOPERATIVO COOPCENTRAL', 'CODIGO BANCO ACH': '1066' },
  { BANCO: 'MIBANCO S.A.', 'CODIGO BANCO ACH': '1067' },
  { BANCO: 'BANCO SERFINANZA S.A', 'CODIGO BANCO ACH': '1069' },
  { BANCO: 'LULO BANK S.A.', 'CODIGO BANCO ACH': '1070' },
  { BANCO: 'BANCO J.P. MORGAN COLOMBIA S.A.', 'CODIGO BANCO ACH': '1071' },
  { BANCO: 'ASOPAGOS S.A.S', 'CODIGO BANCO ACH': '1086' },
  { BANCO: 'FINANCIERA JURISCOOP S.A. COMPAÑIA DE FINANCIAMIENTO', 'CODIGO BANCO ACH': '1121' },
  { BANCO: 'COOPERATIVA FINANCIERA DE ANTIOQUIA', 'CODIGO BANCO ACH': '1283' },
  { BANCO: 'PIBANK', 'CODIGO BANCO ACH': '1560' },
  { BANCO: 'JFK COOPERATIVA FINANCIERA', 'CODIGO BANCO ACH': '1286' },
  { BANCO: 'COOTRAFA COOPERATIVA FINANCIERA', 'CODIGO BANCO ACH': '1289' },
  { BANCO: 'CONFIAR COOPERATIVA FINANCIERA', 'CODIGO BANCO ACH': '1292' },
  { BANCO: 'BANCO UNION S.A', 'CODIGO BANCO ACH': '1303' },
  { BANCO: 'COLTEFINANCIERA S.A', 'CODIGO BANCO ACH': '1370' },
  { BANCO: 'NEQUI', 'CODIGO BANCO ACH': '1507' },
  { BANCO: 'DAVIPLATA', 'CODIGO BANCO ACH': '1551' },
  { BANCO: 'BAN100 S.A', 'CODIGO BANCO ACH': '1558' },
  { BANCO: 'IRIS', 'CODIGO BANCO ACH': '1637' },
  { BANCO: 'MOVII', 'CODIGO BANCO ACH': '1801' },
  { BANCO: 'DING TECNIPAGOS SA', 'CODIGO BANCO ACH': '1802' },
  { BANCO: 'UALA', 'CODIGO BANCO ACH': '1804' },
  { BANCO: 'BANCO BTG PACTUAL', 'CODIGO BANCO ACH': '1805' },
  { BANCO: 'POWWI', 'CODIGO BANCO ACH': '1803' },
  { BANCO: 'BOLD CF', 'CODIGO BANCO ACH': '1808' },
  { BANCO: 'NU', 'CODIGO BANCO ACH': '1809' },
  { BANCO: 'RAPPIPAY', 'CODIGO BANCO ACH': '1811' },
  { BANCO: 'COINK', 'CODIGO BANCO ACH': '1812' },
  { BANCO: 'GLOBAL66', 'CODIGO BANCO ACH': '1814' },
  { BANCO: 'BANCO CONTACTAR S.A.', 'CODIGO BANCO ACH': '1819' },
];

const listasData = [
  { APLICACION: 'I', CLASES_DE_PAGOS: '220', TIPO_DE_CUENTA: 'S', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '1', TIPO_TRANSACCION: '23', CODIGO_BANCO_ACH: '1001' },
  { APLICACION: 'M', CLASES_DE_PAGOS: '225', TIPO_DE_CUENTA: 'D', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '2', TIPO_TRANSACCION: '25', CODIGO_BANCO_ACH: '1002' },
  { APLICACION: 'N', CLASES_DE_PAGOS: '238', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '3', TIPO_TRANSACCION: '27', CODIGO_BANCO_ACH: '1006' },
  { APLICACION: '', CLASES_DE_PAGOS: '240', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '4', TIPO_TRANSACCION: '33', CODIGO_BANCO_ACH: '1007' },
  { APLICACION: '', CLASES_DE_PAGOS: '250', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '5', TIPO_TRANSACCION: '36', CODIGO_BANCO_ACH: '1009' },
  { APLICACION: '', CLASES_DE_PAGOS: '239', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '', TIPO_TRANSACCION: '37', CODIGO_BANCO_ACH: '1012' },
  { APLICACION: '', CLASES_DE_PAGOS: '320', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '', TIPO_TRANSACCION: '40', CODIGO_BANCO_ACH: '1013' },
  { APLICACION: '', CLASES_DE_PAGOS: '325', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '', TIPO_TRANSACCION: '52', CODIGO_BANCO_ACH: '1014' },
  { APLICACION: '', CLASES_DE_PAGOS: '820', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '', TIPO_TRANSACCION: '53', CODIGO_BANCO_ACH: '1019' },
  { APLICACION: '', CLASES_DE_PAGOS: '920', TIPO_DE_CUENTA: '', TIPO_DE_DOCUMENTO_DEL_BENEFICIARIO: '', TIPO_TRANSACCION: '', CODIGO_BANCO_ACH: '1023' },
];

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  anticiposAprobados,
  tipo = 'simple',
  disabled = false,
  className = '',
  empresaData = {
    nit: '901820169',
    cuenta_debito: '39900004416',
    tipo_cuenta_debito: 'S',
    nombre_empresa: 'NOMINA EMPRESA'
  }
}) => {
  const [loading, setLoading] = useState(false);

  // Función para mapear tipo de cuenta
  const mapearTipoCuenta = (tipo: string = ''): string => {
    switch (tipo.toLowerCase()) {
      case 'ahorros':
      case 'savings':
        return 'S';
      case 'corriente':
      case 'checking':
        return 'D';
      default:
        return 'S';
    }
  };

  // Función para mapear tipo de documento
  const mapearTipoDocumento = (tipo: string = ''): string => {
    switch (tipo.toUpperCase()) {
      case 'CC':
      case 'CÉDULA':
        return '1';
      case 'CE':
      case 'EXTRANJERÍA':
        return '2';
      case 'NIT':
        return '3';
      case 'PASAPORTE':
        return '4';
      default:
        return '1';
    }
  };

  // Función para ajustar el ancho de las columnas automáticamente
  const autoFitColumns = (data: any[], worksheet: XLSX.WorkSheet) => {
    const maxWidth = 50; // Ancho máximo en caracteres
    
    const colWidths = data.reduce((widths, row) => {
      Object.keys(row).forEach((key, index) => {
        const value = row[key]?.toString() || '';
        const currentWidth = widths[index] || 0;
        widths[index] = Math.max(
          currentWidth,
          Math.min(value.length, maxWidth)
        );
      });
      return widths;
    }, [] as number[]);

    worksheet['!cols'] = colWidths.map(width => ({ 
      width: Math.max(10, width + 2), // +2 para padding
      hidden: false 
    }));
  };

  // Función para agregar estilos básicos
  const applyBasicStyles = (worksheet: XLSX.WorkSheet) => {
    // Definir rangos con estilos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Color de encabezados
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: {
            patternType: 'solid',
            fgColor: { rgb: '4472C4' } // Azul corporativo
          },
          font: {
            bold: true,
            color: { rgb: 'FFFFFF' }
          },
          alignment: {
            vertical: 'center',
            horizontal: 'center'
          }
        };
      }
    }
  };

  const exportarSimple = () => {
    setLoading(true);
    
    try {
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Anticipos Aprobados
      const datosAnticipos = anticiposAprobados.map(anticipo => ({
        'ID': anticipo.id,
        'EMPLOYEE ID': anticipo.employeeid,
        'NOMBRE': anticipo.usuario_nombre || 'N/A',
        'DEPARTAMENTO': anticipo.departamento || 'N/A',
        'MONTO': anticipo.monto,
        'FECHA SOLICITUD': new Date(anticipo.fecha_solicitud).toLocaleDateString('es-ES'),
        'ESTADO': anticipo.estado,
        'CUENTA BANCARIA': anticipo.datos_bancarios?.numero_cuenta || 'No registrada',
        'BANCO': anticipo.datos_bancarios?.banco_nombre || 'No registrado',
        'TIPO CUENTA': anticipo.datos_bancarios?.tipo_cuenta || 'N/A'
      }));
      
      const wsAnticipos = XLSX.utils.json_to_sheet(datosAnticipos);
      autoFitColumns(datosAnticipos, wsAnticipos);
      applyBasicStyles(wsAnticipos);
      XLSX.utils.book_append_sheet(wb, wsAnticipos, 'Anticipos Aprobados');
      
      // Hoja 2: Resumen
      const montoTotal = anticiposAprobados.reduce((sum, a) => sum + a.monto, 0);
      const anticiposConCuenta = anticiposAprobados.filter(a => a.datos_bancarios?.numero_cuenta);
      
      const datosResumen = [
        ['REPORTE DE ANTICIPOS APROBADOS'],
        [''],
        ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
        ['Hora de generación:', new Date().toLocaleTimeString('es-ES')],
        ['Generado por:', 'Sistema de Anticipos'],
        [''],
        ['ESTADÍSTICAS GENERALES'],
        ['Total Anticipos:', anticiposAprobados.length],
        ['Anticipos con cuenta bancaria:', anticiposConCuenta.length],
        ['Anticipos sin cuenta:', anticiposAprobados.length - anticiposConCuenta.length],
        ['Monto Total:', `$${montoTotal.toLocaleString('es-CL')}`],
        ['Promedio por anticipo:', `$${Math.round(montoTotal / anticiposAprobados.length).toLocaleString('es-CL')}`],
        [''],
        ['DISTRIBUCIÓN POR BANCO'],
        ...Array.from(
          anticiposAprobados.reduce((map, a) => {
            const banco = a.datos_bancarios?.banco_nombre || 'Sin banco';
            map.set(banco, (map.get(banco) || 0) + 1);
            return map;
          }, new Map<string, number>())
        ).map(([banco, cantidad]) => [banco, cantidad, `${Math.round((cantidad / anticiposAprobados.length) * 100)}%`])
      ];
      
      const wsResumen = XLSX.utils.aoa_to_sheet(datosResumen);
      autoFitColumns(datosResumen.map(row => 
        Object.fromEntries(row.map((cell, i) => [`Col${i}`, cell]))
      ), wsResumen);
      
      // Estilo para el título
      const titleCell = wsResumen['A1'];
      if (titleCell) {
        titleCell.s = {
          font: {
            bold: true,
            size: 14,
            color: { rgb: '1F4E78' }
          }
        };
      }
      
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
      
      // Generar y descargar
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Anticipos_Aprobados_${fecha}.xlsx`);
      
      alert('✅ Reporte exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al generar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const exportarBancario = () => {
    setLoading(true);
    
    try {
      const wb = XLSX.utils.book_new();
      const hoy = new Date();
      const mesActual = hoy.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      
      // SHEET 1: FORMATOPAB
      const formatoPABData = [
        // Encabezados
        [
          'NIT PAGADOR', 'TIPO DE PAGO', 'APLICACIÓN', 'SECUENCIA DE ENVÍO', 
          'NRO CUENTA A DEBITAR', 'TIPO DE CUENTA A DEBITAR', 'DESCRIPCIÓN DEL PAGO'
        ],
        // Datos del pagador (empresa)
        [
          empresaData.nit, 
          '225', 
          'I', 
          '10', 
          empresaData.cuenta_debito, 
          empresaData.tipo_cuenta_debito, 
          `Nomi${mesActual.replace(' ', '')}`
        ],
        // Línea en blanco
        ['', '', '', '', '', '', ''],
        // Encabezados de beneficiarios
        [
          'Tipo Documento Beneficiario', 'Nit Beneficiario', 'Nombre Beneficiario', 
          'Tipo Transaccion', 'Código Banco', 'No Cuenta Beneficiario', 
          'Email', 'Documento Autorizado', 'Referencia', 'Celular Beneficiario', 
          'ValorTransaccion', 'Fecha de aplicación'
        ]
      ];
      
      // Agregar beneficiarios con datos reales
      let secuencia = 1;
      const beneficiariosConDatos = anticiposAprobados.filter(a => 
        a.datos_bancarios?.numero_cuenta && a.datos_bancarios?.numero_documento
      );
      
      beneficiariosConDatos.forEach((anticipo) => {
        const datos = anticipo.datos_bancarios;
        
        formatoPABData.push([
          mapearTipoDocumento(datos?.tipo_documento), // Tipo Documento
          datos?.numero_documento || '', // NIT/Documento
          anticipo.usuario_nombre || `Empleado ${anticipo.employeeid}`, // Nombre
          '37', // Tipo Transacción (37 = Nómina)
          datos?.codigo_banco || '1007', // Código Banco
          datos?.numero_cuenta || '', // No Cuenta
          datos?.email || '', // Email
          '', // Documento Autorizado
          `Nomi${mesActual.replace(' ', '')}`, // Referencia
          datos?.celular || '', // Celular
          anticipo.monto.toString(), // Valor
          hoy.toLocaleDateString('es-ES') // Fecha aplicación
        ]);
        
        secuencia++;
      });
      
      // Agregar fila total si hay beneficiarios
      if (beneficiariosConDatos.length > 0) {
        const totalMonto = beneficiariosConDatos.reduce((sum, a) => sum + a.monto, 0);
        
        formatoPABData.push([
          '', '', '', '', '', '', '', '', '', '',
          `TOTAL: ${totalMonto}`,
          `Beneficiarios: ${beneficiariosConDatos.length}`
        ]);
      }
      
      const wsFormatoPAB = XLSX.utils.aoa_to_sheet(formatoPABData);
      
      // Ajustar anchos de columnas
      const maxWidths = [15, 15, 12, 18, 20, 20, 25, 30, 20, 15, 15, 20];
      wsFormatoPAB['!cols'] = maxWidths.map(width => ({ width }));
      
      // Aplicar estilos
      const range = XLSX.utils.decode_range(wsFormatoPAB['!ref'] || 'A1');
      
      // Encabezados principales (fila 1)
      for (let C = range.s.c; C <= 6; ++C) {
        const cell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (wsFormatoPAB[cell]) {
          wsFormatoPAB[cell].s = {
            fill: { fgColor: { rgb: '4472C4' } },
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center' }
          };
        }
      }
      
      // Encabezados beneficiarios (fila 4)
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: 3, c: C });
        if (wsFormatoPAB[cell]) {
          wsFormatoPAB[cell].s = {
            fill: { fgColor: { rgb: '5B9BD5' } },
            font: { bold: true, color: { rgb: 'FFFFFF' } }
          };
        }
      }
      
      // Formato de montos como moneda
      beneficiariosConDatos.forEach((_, index) => {
        const cell = XLSX.utils.encode_cell({ r: 4 + index, c: 10 }); // Columna ValorTransaccion
        if (wsFormatoPAB[cell]) {
          wsFormatoPAB[cell].z = '#,##0';
        }
      });
      
      XLSX.utils.book_append_sheet(wb, wsFormatoPAB, 'FORMATOPAB');
      
      // SHEET 2: CODIGOS DE BANCOS
      const wsBancos = XLSX.utils.json_to_sheet(bancosData);
      autoFitColumns(bancosData, wsBancos);
      
      // Estilos para hoja de bancos
      const bancosRange = XLSX.utils.decode_range(wsBancos['!ref'] || 'A1');
      for (let R = bancosRange.s.r; R <= bancosRange.e.r; ++R) {
        const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
        const cellB = XLSX.utils.encode_cell({ r: R, c: 1 });
        
        if (R === 0) {
          // Encabezados
          if (wsBancos[cellA]) wsBancos[cellA].s = { 
            fill: { fgColor: { rgb: '70AD47' } },
            font: { bold: true, color: { rgb: 'FFFFFF' } }
          };
          if (wsBancos[cellB]) wsBancos[cellB].s = { 
            fill: { fgColor: { rgb: '70AD47' } },
            font: { bold: true, color: { rgb: 'FFFFFF' } }
          };
        } else if (R % 2 === 0) {
          // Filas pares
          if (wsBancos[cellA]) wsBancos[cellA].s = { fill: { fgColor: { rgb: 'E2EFDA' } } };
          if (wsBancos[cellB]) wsBancos[cellB].s = { fill: { fgColor: { rgb: 'E2EFDA' } } };
        }
      }
      
      XLSX.utils.book_append_sheet(wb, wsBancos, 'CODIGOS DE BANCOS');
      
      // SHEET 3: Listas
      const wsListas = XLSX.utils.json_to_sheet(listasData);
      autoFitColumns(listasData, wsListas);
      
      // Estilos alternados para Listas
      const listasRange = XLSX.utils.decode_range(wsListas['!ref'] || 'A1');
      for (let R = listasRange.s.r; R <= listasRange.e.r; ++R) {
        for (let C = listasRange.s.c; C <= listasRange.e.c; ++C) {
          const cell = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsListas[cell]) {
            if (R === 0) {
              // Encabezados
              wsListas[cell].s = {
                fill: { fgColor: { rgb: 'FFC000' } },
                font: { bold: true, color: { rgb: '000000' } }
              };
            } else if (R % 2 === 0) {
              // Filas pares
              wsListas[cell].s = { fill: { fgColor: { rgb: 'FFF2CC' } } };
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, wsListas, 'Listas');
      
      // Agregar una hoja de resumen del archivo
      const infoData = [
        ['INFORMACIÓN DEL ARCHIVO GENERADO'],
        [''],
        ['Nombre del archivo:', `FORMATOPAB_Anticipos_${hoy.toISOString().split('T')[0]}.xlsx`],
        ['Fecha de generación:', hoy.toLocaleDateString('es-ES')],
        ['Hora de generación:', hoy.toLocaleTimeString('es-ES')],
        ['Total beneficiarios:', beneficiariosConDatos.length],
        ['Total anticipos sin datos bancarios:', anticiposAprobados.length - beneficiariosConDatos.length],
        ['Monto total transferido:', beneficiariosConDatos.reduce((sum, a) => sum + a.monto, 0)],
        [''],
        ['INSTRUCCIONES'],
        ['1. Revisar que todos los beneficiarios tengan datos bancarios completos'],
        ['2. Verificar que los códigos de banco sean correctos'],
        ['3. Confirmar montos y referencias'],
        ['4. Este archivo está listo para carga en el sistema bancario']
      ];
      
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'INFORMACIÓN');
      
      // Establecer el orden de las pestañas
      wb.SheetNames = ['INFORMACIÓN', 'FORMATOPAB', 'CODIGOS DE BANCOS', 'Listas'];
      wb.Sheets = {
        'INFORMACIÓN': wsInfo,
        'FORMATOPAB': wsFormatoPAB,
        'CODIGOS DE BANCOS': wsBancos,
        'Listas': wsListas
      };
      
      // Generar archivo con nombre específico
      XLSX.writeFile(wb, `FORMATOPAB_${empresaData.nombre_empresa.replace(/\s+/g, '_')}_${mesActual.replace(/\s+/g, '')}.xlsx`);
      
      alert(`✅ Formato bancario generado exitosamente\nBeneficiarios incluidos: ${beneficiariosConDatos.length}`);
      
    } catch (error) {
      console.error('Error al exportar formato bancario:', error);
      alert('❌ Error al generar el formato bancario');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (anticiposAprobados.length === 0) {
      alert('No hay anticipos aprobados para exportar');
      return;
    }
    
    if (tipo === 'bancario') {
      // Verificar que haya datos bancarios suficientes
      const conDatosBancarios = anticiposAprobados.filter(a => 
        a.datos_bancarios?.numero_cuenta && a.datos_bancarios?.numero_documento
      );
      
      if (conDatosBancarios.length === 0) {
        alert('⚠️ No hay anticipos con datos bancarios completos para el formato bancario.');
        return;
      }
      
      if (conDatosBancarios.length < anticiposAprobados.length) {
        const confirmar = window.confirm(
          `Solo ${conDatosBancarios.length} de ${anticiposAprobados.length} anticipos tienen datos bancarios completos.\n\n¿Deseas continuar exportando solo estos?`
        );
        
        if (!confirmar) return;
      }
      
      exportarBancario();
    } else {
      exportarSimple();
    }
  };

  // Renderizado del botón
  const getButtonText = () => {
    if (loading) return 'Generando...';
    
    if (tipo === 'bancario') {
      const conDatos = anticiposAprobados.filter(a => 
        a.datos_bancarios?.numero_cuenta
      ).length;
      return `Formato Bancario (${conDatos}/${anticiposAprobados.length})`;
    }
    
    return `Exportar (${anticiposAprobados.length})`;
  };

  const getButtonIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      );
    }
    
    return tipo === 'bancario' ? '🏦' : '📊';
  };

  const getButtonColor = () => {
    if (loading || disabled || anticiposAprobados.length === 0) {
      return 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed';
    }
    
    return tipo === 'bancario' 
      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl' 
      : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl';
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || disabled || anticiposAprobados.length === 0}
      className={`
        px-4 py-2.5 rounded-lg font-medium text-sm 
        transition-all duration-300 ease-in-out 
        flex items-center justify-center gap-2
        transform hover:-translate-y-0.5
        ${getButtonColor()} 
        ${className}
      `}
      title={tipo === 'bancario' 
        ? 'Exportar en formato bancario completo (3 hojas)' 
        : 'Exportar reporte detallado con datos bancarios'
      }
    >
      <span className="text-lg">{getButtonIcon()}</span>
      <span>{getButtonText()}</span>
    </button>
  );
};

export default ExportExcelButton;