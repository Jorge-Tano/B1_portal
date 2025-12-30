// app/ejecutivo/api/user/bank-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeid = searchParams.get('employeeid');

    console.log('🔍 [bank-info] Request recibida:', { employeeid });

    if (!employeeid) {
      console.log('❌ [bank-info] Employee ID requerido');
      return NextResponse.json(
        { error: 'Employee ID es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 [bank-info] Buscando datos para: ${employeeid}`);

    // Query para obtener datos bancarios
    const result = await query(
      `SELECT 
        u.bank_account,
        u.bank_number,
        b.name as bank_name,
        b.code as bank_code,
        CASE 
          WHEN u.bank_account IS NOT NULL 
          AND TRIM(u.bank_account) != '' 
          AND u.bank_number IS NOT NULL 
          AND u.bank_number > 0
          THEN true 
          ELSE false 
        END as has_bank_account
       FROM users u
       LEFT JOIN banks_code b ON u.bank_number = b.id
       WHERE u.employeeid = $1`,
      [employeeid]
    );

    console.log('📊 [bank-info] Resultado BD:', {
      encontrado: result.rows.length > 0,
      filas: result.rows.length
    });

    if (result.rows.length === 0) {
      console.log(`❌ [bank-info] Usuario ${employeeid} no encontrado`);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];

    console.log('🔍 [bank-info] Datos extraídos:', {
      bank_account: userData.bank_account,
      bank_number: userData.bank_number,
      bank_name: userData.bank_name,
      has_bank_account: userData.has_bank_account,
      banco_existe: userData.bank_name !== null
    });

    return NextResponse.json(userData);

  } catch (error: any) {
    console.error('❌ [bank-info] Error interno:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}