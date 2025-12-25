// app/api/anticipos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Definir tipos explícitamente
interface Usuario {
  employeeid: string;
  name: string;
}

interface UserRow {
  employeeid: string;
  name: string;
}

// GET - Obtener anticipos (para todos o filtrado por employeeid)
export async function GET(request: NextRequest) {
  try {
    console.log('📨 GET /api/anticipos');
    
    // Opción: permitir filtrar por employeeid via query params
    const { searchParams } = new URL(request.url);
    const employeeid = searchParams.get('employeeid');
    
    let querySQL = `
      SELECT 
        a.*,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM anticipos a
      JOIN users u ON a.employeeid = u.employeeid
    `;
    
    const queryParams: any[] = [];
    
    if (employeeid) {
      querySQL += ` WHERE a.employeeid = $1`;
      queryParams.push(employeeid);
      console.log(`🔍 Buscando anticipos para employeeid: ${employeeid}`);
    }
    
    querySQL += ` ORDER BY a.fecha_solicitud DESC`;
    
    const result = await query(querySQL, queryParams);
    
    console.log(`✅ ${result.rows.length} anticipos encontrados`);
    return NextResponse.json(result.rows);
    
  } catch (error: any) {
    console.error('❌ Error GET:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear anticipo (VERSIÓN SIMPLIFICADA)
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/anticipos - INICIANDO');
  
  try {
    // 1. Leer body
    const body = await request.json();
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));
    
    // 2. Extraer datos
    const { monto, employeeid } = body;
    
    console.log('🔍 Datos extraídos:', { monto, employeeid });
    
    // 3. Validaciones básicas
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
    
    // 4. Validar monto
    const montosPermitidos = [300000, 400000, 500000];
    if (!montosPermitidos.includes(monto)) {
      return NextResponse.json(
        { 
          error: 'Monto no permitido',
          montos_permitidos: montosPermitidos,
          monto_recibido: monto
        },
        { status: 400 }
      );
    }
    
    // 5. Primero, veamos qué usuarios existen
    console.log('🔍 Listando todos los usuarios disponibles...');
    const allUsers = await query('SELECT employeeid, name FROM users ORDER BY employeeid', []);
    console.log('👥 Usuarios disponibles:', allUsers.rows);
    
    // 6. Verificar que el employeeid existe (case-sensitive)
    console.log(`🔍 Verificando usuario exacto: "${employeeid}"`);
    
    const userCheck = await query(
      'SELECT employeeid, name FROM users WHERE employeeid = $1',
      [employeeid.trim()]
    );
    
    if (userCheck.rows.length === 0) {
      // Proporcionar lista de employeeids válidos
      const userRows = allUsers.rows as UserRow[];
      const validEmployeeIds = userRows.map((user: UserRow) => user.employeeid);
      
      return NextResponse.json(
        { 
          error: 'Employee ID no encontrado',
          employeeid_provided: employeeid,
          valid_employeeids: validEmployeeIds,
          message: `El Employee ID "${employeeid}" no existe. Usa uno de: ${validEmployeeIds.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    // Usar tipo explícito
    const usuario = userCheck.rows[0] as Usuario;
    console.log(`✅ Usuario encontrado: ${usuario.name} (${usuario.employeeid})`);
    
    // 7. Verificar período de solicitud (15-25 de cada mes) - OPCIONAL
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const estaEnPeriodoSolicitud = diaActual >= 15 && diaActual <= 25;
    
    if (!estaEnPeriodoSolicitud) {
      return NextResponse.json(
        { 
          error: 'Fuera del período de solicitud',
          dia_actual: diaActual,
          periodo_permitido: '15 al 25 de cada mes',
          message: 'Solo puedes solicitar anticipos entre el 15 y 25 de cada mes.'
        },
        { status: 400 }
      );
    }
    
    // 8. Verificar límite de anticipos (1 por mes) - OPCIONAL
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();
    
    const anticiposEsteMes = await query(
      `SELECT COUNT(*) as total 
       FROM anticipos 
       WHERE employeeid = $1 
         AND EXTRACT(MONTH FROM fecha_solicitud) = $2
         AND EXTRACT(YEAR FROM fecha_solicitud) = $3`,
      [employeeid, mesActual, añoActual]
    );
    
    const totalAnticipos = parseInt(anticiposEsteMes.rows[0]?.total || '0');
    if (totalAnticipos >= 1) {
      return NextResponse.json(
        { 
          error: 'Límite de anticipos alcanzado',
          total_anticipos_este_mes: totalAnticipos,
          limite: 1,
          message: 'Solo puedes solicitar 1 anticipo por mes.'
        },
        { status: 400 }
      );
    }
    
    // 9. Crear anticipo
    console.log('📝 Insertando en la base de datos...');
    
    const result = await query(
      `INSERT INTO anticipos (employeeid, monto, estado, fecha_solicitud) 
       VALUES ($1, $2, 'Aprobado', NOW()) 
       RETURNING *`,
      [employeeid, monto]
    );
    
    const nuevoAnticipo = result.rows[0];
    console.log('🎉 Anticipo creado:', nuevoAnticipo);
    
    return NextResponse.json({
      ...nuevoAnticipo,
      usuario_nombre: usuario.name,
      message: `Anticipo creado exitosamente para ${usuario.name}`
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('💥 ERROR:', error);
    
    // Errores específicos de PostgreSQL
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          error: 'El Employee ID no existe en la tabla users',
          code: error.code,
          detail: error.detail
        },
        { status: 400 }
      );
    }
    
    if (error.code === '42703') {
      return NextResponse.json(
        { 
          error: 'Error de columna',
          message: error.message,
          suggestion: 'Verifica que las columnas en la tabla anticipos sean: id, employeeid, monto, estado, fecha_solicitud'
        },
        { status: 500 }
      );
    }
    
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
    const { monto } = body;
    
    if (!monto || typeof monto !== 'number') {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }
    
    const result = await query(
      `UPDATE anticipos 
       SET monto = $1, fecha_solicitud = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [monto, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error: any) {
    console.error('Error PUT:', error.message);
    return NextResponse.json(
      { error: 'Error al actualizar anticipo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar anticipo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }
    
    await query('DELETE FROM anticipos WHERE id = $1', [id]);
    
    return NextResponse.json(
      { success: true, message: 'Anticipo eliminado' }
    );
    
  } catch (error: any) {
    console.error('Error DELETE:', error.message);
    return NextResponse.json(
      { error: 'Error al eliminar anticipo' },
      { status: 500 }
    );
  }
}