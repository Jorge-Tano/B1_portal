import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (id) {
      const result = await query(
        `SELECT id, amount FROM amounts WHERE id = $1`,
        [parseInt(id)]
      )
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Monto no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json(result.rows[0])
    }

    const result = await query(
      `SELECT id, amount FROM amounts ORDER BY amount ASC`
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('[GET /api/amount-configs] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener montos configurados' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { amount } = data

    if (!amount || isNaN(parseInt(amount))) {
      return NextResponse.json(
        { error: 'El monto es requerido y debe ser un número válido' },
        { status: 400 }
      )
    }

    const amountNum = parseInt(amount)

    const existing = await query(
      `SELECT id FROM amounts WHERE amount = $1`,
      [amountNum]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un monto configurado con este valor' },
        { status: 409 }
      )
    }

    const result = await query(
      `INSERT INTO amounts (amount) VALUES ($1) RETURNING id, amount`,
      [amountNum]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/amount-configs] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear monto configurado' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'ID de monto inválido' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { amount } = data

    if (!amount || isNaN(parseInt(amount))) {
      return NextResponse.json(
        { error: 'El monto es requerido y debe ser un número válido' },
        { status: 400 }
      )
    }

    const amountNum = parseInt(amount)
    const montoId = parseInt(id)

    const existing = await query(
      `SELECT id FROM amounts WHERE id = $1`,
      [montoId]
    )

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Monto no encontrado' },
        { status: 404 }
      )
    }

    const duplicate = await query(
      `SELECT id FROM amounts WHERE amount = $1 AND id != $2`,
      [amountNum, montoId]
    )

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe otro monto configurado con este valor' },
        { status: 409 }
      )
    }

    const result = await query(
      `UPDATE amounts SET amount = $1 WHERE id = $2 RETURNING id, amount`,
      [amountNum, montoId]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('[PUT /api/amount-configs] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar monto configurado' },
      { status: 500 }
    )
  }
}