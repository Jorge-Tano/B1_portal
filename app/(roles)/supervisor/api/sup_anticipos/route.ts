// app/encargado/api/sup_anticipos/route.ts
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
    const estado = searchParams.get('estado'); 
    const tipo = searchParams.get('tipo');
    const filtro = searchParams.get('filtro');

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

    if (employeeid) {
      return await obtenerAnticiposPorUsuario(employeeid);
    }

    if (estado) {
      return await obtenerAnticiposPorEstado(estado);
    }

    if (tipo === 'estadisticas') {
      return await obtenerEstadisticas(usuario);
    }

    if (filtro) {
      return await obtenerReporte(filtro);
    }

    return await obtenerAnticiposPendientes();

  } catch (error: any) {
    console.error('Error GET en_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos' },
      { status: 500 }
    );
  }
}

async function obtenerAnticiposPorEstado(estado: string) {
  try {
    
    let estadoBD = '';
    
    if (estado.toLowerCase() === 'aprobado') {
      estadoBD = 'Aprobado';
    } else if (estado.toLowerCase() === 'rechazado') {
      estadoBD = 'Rechazado';
    } else if (estado.toLowerCase() === 'pendiente') {
      estadoBD = 'Pendiente';
    } else {
      return NextResponse.json(
        { error: 'Estado no válido. Use "pendiente", "aprobado" o "rechazado"' },
        { status: 400 }
      );
    }
    
    const result = await query(
      `SELECT 
        a.*,
        am.amount as monto_valor,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      WHERE a.status = $1
      ORDER BY a.request_date DESC`,
      [estadoBD]
    );

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener anticipos por estado:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos' },
      { status: 500 }
    );
  }
}

async function obtenerTodosAnticipos() {
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
      ORDER BY a.request_date DESC`
    );


    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener todos los anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos' },
      { status: 500 }
    );
  }
}

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


    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener anticipos por usuario:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos del usuario' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.accionMasiva === true && Array.isArray(body.ids)) {
      return await procesarAccionMasiva(body);
    }
    
    return await crearAnticipoIndividual(request);
  } catch (error: any) {
    console.error('Error POST en_anticipos:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function procesarAccionMasiva(body: any) {
  try {
    const { ids, accion } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron IDs válidos' },
        { status: 400 }
      );
    }
    
    if (!['aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción no válida. Use "aprobar" o "rechazar"' },
        { status: 400 }
      );
    }
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const anticiposCheck = await query(
      `SELECT * FROM advances WHERE id IN (${placeholders}) AND status = 'Pendiente'`,
      ids
    );
    
    if (anticiposCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron anticipos pendientes con los IDs proporcionados' },
        { status: 404 }
      );
    }
    
    if (anticiposCheck.rows.length !== ids.length) {
      console.warn(`⚠️ Solo ${anticiposCheck.rows.length} de ${ids.length} anticipos están pendientes`);
    }
    
    const nuevoEstado = accion === 'aprobar' ? 'Aprobado' : 'Rechazado';
    
    const updatePlaceholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const updateQuery = `
      UPDATE advances 
      SET status = $${ids.length + 1}, updated_at = NOW()
      WHERE id IN (${updatePlaceholders}) AND status = 'Pendiente'
      RETURNING *
    `;
    
    const result = await query(updateQuery, [...ids, nuevoEstado]);
    
    
    const updatedPlaceholders = result.rows.map((_, i) => `$${i + 1}`).join(',');
    const anticiposCompletos = await query(
      `SELECT 
        a.*,
        am.amount as monto_valor,
        u.name as usuario_nombre,
        u.employeeid as usuario_employeeid
      FROM advances a
      LEFT JOIN amounts am ON a.amount_id = am.id
      LEFT JOIN users u ON a.employeeid = u.employeeid
      WHERE a.id IN (${updatedPlaceholders})
      ORDER BY a.request_date DESC`,
      result.rows.map(a => a.id)
    );
    
    return NextResponse.json({
      success: true,
      message: `${result.rows.length} anticipos ${accion === 'aprobar' ? 'aprobados' : 'rechazados'} exitosamente`,
      total: result.rows.length,
      anticipos: anticiposCompletos.rows
    });
    
  } catch (error: any) {
    console.error('Error en procesarAccionMasiva:', error.message);
    return NextResponse.json(
      { error: 'Error al procesar acción masiva', details: error.message },
      { status: 500 }
    );
  }
}

async function crearAnticipoIndividual(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { monto, employeeid } = body;


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

    const hoy = new Date();
    const diaActual = hoy.getDate();
    const estaEnPeriodoSolicitud = diaActual >= 1 && diaActual <= 31;

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

    const result = await query(
      `INSERT INTO advances (employeeid, amount_id, status, request_date) 
   VALUES ($1, $2, 'Pendiente', NOW()) 
   RETURNING *`,
      [employeeid, amount_id]
    );

    const nuevoAnticipo = result.rows[0];

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
    console.error('Error crearAnticipoIndividual:', error);
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
      querySQL += ` AND a.status = 'Aprobado'`;
    } else if (filtro === 'rechazados') {
      querySQL += ` AND a.status = 'Rechazado'`;
    } else if (filtro === 'pendientes') {
      querySQL += ` AND a.status = 'Pendiente'`;
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

    if (anticipo.status !== 'Pendiente') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar anticipos pendientes' },
        { status: 400 }
      );
    }

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
      WHERE a.status = 'Pendiente'
      ORDER BY a.request_date ASC`
    );

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Error al obtener anticipos pendientes:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener anticipos pendientes' },
      { status: 500 }
    );
  }
}

async function obtenerEstadisticas(usuario: Usuario) {
  try {
    const estadisticasResult = await query(
      `SELECT 
        COUNT(*) as total_anticipos,
        SUM(CASE WHEN status = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN status = 'Aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN status = 'Rechazado' THEN 1 ELSE 0 END) as rechazados
      FROM advances`
    );

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    const estadisticasMesResult = await query(
      `SELECT 
        COUNT(*) as total_mes,
        SUM(CASE WHEN status = 'Pendiente' THEN 1 ELSE 0 END) as pendientes_mes,
        SUM(CASE WHEN status = 'Aprobado' THEN 1 ELSE 0 END) as aprobados_mes,
        SUM(CASE WHEN status = 'Rechazado' THEN 1 ELSE 0 END) as rechazados_mes,
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
    const accion = searchParams.get('accion'); 

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

      if (anticipo.status !== 'Pendiente') {
        return NextResponse.json(
          { error: 'Solo puedes editar anticipos pendientes' },
          { status: 400 }
        );
      }

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

      const result = await query(
        `UPDATE advances 
         SET amount_id = $1, request_date = NOW(), updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
        [amount_id, id]
      );

      const anticipoActualizado = await query(
        `SELECT a.*, am.amount as monto_valor 
         FROM advances a 
         LEFT JOIN amounts am ON a.amount_id = am.id 
         WHERE a.id = $1`,
        [id]
      );

      return NextResponse.json(anticipoActualizado.rows[0]);
    }

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

    if (anticipo.status !== 'Pendiente') {
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