import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT id, name FROM document_type ORDER BY id ASC`
    )
    
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('[document-types] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener tipos de documento' },
      { status: 500 }
    )
  }
}