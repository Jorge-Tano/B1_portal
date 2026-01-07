import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('🚀 INICIANDO GET /ejecutivo/api/ej_anticipos');
  
  try {
    const { searchParams } = new URL(request.url);
    const employeeid = searchParams.get('employeeid');

    console.log('🔍 Employee ID recibido:', employeeid);

    if (!employeeid) {
      return NextResponse.json(
        { error: 'Employee ID es requerido' },
        { status: 400 }
      );
    }

    console.log('🔄 Ejecutando query con nombres corregidos...');
    
    const sqlQuery = `
      SELECT 
        -- Datos del anticipo
        a.id,
        a.employeeid,
        a.amount_id,
        a.request_date,
        a.status,
        a.created_at,
        a.updated_at,
        a.agreement_pdf_url,
        a.agreement_signed_at,
        
        -- Monto desde amounts (JOIN correcto)
        amt.amount,
        
        -- Datos del usuario CON NOMBRES CORRECTOS según tu DB
        u.name as user_name,
        u.email,
        u.ou as user_department,
        u.document_type as user_documenttype,
        u.bank_account as user_bankaccount,
        u.bank_number as user_banknumber
        
      FROM advances a
      LEFT JOIN amounts amt ON a.amount_id = amt.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      
      WHERE a.employeeid = $1
      ORDER BY a.request_date DESC
    `;
    
    console.log('📝 SQL corregido ejecutándose...');
    
    const result = await query(sqlQuery, [employeeid]);
    
    console.log(`✅ Query exitoso. Filas: ${result.rowCount}`);

    if (!result.rows || result.rows.length === 0) {
      console.log('📭 No se encontraron anticipos para este usuario');
      return NextResponse.json([]);
    }

    const firstRow = result.rows[0];
    console.log('🔍 DEBUG - Primera fila completa:', {
      id: firstRow.id,
      employeeid: firstRow.employeeid,
      amount_id: firstRow.amount_id,
      amount: firstRow.amount,
      status: firstRow.status,
      user_name: firstRow.user_name,
      email: firstRow.email,
      user_department: firstRow.user_department,
      user_documenttype: firstRow.user_documenttype,
      user_bankaccount: firstRow.user_bankaccount,
      user_banknumber: firstRow.user_banknumber
    });

    const anticipos = result.rows.map(row => {
      return {
        id: row.id,
        employeeid: row.employeeid,
        amount_id: row.amount_id,
        amount: row.amount || 0,
        monto: row.amount || 0,
        request_date: row.request_date ? new Date(row.request_date).toISOString() : null,
        status: row.status,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        agreement_pdf_url: row.agreement_pdf_url,
        agreement_signed_at: row.agreement_signed_at ? new Date(row.agreement_signed_at).toISOString() : null,
        
        user_name: row.user_name,
        user_email: row.email,
        user_department: row.user_department,
        user_documenttype: row.user_documenttype,
        user_banknumber: row.user_bankaccount || row.user_banknumber?.toString()
      };
    });

    console.log('🎉 Respuesta formateada. Primer anticipo:', {
      id: anticipos[0]?.id,
      amount: anticipos[0]?.amount,
      status: anticipos[0]?.status,
      user_name: anticipos[0]?.user_name,
      user_documenttype: anticipos[0]?.user_documenttype
    });

    return NextResponse.json(anticipos);

  } catch (error: any) {
    console.error('💥 ERROR en GET:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monto, employeeid } = body;

    console.log('📤 POST crear anticipo para:', employeeid, 'monto:', monto);

    if (!monto || typeof monto !== 'number' || monto <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido. Debe ser un número positivo.' },
        { status: 400 }
      );
    }

    if (!employeeid) {
      return NextResponse.json(
        { error: 'employeeid es requerido' },
        { status: 400 }
      );
    }

    let amountResult;
    try {
      amountResult = await query(
        'SELECT id FROM amounts WHERE amount = $1',
        [monto]
      );
    } catch (dbError: any) {
      console.error('❌ Error consultando amounts:', dbError);
      return NextResponse.json(
        { error: 'Error consultando montos disponibles' },
        { status: 500 }
      );
    }

    if (!amountResult.rows || amountResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Monto ${monto} no está disponible` },
        { status: 400 }
      );
    }

    const amountId = amountResult.rows[0].id;

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    let pendientesResult;
    try {
      pendientesResult = await query(
        `SELECT COUNT(*) as total 
         FROM advances 
         WHERE employeeid = $1 
           AND status = 'Pendiente'
           AND EXTRACT(MONTH FROM request_date) = $2
           AND EXTRACT(YEAR FROM request_date) = $3`,
        [employeeid, mesActual, añoActual]
      );
    } catch (dbError: any) {
      console.error('❌ Error verificando pendientes:', dbError);
    }

    const totalPendientes = pendientesResult ? 
      parseInt(pendientesResult.rows[0]?.total || '0') : 0;
    
    if (totalPendientes > 0) {
      return NextResponse.json(
        { error: 'Ya tienes un anticipo pendiente este mes' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await query(
        `INSERT INTO advances (
          employeeid, 
          amount_id, 
          status, 
          request_date,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'Pendiente', NOW(), NOW(), NOW()) 
        RETURNING id, employeeid, amount_id, status, request_date`,
        [employeeid, amountId]
      );
    } catch (dbError: any) {
      console.error('❌ Error creando anticipo:', dbError);
      return NextResponse.json(
        { error: 'Error creando el anticipo' },
        { status: 500 }
      );
    }

    const nuevoAnticipo = result.rows[0];

    let joinResult;
    try {
      joinResult = await query(`
        SELECT 
          a.id,
          a.employeeid,
          a.amount_id,
          amt.amount,
          a.request_date,
          a.status,
          u.name as user_name,
          u.email,
          u.ou as user_department,
          u.document_type as user_documenttype,
          u.bank_account as user_bankaccount,
          u.bank_number as user_banknumber
        FROM advances a
        LEFT JOIN amounts amt ON a.amount_id = amt.id
        LEFT JOIN users u ON a.employeeid = u.employeeid
        WHERE a.id = $1
      `, [nuevoAnticipo.id]);
    } catch (dbError: any) {
      console.error('❌ Error obteniendo datos completos:', dbError);
      // Devolver al menos los datos básicos
      return NextResponse.json({
        id: nuevoAnticipo.id,
        employeeid: nuevoAnticipo.employeeid,
        amount: monto,
        monto: monto,
        status: nuevoAnticipo.status,
        request_date: nuevoAnticipo.request_date
      }, { status: 201 });
    }

    const anticipoCompleto = joinResult.rows[0];

    const response = {
      id: anticipoCompleto.id,
      employeeid: anticipoCompleto.employeeid,
      amount_id: anticipoCompleto.amount_id,
      amount: anticipoCompleto.amount,
      monto: anticipoCompleto.amount,
      request_date: anticipoCompleto.request_date ? new Date(anticipoCompleto.request_date).toISOString() : null,
      status: anticipoCompleto.status,
      user_name: anticipoCompleto.user_name,
      user_email: anticipoCompleto.email,
      user_department: anticipoCompleto.user_department,
      user_documenttype: anticipoCompleto.user_documenttype,
      user_banknumber: anticipoCompleto.user_bankaccount || anticipoCompleto.user_banknumber?.toString()
    };

    console.log('✅ Anticipo creado:', response);
    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('❌ ERROR POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar anticipo
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { monto, employeeid } = body;

    console.log('✏️ PUT actualizar anticipo:', { id, monto, employeeid });

    if (!monto || typeof monto !== 'number' || monto <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // 1. Obtener amount_id para el nuevo monto
    let amountResult;
    try {
      amountResult = await query(
        'SELECT id FROM amounts WHERE amount = $1',
        [monto]
      );
    } catch (dbError: any) {
      console.error('❌ Error consultando montos:', dbError);
      return NextResponse.json(
        { error: 'Error consultando montos disponibles' },
        { status: 500 }
      );
    }

    if (!amountResult.rows || amountResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Monto ${monto} no está disponible` },
        { status: 400 }
      );
    }

    const nuevoAmountId = amountResult.rows[0].id;

    // 2. Verificar anticipo existente
    let checkResult;
    try {
      checkResult = await query(
        'SELECT status, employeeid, amount_id FROM advances WHERE id = $1',
        [id]
      );
    } catch (dbError: any) {
      console.error('❌ Error verificando anticipo:', dbError);
      return NextResponse.json(
        { error: 'Error verificando anticipo' },
        { status: 500 }
      );
    }

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const { status, employeeid: ownerEmployeeId, amount_id: currentAmountId } = checkResult.rows[0];

    // Validaciones
    if (status !== 'Pendiente') {
      return NextResponse.json(
        { error: 'Solo anticipos pendientes pueden ser editados' },
        { status: 400 }
      );
    }

    if (employeeid && employeeid !== ownerEmployeeId) {
      return NextResponse.json(
        { error: 'No autorizado para editar este anticipo' },
        { status: 403 }
      );
    }

    if (currentAmountId === nuevoAmountId) {
      return NextResponse.json({
        message: 'El anticipo ya tiene este monto'
      });
    }

    // 3. Actualizar
    let result;
    try {
      result = await query(
        `UPDATE advances 
         SET amount_id = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [nuevoAmountId, id]
      );
    } catch (dbError: any) {
      console.error('❌ Error actualizando anticipo:', dbError);
      return NextResponse.json(
        { error: 'Error actualizando anticipo' },
        { status: 500 }
      );
    }

    const updated = result.rows[0];

    // 4. Obtener datos completos actualizados
    let joinResult;
    try {
      joinResult = await query(`
        SELECT 
          a.id,
          a.employeeid,
          a.amount_id,
          amt.amount,
          a.request_date,
          a.status,
          u.name as user_name,
          u.email,
          u.ou as user_department
        FROM advances a
        LEFT JOIN amounts amt ON a.amount_id = amt.id
        LEFT JOIN users u ON a.employeeid = u.employeeid
        WHERE a.id = $1
      `, [id]);
    } catch (dbError: any) {
      console.error('❌ Error obteniendo datos actualizados:', dbError);
      // Devolver datos básicos
      return NextResponse.json({
        success: true,
        message: 'Anticipo actualizado',
        data: {
          id: updated.id,
          employeeid: updated.employeeid,
          amount_id: updated.amount_id,
          amount: monto,
          monto: monto,
          status: updated.status
        }
      });
    }

    const anticipoActualizado = joinResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Anticipo actualizado',
      data: {
        id: anticipoActualizado.id,
        employeeid: anticipoActualizado.employeeid,
        amount_id: anticipoActualizado.amount_id,
        amount: anticipoActualizado.amount,
        monto: anticipoActualizado.amount,
        request_date: anticipoActualizado.request_date ? new Date(anticipoActualizado.request_date).toISOString() : null,
        status: anticipoActualizado.status,
        user_name: anticipoActualizado.user_name,
        user_email: anticipoActualizado.email,
        user_department: anticipoActualizado.user_department
      }
    });

  } catch (error: any) {
    console.error('❌ ERROR PUT:', error);
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar anticipo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const employeeid = searchParams.get('employeeid');

    console.log('🗑️ DELETE anticipo:', { id, employeeid });

    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    // 1. Verificar anticipo existente
    let checkResult;
    try {
      checkResult = await query(
        'SELECT status, employeeid FROM advances WHERE id = $1',
        [id]
      );
    } catch (dbError: any) {
      console.error('❌ Error verificando anticipo:', dbError);
      return NextResponse.json(
        { error: 'Error verificando anticipo' },
        { status: 500 }
      );
    }

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const { status, employeeid: ownerEmployeeId } = checkResult.rows[0];

    // Validaciones
    if (status !== 'Pendiente') {
      return NextResponse.json(
        { error: 'Solo anticipos pendientes pueden ser eliminados' },
        { status: 400 }
      );
    }

    if (employeeid && employeeid !== ownerEmployeeId) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este anticipo' },
        { status: 403 }
      );
    }

    // 2. Eliminar
    try {
      await query('DELETE FROM advances WHERE id = $1', [id]);
    } catch (dbError: any) {
      console.error('❌ Error eliminando anticipo:', dbError);
      return NextResponse.json(
        { error: 'Error eliminando anticipo' },
        { status: 500 }
      );
    }

    console.log('✅ Anticipo eliminado:', id);
    return NextResponse.json({
      success: true,
      message: 'Anticipo eliminado exitosamente',
      deletedId: id
    });

  } catch (error: any) {
    console.error('❌ ERROR DELETE:', error);
    return NextResponse.json(
      { error: 'Error al eliminar' },
      { status: 500 }
    );
  }
}