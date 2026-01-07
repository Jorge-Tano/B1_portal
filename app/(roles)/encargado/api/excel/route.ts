// app/(roles)/encargado/api/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import ExcelJS from 'exceljs';

// ========== INTERFACES ==========

interface AnticipoDB {
  id: number;
  employeeid: string;
  amount: number;
  request_date: string;
  status: string;
  name: string;
  email: string;
  bank_number?: string;
  bank_account?: string;
  document_type?: string;
  role?: string;
  telephone?: string;
}

interface ExcelResult {
  buffer: Buffer;
  name: string;
}

// ========== FUNCIONES AUXILIARES ==========

function obtenerMesActual(): string {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const ahora = new Date();
  return meses[ahora.getMonth()] + ahora.getFullYear().toString().slice(-2);
}

function obtenerConfiguracion() {
  const mesActual = obtenerMesActual();
  
  return {
    NIT_PAGADOR: '901820169',
    TIPO_PAGO: '225',
    APLICACION: 'I',
    SECUENCIA_ENVIO: '10',
    CUENTA_DEBITAR: '39900004416',
    TIPO_CUENTA_DEBITAR: 'S',
    DESCRIPCION_PAGO: `Nomi${mesActual}`,
    TIPO_TRANSACCION: '37',
    REFERENCIA: `Nomi${mesActual}`
  };
}

function obtenerTipoDocumento(documentType: any): string {
  if (!documentType) return '1';
  
  const docStr = String(documentType).toLowerCase().trim();
  
  if (docStr.includes('cc') || docStr.includes('cedula') || docStr.includes('cédula') || docStr.includes('ciudadania')) {
    return '1';
  }
  if (docStr.includes('ce') || docStr.includes('extranjeria') || docStr.includes('extranjer')) {
    return '2';
  }
  if (docStr.includes('ti') || docStr.includes('tarjeta') || docStr.includes('identidad')) {
    return '3';
  }
  if (docStr.includes('pp') || docStr.includes('pasaporte')) {
    return '4';
  }
  if (docStr.includes('nit')) {
    return '5';
  }
  
  // Si ya es un número, devolverlo como string
  if (/^[1-5]$/.test(docStr)) {
    return docStr;
  }
  
  return '1';
}

function formatearNombre(nombre: any): string {
  if (!nombre) return '';
  
  // Convertir a string primero
  const nombreStr = String(nombre);
  
  // Convertir a minúsculas primero
  const nombreMinusculas = nombreStr.toLowerCase();
  
  // Dividir por espacios y capitalizar cada palabra
  return nombreMinusculas
    .split(' ')
    .map(palabra => 
      palabra.charAt(0).toUpperCase() + palabra.slice(1)
    )
    .join(' ')
    .trim();
}

function limpiarNumero(valor: any): string {
  if (!valor) return '';
  
  // Convertir a string
  const valorStr = String(valor);
  
  // Eliminar caracteres no numéricos excepto puntos y comas
  const limpio = valorStr.replace(/[^\d,.]/g, '');
  
  return limpio || '';
}

// Función para convertir cuenta bancaria a número si es posible
function convertirCuentaBancariaANumero(cuenta: string): { valor: number | string, esNumero: boolean } {
  if (!cuenta) return { valor: '', esNumero: false };
  
  // Limpiar primero
  const cuentaLimpia = limpiarNumero(cuenta);
  
  if (!cuentaLimpia) return { valor: '', esNumero: false };
  
  // Intentar convertir a número
  // Si es un número muy grande, puede convertirse en notación científica en Excel
  // Para evitar esto, verificamos el tamaño
  const cuentaNum = parseFloat(cuentaLimpia.replace(',', '.'));
  
  if (isNaN(cuentaNum)) {
    return { valor: cuentaLimpia, esNumero: false };
  }
  
  // Para números muy grandes, es mejor dejarlos como texto
  // para evitar notación científica en Excel
  if (cuentaNum > 1e15 || cuentaNum < -1e15) {
    return { valor: cuentaLimpia, esNumero: false };
  }
  
  return { valor: cuentaNum, esNumero: true };
}

// ==================== FUNCIÓN PRINCIPAL ====================

async function generarExcelFormatoExacto(anticipos: AnticipoDB[], CONFIG: any): Promise<ExcelResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Anticipos';
  
  const worksheet = workbook.addWorksheet('FORMATOPAB');

  // ============================================
  // ENCABEZADOS FIJOS
  // ============================================
  
  // Fila 1: Encabezados
  const fila1 = worksheet.addRow([
    'NIT PAGADOR', 'TIPO DE PAGO', 'APLICACIÓN', 'SECUENCIA DE ENVÍO',
    'NRO CUENTA A DEBITAR', 'TIPO DE CUENTA A DEBITAR', 'DESCRIPCIÓN DEL PAGO',
    '', '', '', '', ''
  ]);
  
  // Fila 2: Valores fijos - ASIGNAR DIRECTAMENTE COMO VALORES PRIMITIVOS
  const fila2 = worksheet.addRow([]);
  
  // Asignar valores directamente
  fila2.getCell(1).value = String(CONFIG.NIT_PAGADOR); // Texto
  fila2.getCell(2).value = String(CONFIG.TIPO_PAGO); // Texto
  fila2.getCell(3).value = String(CONFIG.APLICACION); // Texto
  fila2.getCell(4).value = String(CONFIG.SECUENCIA_ENVIO); // Texto
  fila2.getCell(5).value = String(CONFIG.CUENTA_DEBITAR); // Texto
  
  // TIPO DE CUENTA A DEBITAR - Asignar como string primero
  const cellF2 = fila2.getCell(6);
  cellF2.value = String(CONFIG.TIPO_CUENTA_DEBITAR); // 'S' o 'D'
  
  fila2.getCell(7).value = String(CONFIG.DESCRIPCION_PAGO); // Texto
  
  // Fila 3: Encabezados beneficiarios
  const fila3 = worksheet.addRow([
    'Tipo Documento Beneficiario', 'Nit Beneficiario', 'Nombre Beneficiario',
    'Tipo Transaccion', 'Código Banco', 'No Cuenta Beneficiario',
    'Email', 'Documento Autorizado', 'Referencia',
    'Celular Beneficiario', 'ValorTransaccion', 'Fecha de aplicación'
  ]);

  // Aplicar estilos a encabezados
  [fila1, fila2, fila3].forEach((fila, index) => {
    fila.eachCell((cell, colNumber) => {
      if (index === 0 && colNumber <= 7) {
        // Fila 1: Gris oscuro con texto blanco
        cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (index === 1 && colNumber <= 7) {
        // Fila 2: Naranja claro
        cell.font = { size: 10, name: 'Arial', bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
        // Alineación específica para TIPO DE CUENTA A DEBITAR (columna 6)
        if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      } else if (index === 2) {
        // Fila 3: Azul con texto blanco
        cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  // ============================================
  // DATOS DE LOS BENEFICIARIOS
  // ============================================
  anticipos.forEach((anticipo, index) => {
    const rowNum = index + 4;
    
    // Crear fila vacía primero
    const row = worksheet.addRow([]);
    
    // CONVERTIR DATOS DE LA BD ANTES DE ASIGNARLOS
    
    // Columna A: Tipo Documento Beneficiario - General (centro)
    const tipoDoc = obtenerTipoDocumento(anticipo.document_type);
    row.getCell(1).value = tipoDoc;
    
    // Columna B: Nit Beneficiario - Convertir de texto a número
    const cellB = row.getCell(2);
    const employeeId = anticipo.employeeid || '';
    
    // Intentar convertir a número
    if (employeeId) {
      const employeeIdNum = parseInt(employeeId, 10);
      if (!isNaN(employeeIdNum)) {
        // Asignar como número
        cellB.value = employeeIdNum;
        cellB.numFmt = '0'; // Formato numérico sin decimales
      } else {
        // Si no se puede convertir, mantener como texto
        cellB.value = employeeId;
      }
    } else {
      cellB.value = '';
    }
    
    // Columna C: Nombre Beneficiario - General (izquierda)
    row.getCell(3).value = formatearNombre(anticipo.name);
    
    // Columna D: Tipo Transaccion - General (centro)
    row.getCell(4).value = String(CONFIG.TIPO_TRANSACCION);
    
    // Columna E: Código Banco - General (centro)
    row.getCell(5).value = '1007';
    
    // Columna F: No Cuenta Beneficiario - Convertir a número si es posible
    const cellF = row.getCell(6);
    const cuenta = limpiarNumero(anticipo.bank_account || anticipo.bank_number);
    
    if (cuenta) {
      const cuentaConvertida = convertirCuentaBancariaANumero(cuenta);
      
      if (cuentaConvertida.esNumero) {
        // Asignar como número
        cellF.value = cuentaConvertida.valor as number;
        // Usar formato de texto para evitar notación científica en números grandes
        cellF.numFmt = '0';
      } else {
        // Mantener como texto (para números muy grandes o con formato especial)
        cellF.value = cuentaConvertida.valor as string;
      }
    } else {
      cellF.value = '';
    }
    
    // Columna G: Email - Texto (izquierda)
    row.getCell(7).value = String(anticipo.email || '');
    
    // Columna H: Documento Autorizado - General (vacío)
    row.getCell(8).value = '';
    
    // Columna I: Referencia - General (izquierda)
    row.getCell(9).value = String(CONFIG.REFERENCIA);
    
    // Columna J: Celular Beneficiario - Número (derecha)
    const telefonoLimpio = limpiarNumero(anticipo.telephone);
    const cellJ = row.getCell(10);
    if (telefonoLimpio && /^\d+$/.test(telefonoLimpio)) {
      // Convertir a número para Excel
      const telefonoNum = parseInt(telefonoLimpio, 10);
      if (!isNaN(telefonoNum)) {
        cellJ.value = telefonoNum;
        cellJ.numFmt = '0';
      } else {
        cellJ.value = telefonoLimpio;
      }
    } else {
      cellJ.value = telefonoLimpio;
    }
    
    // Columna K: ValorTransaccion - Número (derecha)
    const cellK = row.getCell(11);
    const monto = Number(anticipo.amount) || 0;
    cellK.value = monto;
    cellK.numFmt = '0'; // Formato numérico sin decimales
    
    // Columna L: Fecha de aplicación - General (vacío)
    row.getCell(12).value = '';
    
    // Aplicar estilos a toda la fila
    for (let col = 1; col <= 12; col++) {
      const cell = row.getCell(col);
      
      cell.font = { size: 10, name: 'Arial' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // ALINEACIÓN ESPECÍFICA POR TIPO DE DATO
      switch (col) {
        case 1: // A: Tipo Documento Beneficiario - General (centro)
        case 4: // D: Tipo Transaccion - General (centro)
        case 5: // E: Código Banco - General (centro)
        case 12: // L: Fecha de aplicación - General (centro)
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          break;
          
        case 2: // B: Nit Beneficiario - Número (derecha)
        case 6: // F: No Cuenta Beneficiario - Número (derecha)
        case 10: // J: Celular Beneficiario - Número (derecha)
        case 11: // K: ValorTransaccion - Número (derecha)
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          break;
          
        case 7: // G: Email - Texto (izquierda)
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          break;
          
        default: // C, H, I: General (izquierda)
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      
      // Fondo alternado
      if (rowNum % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
    }
  });

  // ============================================
  // CONFIGURACIÓN FINAL
  // ============================================
  
  // Anchos de columnas
  worksheet.columns = [
    { width: 25 }, // A: Tipo Documento Beneficiario
    { width: 20 }, // B: Nit Beneficiario
    { width: 30 }, // C: Nombre Beneficiario
    { width: 15 }, // D: Tipo Transaccion
    { width: 15 }, // E: Código Banco
    { width: 20 }, // F: No Cuenta Beneficiario
    { width: 25 }, // G: Email
    { width: 20 }, // H: Documento Autorizado
    { width: 15 }, // I: Referencia
    { width: 20 }, // J: Celular Beneficiario
    { width: 15 }, // K: ValorTransaccion
    { width: 18 }  // L: Fecha de aplicación
  ];
  
  // Alturas de filas
  worksheet.getRow(1).height = 25;
  worksheet.getRow(2).height = 25;
  worksheet.getRow(3).height = 25;
  for (let rowNum = 4; rowNum <= worksheet.rowCount; rowNum++) {
    worksheet.getRow(rowNum).height = 20;
  }
  
  // Congelar paneles
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

  // ============================================
  // GENERAR ARCHIVO
  // ============================================
  
  const buffer = await workbook.xlsx.writeBuffer();
  const fecha = new Date().toISOString().split('T')[0];
  const fileName = `FORMATOPAB_${fecha}_${anticipos.length}_registros.xlsx`;
  
  return { 
    buffer: Buffer.from(buffer), 
    name: fileName 
  };
}

// ========== API ROUTE PRINCIPAL ==========

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Consultar datos REALES
    const queryStr = `
      SELECT 
        a.id,
        a.employeeid,
        am.amount,
        a.request_date,
        a.status,
        u.name,
        u.email,
        u.bank_number,
        u.bank_account,
        u.document_type,
        u.role,
        u.telephone
      FROM advances a
      LEFT JOIN users u ON a.employeeid = u.employeeid
      LEFT JOIN amounts am ON a.amount_id = am.id
      WHERE a.status LIKE 'Aprobado'
      ORDER BY a.request_date DESC
      LIMIT 100
    `;

    let anticiposResult;
    try {
      anticiposResult = await query(queryStr);
    } catch (dbError: any) {
      console.error('❌ Error en consulta DB:', dbError);
      return NextResponse.json(
        { error: `Error en base de datos: ${dbError.message}` },
        { status: 500 }
      );
    }

    if (!anticiposResult?.rows?.length) {
      return NextResponse.json(
        { error: 'No hay anticipos aprobados para exportar' },
        { status: 404 }
      );
    }

    const anticipos: AnticipoDB[] = anticiposResult.rows;
    const CONFIG = obtenerConfiguracion();
    const resultado = await generarExcelFormatoExacto(anticipos, CONFIG);
    
    // Crear un Uint8Array desde el Buffer (esto es compatible con NextResponse)
    const uint8Array = new Uint8Array(resultado.buffer);
    
    // Crear respuesta usando NextResponse con Uint8Array
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(resultado.name)}"`,
        'Content-Length': resultado.buffer.length.toString(),
      },
    });

    return response;

  } catch (error: any) {
    console.error('❌ ERROR en API Excel:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}