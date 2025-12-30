// app/encargado/api/en_anticipos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Usuario {
  id: number;
  employeeid: string;
  name: string;
}

interface Anticipo {
  id: number;
  employeeid: string;
  amount_id: number;
  request_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeid = searchParams.get('employeeid');
    const tipo = searchParams.get('tipo');
    const filtro = searchParams.get('filtro'); // Para reportes

    const userResult = await query(
      'SELECT id, employeeid, name FROM users WHERE email = $1 OR employeeid = $2',
      [session.user.email, session.user.adUser?.employeeID]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const usuario = userResult.rows[0] as Usuario;

    // Si pasa employeeid, obtener anticipos de ese usuario específico
    if (employeeid) {
      return await obtenerAnticiposPorUsuario(employeeid);
    }

    // Si pide estadísticas
    if (tipo === 'estadisticas') {
      return await obtenerEstadisticas(usuario);
    }

    // Si es para reportes con filtro
    if (filtro) {
      return await obtenerReporte(filtro);
    }

    // Por defecto, obtener anticipos pendientes
    return await obtenerAnticiposPendientes();

  } catch (error: any) {
    console.error('Error GET en_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos' },
      { status: 500 }
    );
  }
}

// Obtener anticipos de un usuario específico
async function obtenerAnticiposPorUsuario(employeeid: string) {
  try {
    const result = await query(
      `SELECT 
        a.*,
        am.amount as monto_valor,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      WHERE a.employeeid = $1
      ORDER BY a.request_date DESC`,
      [employeeid]
    );

    console.log(`Anticipos encontrados para ${employeeid}:`, result.rows.length);

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener anticipos por usuario:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos del usuario' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo anticipo
export async function POST(request: NextRequest) {
  try {
    // Validación de sesión
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { monto, employeeid } = body;

    console.log('📥 Creando anticipo desde modal:', { monto, employeeid });
    console.log('👤 Usuario en sesión:', session.user);

    // Validaciones básicas
    if (!monto || typeof monto !== 'number') {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    if (!employeeid) {
      return NextResponse.json(
        { error: 'Employee ID requerido' },
        { status: 400 }
      );
    }

    // Verificar que el monto existe en amounts y obtener el amount_id
    const montoCheck = await query(
      'SELECT id FROM amounts WHERE amount = $1',
      [monto]
    );

    if (montoCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Monto no permitido',
          montos_permitidos: [300000, 400000, 500000],
          details: `El monto ${monto} no existe en la tabla amounts`
        },
        { status: 400 }
      );
    }

    const amount_id = montoCheck.rows[0].id;
    console.log('✅ amount_id encontrado:', amount_id);

    // Verificar que el usuario existe
    const userCheck = await query(
      'SELECT employeeid, name FROM users WHERE employeeid = $1',
      [employeeid]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 400 }
      );
    }

    const usuario = userCheck.rows[0];

    // Verificar período de solicitud (15-30 de cada mes)
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

    // Verificar límite de anticipos (1 por mes)
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    const anticiposEsteMes = await query(
      `SELECT COUNT(*) as total 
       FROM advances 
       WHERE employeeid = $1 
         AND EXTRACT(MONTH FROM request_date) = $2
         AND EXTRACT(YEAR FROM request_date) = $3`,
      [employeeid, mesActual, añoActual]
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

    // Crear el anticipo usando amount_id
    const result = await query(
      `INSERT INTO advances (employeeid, amount_id, status, request_date) 
   VALUES ($1, $2, 'Pendiente', NOW()) 
   RETURNING *`,
      [employeeid, amount_id]
    );

    const nuevoAnticipo = result.rows[0];

    // Obtener información completa con JOIN a amounts
    const anticipoCompleto = await query(
      `SELECT a.*, am.amount as monto_valor 
       FROM advances a 
       LEFT JOIN amounts am ON a.amount_id = am.id 
       WHERE a.id = $1`,
      [nuevoAnticipo.id]
    );

    return NextResponse.json({
      ...anticipoCompleto.rows[0],
      message: 'Anticipo solicitado exitosamente. Pendiente de aprobación.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error POST en_anticipos:', error);
    console.error('Stack trace:', error.stack);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// Función para obtener reportes
async function obtenerReporte(filtro: string) {
  try {
    let querySQL = `
      SELECT 
        a.*,
        am.amount as monto_valor,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filtro === 'aprobados') {
      querySQL += ` AND a.status = 'Approved'`;
    } else if (filtro === 'rechazados') {
      querySQL += ` AND a.status = 'Rejected'`;
    } else if (filtro === 'pendientes') {
      querySQL += ` AND a.status = 'Pending'`;
    }

    querySQL += ` ORDER BY a.request_date DESC`;

    const result = await query(querySQL, params);

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener reporte:', error.message);
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar anticipo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el anticipo existe
    const anticipoCheck = await query(
      'SELECT * FROM advances WHERE id = $1',
      [id]
    );

    if (anticipoCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const anticipo = anticipoCheck.rows[0] as Anticipo;

    // Solo permitir eliminar si está pendiente
    if (anticipo.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar anticipos pendientes' },
        { status: 400 }
      );
    }

    // Eliminar anticipo
    await query('DELETE FROM advances WHERE id = $1', [id]);

    return NextResponse.json(
      { success: true, message: 'Anticipo eliminado exitosamente' }
    );

  } catch (error: any) {
    console.error('Error DELETE en_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error al eliminar anticipo' },
      { status: 500 }
    );
  }
}

async function obtenerAnticiposPendientes() {
  try {
    const result = await query(
      `SELECT 
        a.*,
        am.amount as monto_valor,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      WHERE a.status = 'Pending'
      ORDER BY a.request_date ASC`
    );

    console.log('Anticipos pendientes encontrados:', result.rows.length);

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener anticipos pendientes:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos pendientes' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener estadísticas
async function obtenerEstadisticas(usuario: Usuario) {
  try {
    // Obtener estadísticas generales
    const estadisticasResult = await query(
      `SELECT 
        COUNT(*) as total_anticipos,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rechazados
      FROM advances`
    );

    // Obtener estadísticas de este mes
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    const estadisticasMesResult = await query(
      `SELECT 
        COUNT(*) as total_mes,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendientes_mes,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as aprobados_mes,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rechazados_mes,
        COALESCE(SUM(am.amount), 0) as monto_total_mes
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      WHERE EXTRACT(MONTH FROM request_date) = $1
        AND EXTRACT(YEAR FROM request_date) = $2`,
      [mesActual, añoActual]
    );

    return NextResponse.json({
      general: estadisticasResult.rows[0],
      este_mes: estadisticasMesResult.rows[0],
      usuario: {
        nombre: usuario.name,
        employeeid: usuario.employeeid
      }
    });

  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

// PUT - Aprobar o rechazar anticipo O Actualizar monto
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const accion = searchParams.get('accion'); // 'aprobar' o 'rechazar'

    // Obtener información del usuario logueado
    const userResult = await query(
      'SELECT id, employeeid, name FROM users WHERE email = $1 OR employeeid = $2',
      [session.user.email, session.user.adUser?.employeeID]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const usuario = userResult.rows[0] as Usuario;

    // Si es una actualización de monto (sin acción)
    if (!accion) {
      const body = await request.json();
      const { monto } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'ID de anticipo requerido' },
          { status: 400 }
        );
      }

      if (!monto || typeof monto !== 'number') {
        return NextResponse.json(
          { error: 'Monto inválido' },
          { status: 400 }
        );
      }

      // Verificar que el anticipo existe y está pendiente
      const anticipoCheck = await query(
        'SELECT * FROM advances WHERE id = $1',
        [id]
      );

      if (anticipoCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Anticipo no encontrado' },
          { status: 404 }
        );
      }

      const anticipo = anticipoCheck.rows[0] as Anticipo;

      if (anticipo.status !== 'Pending') {
        return NextResponse.json(
          { error: 'Solo puedes editar anticipos pendientes' },
          { status: 400 }
        );
      }

      // Obtener el nuevo amount_id basado en el monto
      const montoCheck = await query(
        'SELECT id FROM amounts WHERE amount = $1',
        [monto]
      );

      if (montoCheck.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'Monto no configurado en el sistema',
            message: `El monto ${monto} no está configurado. Contacte al administrador.`
          },
          { status: 400 }
        );
      }

      const amount_id = montoCheck.rows[0].id;

      // Actualizar amount_id y fecha
      const result = await query(
        `UPDATE advances 
         SET amount_id = $1, request_date = NOW(), updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
        [amount_id, id]
      );

      // Obtener información completa con el monto actualizado
      const anticipoActualizado = await query(
        `SELECT a.*, am.amount as monto_valor 
         FROM advances a 
         LEFT JOIN amounts am ON a.amount_id = am.id 
         WHERE a.id = $1`,
        [id]
      );

      return NextResponse.json(anticipoActualizado.rows[0]);
    }

    // Si es aprobar/rechazar
    if (!id) {
      return NextResponse.json(
        { error: 'ID de anticipo requerido' },
        { status: 400 }
      );
    }

    if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción no válida. Use "aprobar" o "rechazar"' },
        { status: 400 }
      );
    }

    // Verificar que el anticipo existe
    const anticipoCheck = await query(
      'SELECT * FROM advances WHERE id = $1',
      [id]
    );

    if (anticipoCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anticipo no encontrado' },
        { status: 404 }
      );
    }

    const anticipo = anticipoCheck.rows[0] as Anticipo;

    // Verificar que el anticipo está pendiente
    if (anticipo.status !== 'Pending') {
      return NextResponse.json(
        { error: `El anticipo ya está ${anticipo.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    let nuevoEstado = '';
    let mensaje = '';

    if (accion === 'aprobar') {
      nuevoEstado = 'Aprobado';
      mensaje = 'Anticipo aprobado exitosamente';
    } else {
      nuevoEstado = 'Rechazado';
      mensaje = 'Anticipo rechazado exitosamente';
    }

    // Actualizar estado del anticipo
    const result = await query(
      `UPDATE advances 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [nuevoEstado, id]
    );

    return NextResponse.json({
      ...result.rows[0],
      message: mensaje,
      aprobado_por: usuario.name
    });

  } catch (error: any) {
    console.error('Error PUT en_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}