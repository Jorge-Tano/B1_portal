import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  console.log('🔍 GET /admin/api/db-check - Iniciando diagnóstico')
  
  try {
    // 1. Probar conexión básica
    const connectionTest = await query('SELECT NOW() as server_time, version() as postgres_version')
    
    // 2. Verificar tablas
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    // 3. Verificar estructura de tablas
    let campaignsStructure = []
    let usersStructure = []
    
    try {
      const campaignsCols = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'campaigns'
        ORDER BY ordinal_position
      `)
      campaignsStructure = campaignsCols.rows
    } catch (e) {
      campaignsStructure = [{ error: 'Tabla campaigns no existe o error al consultar' }]
    }
    
    try {
      const usersCols = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `)
      usersStructure = usersCols.rows
    } catch (e) {
      usersStructure = [{ error: 'Tabla users no existe o error al consultar' }]
    }
    
    // 4. Contar registros
    let campaignsCount = 0
    let usersCount = 0
    
    try {
      const campaignsCountResult = await query('SELECT COUNT(*) as count FROM campaigns')
      campaignsCount = parseInt(campaignsCountResult.rows[0].count)
    } catch (e) {
      campaignsCount = -1
    }
    
    try {
      const usersCountResult = await query('SELECT COUNT(*) as count FROM users')
      usersCount = parseInt(usersCountResult.rows[0].count)
    } catch (e) {
      usersCount = -1
    }
    
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      database: {
        connection: 'OK',
        serverTime: connectionTest.rows[0].server_time,
        postgresVersion: connectionTest.rows[0].postgres_version,
        tables: tablesResult.rows.map((t: any) => t.table_name)
      },
      campaignsTable: {
        exists: campaignsStructure.length > 0 && !campaignsStructure[0].error,
        columns: campaignsStructure,
        rowCount: campaignsCount
      },
      usersTable: {
        exists: usersStructure.length > 0 && !usersStructure[0].error,
        columns: usersStructure,
        rowCount: usersCount
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        dbHost: process.env.POSTGRES_HOST ? 'Set' : 'Not set',
        dbName: process.env.POSTGRES_DB ? 'Set' : 'Not set',
        dbUser: process.env.POSTGRES_USER ? 'Set' : 'Not set'
      }
    }
    
    console.log('📊 Información de diagnóstico:', diagnosticInfo)
    return NextResponse.json(diagnosticInfo)
    
  } catch (error: any) {
    console.error('❌ Error en diagnóstico de base de datos:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    return NextResponse.json(
      {
        error: 'Error en diagnóstico de base de datos',
        message: error.message,
        code: error.code,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          dbHost: process.env.POSTGRES_HOST,
          dbName: process.env.POSTGRES_DB,
          dbUser: process.env.POSTGRES_USER
        }
      },
      { status: 500 }
    )
  }
}