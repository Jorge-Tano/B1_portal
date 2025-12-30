// app/ejecutivo/api/ej_anticipos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Usuario {
  employeeid: string;
  name: string;
}

// GET - Obtener anticipos del ejecutivo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeid = searchParams.get('employeeid');

    console.log('=== DEBUG API ===');
    console.log('Employee ID recibido:', employeeid);

    if (!employeeid) {
      return NextResponse.json(
        { error: 'Employee ID es requerido' },
        { status: 400 }
      );
    }

    // 1. Primero verifica si la tabla advances existe
    console.log('Verificando tabla advances...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'advances'
      )
    `);

    console.log('¿Tabla advances existe?:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Consulta MUY simple
    console.log('Ejecutando consulta simple...');
    const result = await query(`
      SELECT 
        id,
        employeeid,
        amount_id,
        request_date,
        status
      FROM advances 
      WHERE employeeid = $1 
      ORDER BY request_date DESC
    `, [employeeid]);

    console.log('Resultados encontrados:', result.rows.length);
    console.log('Primer resultado:', result.rows[0]);
    console.log('=== FIN DEBUG ===');

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('❌ ERROR COMPLETO EN API:', error);
    return NextResponse.json(
      {
        error: 'Error interno',
        message: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}


// POST - Crear nuevo anticipo
export async function POST(request: NextRequest) {
  try {
    // 1. Leer body
    const body = await request.json();
    const { monto, employeeid } = body;

    console.log('📤 POST crear anticipo:', { monto, employeeid });

    if (!monto || typeof monto !== 'number') {
      return NextResponse.json(
        { error: 'Monto inválido. Debe ser un número.' },
        { status: 400 }
      );
    }

    if (!employeeid || typeof employeeid !== 'string') {
      return NextResponse.json(
        { error: 'employeeid es requerido y debe ser texto' },
        { status: 400 }
      );
    }

    const employeeidClean = employeeid.trim();

    // 2. Validar monto
    const montosPermitidos = [300000, 400000, 500000];
    if (!montosPermitidos.includes(monto)) {
      return NextResponse.json(
        {
          error: 'Monto no permitido',
          montos_permitidos: montosPermitidos
        },
        { status: 400 }
      );
    }

    // 3. Verificar que el employeeid existe
    const userCheck = await query(
      'SELECT employeeid, name FROM users WHERE employeeid = $1',
      [employeeidClean]
    );

    if (userCheck.rows.length === 0) {
      const allUsers = await query('SELECT employeeid, name FROM users ORDER BY employeeid', []);
      const validEmployeeIds = allUsers.rows.map((row: any) => row.employeeid);

      return NextResponse.json(
        {
          error: 'Employee ID no encontrado',
          valid_employeeids: validEmployeeIds,
          message: `El Employee ID "${employeeidClean}" no existe en el sistema.`
        },
        { status: 400 }
      );
    }

    const usuario = userCheck.rows[0] as Usuario;

    // 4. Verificar período de solicitud (15-30 de cada mes)
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const estaEnPeriodoSolicitud = diaActual >= 15 && diaActual <= 30;

    if (!estaEnPeriodoSolicitud) {
      return NextResponse.json(
        {
          error: 'Fuera del período de solicitud',
          dia_actual: diaActual,
          periodo_permitido: '15 al 30 de cada mes',
          message: 'Solo puedes solicitar anticipos entre el 15 y 30 de cada mes.'
        },
        { status: 400 }
      );
    }

    // 5. Verificar límite de anticipos (1 por mes)
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    const anticiposEsteMes = await query(
      `SELECT COUNT(*) as total 
       FROM advances 
       WHERE employeeid = $1 
         AND EXTRACT(MONTH FROM request_date) = $2
         AND EXTRACT(YEAR FROM request_date) = $3`,
      [employeeidClean, mesActual, añoActual]
    );

    const totalAnticipos = parseInt(anticiposEsteMes.rows[0]?.total || '0');
    if (totalAnticipos >= 1) {
      return NextResponse.json(
        {
          error: 'Límite de anticipos alcanzado',
          message: 'Solo puedes solicitar 1 anticipo por mes.'
        },
        { status: 400 }
      );
    }

    // 6. Buscar el amount_id correspondiente al monto
    let amountId = null;
    const amountResult = await query(
      'SELECT id FROM amounts WHERE amount_value = $1',
      [monto]
    );

    if (amountResult.rows.length > 0) {
      amountId = amountResult.rows[0].id;
    }

    // 7. Crear anticipo con estado Pending (pendiente)
    const result = await query(
      `INSERT INTO advances (employeeid, amount, status, request_date, amount_id) 
       VALUES ($1, $2, 'Pending', NOW(), $3) 
       RETURNING *`,
      [usuario.employeeid, monto, amountId]
    );

    const nuevoAnticipo = result.rows[0];

    // 8. Obtener datos completos del anticipo creado
    const advanceResult = await query(
      `SELECT 
        a.id,
        a.employeeid,
        COALESCE(amt.amount_value, a.amount) as amount,
        a.request_date,
        a.status,
        a.amount_id,
        u.name as user_name,
        u.employeeid as user_employeeid,
        u.department
      FROM advances a
      LEFT JOIN users u ON a.employeeid = u.employeeid
      LEFT JOIN amounts amt ON a.amount_id = amt.id
      WHERE a.id = $1`,
      [nuevoAnticipo.id]
    );

    const anticipoCompleto = advanceResult.rows[0];

    console.log('✅ Anticipo creado exitosamente:', anticipoCompleto.id);

    return NextResponse.json({
      ...anticipoCompleto,
      message: `Anticipo solicitado exitosamente. Está pendiente de aprobación.`
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error POST anticipo ejecutivo:', error);

    // Errores específicos de PostgreSQL
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error: 'El Employee ID no existe en la tabla users',
          code: error.code
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar anticipo (estados en español)
export async function PUT(request: NextRequest) {
  try {
    console.log('=== PUT ACTUALIZAR ANTICIPO ===');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('ID recibido para actualizar:', id);

    if (!id) {
      console.error('❌ ID faltante');
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { monto, employeeid } = body;

    console.log('Datos recibidos:', { monto, employeeid });

    if (!monto || typeof monto !== 'number') {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Validar monto permitido
    const montosPermitidos = [300000, 400000, 500000];
    if (!montosPermitidos.includes(monto)) {
      return NextResponse.json(
        {
          error: 'Monto no permitido',
          montos_permitidos: montosPermitidos
        },
        { status: 400 }
      );
    }

    // Verificar que el anticipo existe y está pendiente
    console.log('Verificando anticipo ID:', id);
    const checkResult = await query(
      'SELECT status, employeeid, amount_id FROM advances WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      console.error('❌ Anticipo no encontrado');
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const currentStatus = checkResult.rows[0].status;
    const advanceEmployeeId = checkResult.rows[0].employeeid;
    const currentAmountId = checkResult.rows[0].amount_id;

    console.log('Estado actual:', currentStatus);
    console.log('EmployeeID del anticipo:', advanceEmployeeId);
    console.log('EmployeeID solicitante:', employeeid);
    console.log('Amount_id actual:', currentAmountId);
    console.log('Nuevo monto:', monto);

    // ¡IMPORTANTE! Verificar que el estado sea 'Pendiente' (español)
    if (currentStatus !== 'Pendiente') {
      console.error('❌ Anticipo no está pendiente (status:', currentStatus, ')');
      return NextResponse.json(
        {
          error: 'No se puede editar este anticipo',
          message: 'Solo se pueden editar anticipos que están pendientes.',
          current_status: currentStatus
        },
        { status: 400 }
      );
    }

    // Verificar que el employeeid coincide (seguridad)
    if (employeeid && employeeid !== advanceEmployeeId) {
      console.error('❌ EmployeeID no coincide');
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'No puedes editar anticipos de otros empleados.'
        },
        { status: 403 }
      );
    }

    // Buscar el amount_id correspondiente al monto
    console.log('Buscando amount_id para monto:', monto);

    let newAmountId = null;

    // Método 1: Buscar en tabla amounts si existe
    try {
      const amountCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'amounts'
        )
      `);

      const hasAmountsTable = amountCheck.rows[0].exists;
      console.log('¿Tabla amounts existe?:', hasAmountsTable);

      if (hasAmountsTable) {
        // Intentar diferentes nombres de columna
        const columnQueries = [
          'SELECT id FROM amounts WHERE amount = $1',
          'SELECT id FROM amounts WHERE value = $1',
          'SELECT id FROM amounts WHERE monto = $1',
          'SELECT id FROM amounts WHERE amount_value = $1'
        ];

        for (const queryStr of columnQueries) {
          try {
            const amountResult = await query(queryStr, [monto]);
            if (amountResult.rows.length > 0) {
              newAmountId = amountResult.rows[0].id;
              console.log('✅ Amount_id encontrado:', newAmountId);
              break;
            }
          } catch (error) {
            // Continuar con la siguiente consulta
          }
        }
      }
    } catch (error) {
      console.log('Error buscando en tabla amounts:', error);
    }

    // Método 2: Si no se encontró, usar mapeo manual
    if (!newAmountId) {
      console.log('Usando mapeo manual para amount_id');
      const montoToIdMap: { [key: number]: number } = {
        300000: 1,
        400000: 2,
        500000: 3
      };

      if (montoToIdMap[monto]) {
        newAmountId = montoToIdMap[monto];
        console.log('✅ Usando mapeo manual, amount_id:', newAmountId);
      }
    }

    if (!newAmountId) {
      console.error('❌ No se pudo determinar el amount_id para el monto:', monto);
      return NextResponse.json(
        {
          error: 'Error en el monto',
          message: 'No se pudo encontrar el ID correspondiente al monto especificado.',
          monto_solicitado: monto
        },
        { status: 400 }
      );
    }

    // Verificar que el nuevo amount_id sea diferente al actual
    if (newAmountId === currentAmountId) {
      console.log('⚠️ El monto es el mismo, no hay cambios necesarios');
      return NextResponse.json(
        {
          message: 'El anticipo ya tiene este monto, no se realizaron cambios.',
          current_amount_id: currentAmountId
        },
        { status: 200 }
      );
    }

    // Actualizar solo el amount_id
    console.log('Actualizando amount_id de', currentAmountId, 'a', newAmountId);

    const result = await query(
      `UPDATE advances SET amount_id = $1 WHERE id = $2 RETURNING *`,
      [newAmountId, id]
    );

    const updatedAdvance = result.rows[0];
    console.log('✅ Anticipo actualizado:', updatedAdvance);

    console.log('=== FIN PUT ===');

    return NextResponse.json({
      success: true,
      message: 'Anticipo actualizado exitosamente',
      id: updatedAdvance.id,
      employeeid: updatedAdvance.employeeid,
      amount_id: updatedAdvance.amount_id,
      amount: monto, // Devolver el monto que se envió
      request_date: updatedAdvance.request_date,
      status: updatedAdvance.status
    });

  } catch (error: any) {
    console.error('❌ Error PUT anticipo:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar anticipo',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar anticipo (estados en español)
export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE ELIMINAR ANTICIPO ===');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const employeeid = searchParams.get('employeeid');

    console.log('ID para eliminar:', id);
    console.log('EmployeeID solicitante:', employeeid);

    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el anticipo existe y está pendiente
    const checkResult = await query(
      'SELECT status, employeeid FROM advances WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      console.error('❌ Anticipo no encontrado');
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const currentStatus = checkResult.rows[0].status;
    const advanceEmployeeId = checkResult.rows[0].employeeid;

    console.log('Estado actual:', currentStatus);
    console.log('EmployeeID del anticipo:', advanceEmployeeId);

    // ¡IMPORTANTE! Estado debe ser 'Pendiente' (español)
    if (currentStatus !== 'Pendiente') {
      console.error('❌ Anticipo no está pendiente (status:', currentStatus, ')');
      return NextResponse.json(
        {
          error: 'No se puede eliminar este anticipo',
          message: 'Solo se pueden eliminar anticipos que están pendientes.',
          current_status: currentStatus
        },
        { status: 400 }
      );
    }

    // Verificar que el employeeid coincide (seguridad)
    if (employeeid && employeeid !== advanceEmployeeId) {
      console.error('❌ EmployeeID no coincide');
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'No puedes eliminar anticipos de otros empleados.'
        },
        { status: 403 }
      );
    }

    // Eliminar anticipo
    console.log('Eliminando anticipo ID:', id);
    await query('DELETE FROM advances WHERE id = $1', [id]);

    console.log('✅ Anticipo eliminado exitosamente');
    console.log('=== FIN DELETE ===');

    return NextResponse.json({
      success: true,
      message: 'Anticipo eliminado exitosamente',
      id: id
    });

  } catch (error: any) {
    console.error('❌ Error DELETE anticipo:', error.message);

    // Error específico de foreign key
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error: 'No se puede eliminar el anticipo',
          message: 'El anticipo tiene relaciones con otras tablas.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error al eliminar anticipo',
        message: error.message
      },
      { status: 500 }
    );
  }
}