import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  console.log('🔍 GET /admin/api/users - Iniciando')
  
  try {
    const result = await query(`
      SELECT 
        id, 
        employeeid, 
        name, 
        campaign_id, 
        bank_account, 
        role, 
        document_type,  -- Cambiado de documenttype
        bank_number,    -- Cambiado de banknumber
        email,
        telephone,
        mobile,
        ou,
        created_at,
        updated_at
      FROM users 
      ORDER BY id ASC
    `)
    
    console.log(`✅ Se encontraron ${result.rowCount} usuarios`)
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('❌ Error en GET /admin/api/users:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    
    return NextResponse.json(
      { 
        error: 'Error al obtener usuarios',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log('📝 POST /admin/api/users - Iniciando')
  
  try {
    const body = await request.json()
    console.log('📦 Body recibido:', body)
    
    // Validaciones básicas
    if (!body.employeeid || body.employeeid.trim() === '') {
      return NextResponse.json(
        { error: 'El ID de empleado es requerido' },
        { status: 400 }
      )
    }
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `INSERT INTO users (
        employeeid, name, email, role, campaign_id, 
        bank_account, document_type, bank_number, telephone, mobile, ou
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        body.employeeid.trim(),
        body.name.trim(),
        body.email?.trim() || null,
        body.role || 'ejecutivo',
        body.campaign_id ? parseInt(body.campaign_id) : null,
        body.bank_account?.trim() || null,
        body.document_type ? parseInt(body.document_type) : null,  // Cambiado
        body.bank_number ? parseInt(body.bank_number) : null,      // Cambiado
        body.telephone?.trim() || null,
        body.mobile?.trim() || null,
        body.ou?.trim() || null
      ]
    )
    
    console.log('✅ Usuario creado:', result.rows[0])
    return NextResponse.json(result.rows[0], { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Error en POST /admin/api/users:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    
    // Manejo de error de duplicado
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          error: 'Usuario duplicado',
          message: 'Ya existe un usuario con ese ID de empleado',
          detail: error.detail
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear usuario',
        message: error.message,
        detail: error.detail
      },
      { status: 500 }
    )
  }
}