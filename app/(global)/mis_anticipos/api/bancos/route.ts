// app/ejecutivo/anticipos/api/user/bank-info/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    
    const result = await query(
      `SELECT id, code, name FROM banks_code ORDER BY name ASC`
    )
    
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener lista de bancos',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    const { employeeid, bank_account, bank_number } = body

    console.log('📋 Datos recibidos:', { 
      employeeid: employeeid ? 'PROVIDED' : 'MISSING',
      bank_account: bank_account ? 'PROVIDED' : 'MISSING',
      bank_number: bank_number ? 'PROVIDED' : 'MISSING'
    });

    if (!employeeid || !bank_account || !bank_number) {
      console.error('❌ Faltan campos requeridos');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: employeeid, bank_account, bank_number' 
        },
        { status: 400 }
      )
    }

    if (bank_account.length < 5 || bank_account.length > 50) {
      console.error('❌ Longitud de cuenta inválida:', bank_account.length);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El número de cuenta debe tener entre 5 y 50 caracteres' 
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Verificando banco con ID: ${bank_number}`);
    const bankCheck = await query(
      `SELECT code, name FROM banks_code WHERE id = $1`,
      [bank_number]
    )

    if (bankCheck.rows.length === 0) {
      console.error('❌ Banco no encontrado:', bank_number);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El banco seleccionado no existe en el sistema' 
        },
        { status: 400 }
      )
    }

    const bankData = bankCheck.rows[0]
    console.log(`✅ Banco encontrado: ${bankData.name} (${bankData.code})`);

    console.log(`🔍 Verificando usuario: ${employeeid}`);
    const userCheck = await query(
      `SELECT employeeid, name FROM users WHERE employeeid = $1`,
      [employeeid]
    )

    if (userCheck.rows.length === 0) {
      console.error('❌ Usuario no encontrado:', employeeid);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no encontrado en el sistema' 
        },
        { status: 404 }
      )
    }

    const userName = userCheck.rows[0].name;
    console.log(`✅ Usuario encontrado: ${userName} (${employeeid})`);

    console.log(`🔄 Actualizando datos bancarios para: ${employeeid}`);
    const updateResult = await query(
      `UPDATE users 
       SET bank_account = $1, 
           bank_number = $2
       WHERE employeeid = $3
       RETURNING id, employeeid, name, bank_account, bank_number, email, role`,
      [bank_account, bank_number, employeeid]
    )

    const updatedUser = updateResult.rows[0];
    console.log('✅ Datos actualizados:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Datos bancarios actualizados exitosamente',
      user: updatedUser,
      bank_info: {
        bank_name: bankData.name,
        bank_code: bankData.code
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
   
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al actualizar datos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}