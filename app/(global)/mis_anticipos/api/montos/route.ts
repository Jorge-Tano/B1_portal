// app/encargado/api/montos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    
    const result = await query(
      'SELECT id, amount FROM amounts ORDER BY amount ASC',
      []
    );
    
    return NextResponse.json(result.rows);
    
  } catch (error: any) {
    console.error('Error al obtener montos:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener montos',
        details: error.message
      },
      { status: 500 }
    );
  }
}