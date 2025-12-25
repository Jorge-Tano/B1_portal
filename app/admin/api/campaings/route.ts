import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  console.log('🔍 GET /admin/api/campaigns - Iniciando')
  
  try {
    // La tabla se llama "campaign" no "campaigns"
    const result = await query(`
      SELECT id, name, principal_id 
      FROM campaign 
      ORDER BY id ASC
    `)
    
    console.log(`✅ Se encontraron ${result.rowCount} campañas`)
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('❌ Error en GET /admin/api/campaigns:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    
    return NextResponse.json(
      { 
        error: 'Error al obtener campañas',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log('📝 POST /admin/api/campaigns - Iniciando')
  
  try {
    const body = await request.json()
    console.log('📦 Body recibido:', body)
    
    // Validación básica
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la campaña es requerido' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `INSERT INTO campaign (name, principal_id) 
       VALUES ($1, $2) 
       RETURNING id, name, principal_id`,
      [body.name.trim(), body.principal_id || null]
    )
    
    console.log('✅ Campaña creada:', result.rows[0])
    return NextResponse.json(result.rows[0], { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Error en POST /admin/api/campaigns:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    
    return NextResponse.json(
      { 
        error: 'Error al crear campaña',
        message: error.message,
        detail: error.detail
      },
      { status: 500 }
    )
  }
}