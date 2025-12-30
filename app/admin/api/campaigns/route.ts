import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      const campaignId = parseInt(id)
      if (isNaN(campaignId)) {
        return NextResponse.json(
          { error: 'ID inválido' },
          { status: 400 }
        )
      }
      
      const result = await query(
        'SELECT id, name, principal_id FROM campaign WHERE id = $1',
        [campaignId]
      )
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Campaña no encontrada' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(result.rows[0])
    }
    
    const result = await query(
      'SELECT id, name, principal_id FROM campaign ORDER BY id ASC'
    )
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('Error en GET /admin/api/campaigns:', error)
    return NextResponse.json(
      { error: 'Error al obtener campañas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `INSERT INTO campaign (name, principal_id) 
       VALUES ($1, $2) 
       RETURNING id, name, principal_id`,
      [body.name.trim(), body.principal_id || null]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
    
  } catch (error: any) {
    console.error('Error en POST /admin/api/campaigns:', error)
    return NextResponse.json(
      { error: 'Error al crear campaña' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    const campaignId = parseInt(id)
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE campaign 
       SET name = $1, principal_id = $2 
       WHERE id = $3 
       RETURNING id, name, principal_id`,
      [body.name.trim(), body.principal_id || null, campaignId]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error('Error en PUT /admin/api/campaigns:', error)
    return NextResponse.json(
      { error: 'Error al actualizar campaña' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    const campaignId = parseInt(id)
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `DELETE FROM campaign 
       WHERE id = $1 
       RETURNING id`,
      [campaignId]
    )
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Campaña eliminada exitosamente',
      id: campaignId
    })
    
  } catch (error: any) {
    console.error('Error en DELETE /admin/api/campaigns:', error)
    
    let errorMessage = 'Error al eliminar campaña'
    if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'No se puede eliminar la campaña porque tiene usuarios relacionados'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}