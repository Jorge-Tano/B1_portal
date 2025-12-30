import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface CreateUserDTO {
  employeeid?: string
  name?: string
  email?: string
  role?: string
  campaign_id?: string | number
  bank_account?: string
  document_type?: string | number
  bank_number?: string | number
  telephone?: string
  mobile?: string
  ou?: string
}

const sanitizeText = (value?: string): string | null => {
  if (!value) return null
  return value.trim() || null
}

const parseNumericValue = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null) return null
  
  const num = typeof value === 'string' ? parseInt(value.trim(), 10) : value
  return isNaN(num) ? null : num
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      const userId = parseInt(id)
      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'ID inválido' },
          { status: 400 }
        )
      }
      
      const result = await query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      )
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(result.rows[0])
    }
    
    const result = await query(`
      SELECT 
        id, employeeid, name, campaign_id, bank_account, 
        role, document_type, bank_number, email, telephone,
        mobile, ou, created_at, updated_at
      FROM users 
      ORDER BY id ASC
    `)
    
    return NextResponse.json(result.rows)
    
  } catch (error: any) {
    console.error('Error en GET /admin/api/users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserDTO = await request.json()
    
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
      `INSERT INTO users 
       (employeeid, name, email, role, campaign_id, bank_account, 
        document_type, bank_number, telephone, mobile, ou)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        body.employeeid.trim(),
        body.name.trim(),
        sanitizeText(body.email),
        body.role || 'ejecutivo',
        parseNumericValue(body.campaign_id),
        body.bank_account?.trim() || null,
        parseNumericValue(body.document_type),
        parseNumericValue(body.bank_number),
        sanitizeText(body.telephone),
        sanitizeText(body.mobile),
        sanitizeText(body.ou)
      ]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
    
  } catch (error: any) {
    console.error('Error en POST /admin/api/users:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese ID de empleado' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro ID' },
        { status: 400 }
      )
    }
    
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const body: Partial<CreateUserDTO> = await request.json()
    
    // Verificar que el usuario existe
    const checkResult = await query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    )
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Construir consulta dinámica
    const fields: string[] = []
    const values: any[] = []
    let paramCounter = 1
    
    if (body.employeeid !== undefined) {
      fields.push(`employeeid = $${paramCounter++}`)
      values.push(body.employeeid.trim())
    }
    
    if (body.name !== undefined) {
      fields.push(`name = $${paramCounter++}`)
      values.push(body.name.trim())
    }
    
    if (body.email !== undefined) {
      fields.push(`email = $${paramCounter++}`)
      values.push(sanitizeText(body.email))
    }
    
    if (body.role !== undefined) {
      fields.push(`role = $${paramCounter++}`)
      values.push(body.role)
    }
    
    if (body.campaign_id !== undefined) {
      fields.push(`campaign_id = $${paramCounter++}`)
      values.push(parseNumericValue(body.campaign_id))
    }
    
    if (body.bank_account !== undefined) {
      fields.push(`bank_account = $${paramCounter++}`)
      values.push(body.bank_account?.trim() || null)
    }
    
    if (body.document_type !== undefined) {
      fields.push(`document_type = $${paramCounter++}`)
      values.push(parseNumericValue(body.document_type))
    }
    
    if (body.bank_number !== undefined) {
      fields.push(`bank_number = $${paramCounter++}`)
      values.push(parseNumericValue(body.bank_number))
    }
    
    if (body.telephone !== undefined) {
      fields.push(`telephone = $${paramCounter++}`)
      values.push(sanitizeText(body.telephone))
    }
    
    if (body.mobile !== undefined) {
      fields.push(`mobile = $${paramCounter++}`)
      values.push(sanitizeText(body.mobile))
    }
    
    if (body.ou !== undefined) {
      fields.push(`ou = $${paramCounter++}`)
      values.push(sanitizeText(body.ou))
    }
    
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }
    
    fields.push(`updated_at = NOW()`)
    values.push(userId)
    
    const queryStr = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `
    
    const result = await query(queryStr, values)
    
    return NextResponse.json(result.rows[0])
    
  } catch (error: any) {
    console.error('Error en PUT /admin/api/users:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese ID de empleado' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro ID' },
        { status: 400 }
      )
    }
    
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    // Verificar que el usuario existe
    const checkResult = await query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    )
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    const result = await query(
      `DELETE FROM users WHERE id = $1 RETURNING *`,
      [userId]
    )
    
    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
      deletedUser: result.rows[0]
    })
    
  } catch (error: any) {
    console.error('Error en DELETE /admin/api/users:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request)
}