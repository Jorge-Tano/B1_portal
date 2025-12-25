import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`🔍 GET /admin/api/users/${params.id} - Iniciando`)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `SELECT 
        id, 
        employeeid, 
        name, 
        campaign_id, 
        bank_account, 
        role, 
        document_type,  -- Cambiado
        bank_number,    -- Cambiado
        email,
        telephone,
        mobile,
        ou
       FROM users 
       WHERE id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Usuario encontrado:', result.rows[0])
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error(`❌ Error en GET /admin/api/users/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al obtener usuario',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`📝 PUT /admin/api/users/${params.id} - Iniciando`)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
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
      `UPDATE users 
       SET 
         employeeid = $1,
         name = $2,
         email = $3,
         role = $4,
         campaign_id = $5,
         bank_account = $6,
         document_type = $7,    -- Cambiado
         bank_number = $8,      -- Cambiado
         telephone = $9,
         mobile = $10,
         ou = $11,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
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
        body.ou?.trim() || null,
        id
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Usuario actualizado:', result.rows[0])
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error(`❌ Error en PUT /admin/api/users/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar usuario',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`🗑️ DELETE /admin/api/users/${params.id} - Iniciando`)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `DELETE FROM users 
       WHERE id = $1 
       RETURNING id, employeeid, name`,
      [id]
    )
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Usuario ${id} eliminado:`, result.rows[0])
    return NextResponse.json({ 
      success: true,
      message: 'Usuario eliminado exitosamente',
      deletedUser: result.rows[0]
    })
    
  } catch (error: any) {
    console.error(`❌ Error en DELETE /admin/api/users/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al eliminar usuario',
        message: error.message
      },
      { status: 500 }
    )
  }
}