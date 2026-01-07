// app/api/auth/refresh-session/route.ts - VERSIÓN INTEGRADA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from '@/lib/db';
import { UserSyncService } from "@/lib/user-sync";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [refresh-session] Iniciando refresh...');
    
    // 1. Verificar sesión actual
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('❌ [refresh-session] No hay sesión activa');
      return NextResponse.json({ 
        success: false, 
        message: "No autenticado",
        code: "NO_SESSION"
      }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId: bodyEmployeeId } = body;

    // 2. Obtener employeeId - PRIORIDAD:
    //   1. Del body (si se envía desde el frontend)
    //   2. De la sesión del usuario (employeeID de NextAuth)
    //   3. De adUser.employeeID
    //   4. De dbUser.employeeid
    let targetEmployeeId = bodyEmployeeId || 
                          session.user.employeeID || 
                          session.user.adUser?.employeeID || 
                          session.user.dbUser?.employeeid;

    console.log('🔍 [refresh-session] Employee ID objetivo:', targetEmployeeId);
    console.log('📊 [refresh-session] Datos de sesión:', {
      hasEmployeeID: !!session.user.employeeID,
      employeeID: session.user.employeeID,
      hasAdUser: !!session.user.adUser,
      adUserEmployeeID: session.user.adUser?.employeeID,
      hasDbUser: !!session.user.dbUser,
      dbUserEmployeeId: session.user.dbUser?.employeeid
    });

    if (!targetEmployeeId) {
      console.error('❌ [refresh-session] No se pudo identificar al usuario');
      return NextResponse.json({
        success: false,
        message: "No se pudo identificar al usuario",
        code: "NO_EMPLOYEE_ID"
      }, { status: 400 });
    }

    // 3. 🔄 Verificar y sincronizar usuario con BD (opcional pero recomendado)
    let syncResult = null;
    try {
      // Si tenemos el sAMAccountName, usarlo para sincronizar
      const sAMAccountName = session.user.adUser?.sAMAccountName;
      if (sAMAccountName) {
        console.log(`🔄 [refresh-session] Verificando sincronización para: ${sAMAccountName}`);
        syncResult = await UserSyncService.verifyAndSyncUserSession(sAMAccountName);
        console.log('✅ [refresh-session] Sincronización:', syncResult);
      }
    } catch (syncError) {
      console.warn('⚠️ [refresh-session] Error en sincronización:', syncError);
      // Continuar con el proceso aunque falle la sincronización
    }

    // 4. Consultar datos bancarios desde BD usando employeeId
    let bankData = null;
    let userDataFromDB = null;
    
    console.log(`🔍 [refresh-session] Consultando BD para employeeId: ${targetEmployeeId}`);
    
    try {
      const dbQuery = await query(
        `SELECT 
            u.id,
            u.employeeid,
            u.name,
            u.email,
            u.role,
            u.campaign_id,
            u.bank_account,
            u.bank_number,
            u.document_type,
            u.telephone,
            u.mobile,
            u.ou,
            b.name as bank_name,
            b.code as bank_code,
            u.created_at,
            u.updated_at,
            CASE 
                WHEN u.bank_account IS NOT NULL 
                AND u.bank_account != '' 
                AND u.bank_number IS NOT NULL 
                THEN true 
                ELSE false 
            END as has_bank_account
         FROM users u
         LEFT JOIN banks_code b ON u.bank_number = b.id
         WHERE u.employeeid = $1
         LIMIT 1`,
        [targetEmployeeId]
      );

      if (dbQuery.rows.length > 0) {
        userDataFromDB = dbQuery.rows[0];
        bankData = {
          bank_account: userDataFromDB.bank_account,
          bank_number: userDataFromDB.bank_number,
          bank_name: userDataFromDB.bank_name,
          bank_code: userDataFromDB.bank_code,
          has_bank_account: userDataFromDB.has_bank_account
        };
        
        console.log('🏦 [refresh-session] Datos BD encontrados:', {
          employeeid: userDataFromDB.employeeid,
          bank_account: userDataFromDB.bank_account,
          bank_number: userDataFromDB.bank_number,
          has_bank_account: userDataFromDB.has_bank_account
        });
      } else {
        console.warn(`⚠️ [refresh-session] Usuario no encontrado en BD: ${targetEmployeeId}`);
        
        const sAMAccountName = session.user.adUser?.sAMAccountName;
        if (sAMAccountName && sAMAccountName !== targetEmployeeId) {
          console.log(`🔍 [refresh-session] Buscando por sAMAccountName: ${sAMAccountName}`);
          const fallbackQuery = await query(
            `SELECT 
                u.id,
                u.employeeid,
                u.name,
                u.email,
                u.role,
                u.campaign_id,
                u.bank_account,
                u.bank_number,
                u.document_type,
                u.telephone,
                u.mobile,
                u.ou,
                b.name as bank_name,
                b.code as bank_code,
                u.created_at,
                u.updated_at,
                CASE 
                    WHEN u.bank_account IS NOT NULL 
                    AND u.bank_account != '' 
                    AND u.bank_number IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as has_bank_account
             FROM users u
             LEFT JOIN banks_code b ON u.bank_number = b.id
             WHERE u.employeeid = $1
             LIMIT 1`,
            [sAMAccountName]
          );
          
          if (fallbackQuery.rows.length > 0) {
            userDataFromDB = fallbackQuery.rows[0];
            bankData = {
              bank_account: userDataFromDB.bank_account,
              bank_number: userDataFromDB.bank_number,
              bank_name: userDataFromDB.bank_name,
              bank_code: userDataFromDB.bank_code,
              has_bank_account: userDataFromDB.has_bank_account
            };
            console.log('✅ [refresh-session] Datos encontrados por sAMAccountName:', {
              employeeid: userDataFromDB.employeeid
            });
          }
        }
      }
    } catch (dbError: any) {
      console.error('❌ [refresh-session] Error BD:', dbError);
    }

    // 5. Construir advanceInfo
    const hasBankAccount = bankData?.has_bank_account || false;
    const advanceInfo = {
      employeeId: targetEmployeeId,
      hasBankAccount: hasBankAccount,
      bankAccount: bankData?.bank_account || null,
      bankNumber: bankData?.bank_number || null,
      bankName: bankData?.bank_name || null,
      bankCode: bankData?.bank_code || null,
      lastValidation: new Date().toISOString(),
      dbUpdated: userDataFromDB?.updated_at,
      source: userDataFromDB ? 'database' : 'session'
    };

    // 6. Preparar respuesta - Mantener estructura de tu NextAuth
    const updatedUser = {
      // Datos principales de la sesión
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      employeeID: targetEmployeeId,
      ou: session.user.ou,
      allOUs: session.user.allOUs,
      
      // Datos de AD
      adUser: session.user.adUser,
      
      // Datos de sincronización (actualizar si hubo cambios)
      syncData: syncResult?.success ? {
        dbUserId: syncResult.user?.id,
        action: syncResult.action,
        timestamp: new Date().toISOString()
      } : session.user.syncData,
      
      // Datos de BD - CRÍTICO: Incluir advanceInfo aquí
      dbUser: {
        // Mantener datos existentes de dbUser
        ...(session.user.dbUser || {}),
        
        // Actualizar con datos frescos de BD si existen
        ...(userDataFromDB ? {
          id: userDataFromDB.id,
          employeeid: userDataFromDB.employeeid,
          name: userDataFromDB.name || session.user.name,
          email: userDataFromDB.email || session.user.email,
          role: userDataFromDB.role || session.user.dbUser?.role,
          campaign_id: userDataFromDB.campaign_id || session.user.dbUser?.campaign_id,
          bank_account: userDataFromDB.bank_account,
          bank_number: userDataFromDB.bank_number,
          bank_name: userDataFromDB.bank_name,
          bank_code: userDataFromDB.bank_code,
          document_type: userDataFromDB.document_type,
          telephone: userDataFromDB.telephone,
          mobile: userDataFromDB.mobile,
          ou: userDataFromDB.ou,
          updated_at: userDataFromDB.updated_at
        } : {}),
        
        // 🔥 INCLUIR advanceInfo actualizado
        advanceInfo: advanceInfo
      }
    };

    const responseData = {
      success: true,
      user: updatedUser,
      message: "Datos actualizados correctamente",
      metadata: {
        employeeId: targetEmployeeId,
        hasBankAccount,
        bankDataFound: !!bankData,
        advanceInfoIncluded: true,
        syncPerformed: !!syncResult,
        syncSuccess: syncResult?.success,
        processingTime: Date.now() - startTime
      }
    };

    console.log('📦 [refresh-session] Respuesta final:', {
      hasAdvanceInfo: !!responseData.user.dbUser?.advanceInfo,
      hasBankAccount: advanceInfo.hasBankAccount,
      bankAccount: advanceInfo.bankAccount,
      employeeID: responseData.user.employeeID
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("❌ [refresh-session] Error general:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error interno del servidor",
        code: "INTERNAL_ERROR",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para diagnóstico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        valid: false,
        message: "Sesión no encontrada" 
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        employeeID: session.user.employeeID,
        ou: session.user.ou,
        hasEmployeeID: !!session.user.employeeID,
        hasAdUser: !!session.user.adUser,
        hasDbUser: !!session.user.dbUser,
        dbUserHasAdvanceInfo: !!session.user.dbUser?.advanceInfo,
        dbUserAdvanceInfo: session.user.dbUser?.advanceInfo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [refresh-session GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        valid: false,
        message: "Error verificando sesión"
      },
      { status: 500 }
    );
  }
}