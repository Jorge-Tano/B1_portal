import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT id, code, name FROM banks_code ORDER BY id ASC`
    )
    
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('[bank-account-types] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener tipos de cuentas bancarias' },
      { status: 500 }
    )
  }
}