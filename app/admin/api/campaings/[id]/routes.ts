import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`🔍 GET /admin/api/campaigns/${params.id} - Iniciando`)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `SELECT id, name, principal_id 
       FROM campaign 
       WHERE id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Campaña encontrada:', result.rows[0])
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error(`❌ Error en GET /admin/api/campaigns/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al obtener campaña',
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
  console.log(`📝 PUT /admin/api/campaigns/${params.id} - Iniciando`)
  
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
    
    // Validación
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la campaña es requerido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE campaign 
       SET name = $1, principal_id = $2 
       WHERE id = $3 
       RETURNING id, name, principal_id`,
      [body.name.trim(), body.principal_id || null, id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Campaña actualizada:', result.rows[0])
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error(`❌ Error en PUT /admin/api/campaigns/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar campaña',
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
  console.log(`🗑️ DELETE /admin/api/campaigns/${params.id} - Iniciando`)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `DELETE FROM campaign 
       WHERE id = $1 
       RETURNING id`,
      [id]
    )
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Campaña ${id} eliminada`)
    return NextResponse.json({ 
      success: true,
      message: 'Campaña eliminada exitosamente',
      id: id
    })
    
  } catch (error: any) {
    console.error(`❌ Error en DELETE /admin/api/campaigns/${params.id}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Error al eliminar campaña',
        message: error.message,
        suggestion: 'Verifica que no haya usuarios relacionados con esta campaña'
      },
      { status: 500 }
    )
  }
}