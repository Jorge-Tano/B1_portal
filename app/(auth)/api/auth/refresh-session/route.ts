// app/api/auth/refresh-session/route.ts - VERSIÓN MEJORADA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserSyncService } from "@/lib/user-sync";
import { query } from '@/lib/db'; // 🔐 Añadido para verificaciones adicionales

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar que el usuario esté autenticado
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "No autenticado",
                    code: "NO_SESSION" // 🔐 Código específico
                },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { username } = body;

        // 🔐 Verificar que el username coincida con la sesión
        if (username !== session.user.id && username !== session.user.email) {
            console.warn(`⚠️ Intento de refresh no autorizado: 
                Sesión: ${session.user.id}, 
                Solicitud: ${username}`);
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: "No autorizado para refrescar esta sesión",
                    code: "UNAUTHORIZED_REFRESH"
                },
                { status: 403 }
            );
        }

        // 🔐 Verificar datos bancarios (para anticipos)
        const employeeId = session.user.adUser?.employeeID || 
                          session.user.email?.split('@')[0];
        
        let bankInfo = null;
        if (employeeId) {
            try {
                const bankQuery = await query(
                    `SELECT 
                        u.bank_account,
                        u.bank_number,
                        b.name as bank_name,
                        CASE 
                            WHEN u.bank_account IS NOT NULL 
                            AND u.bank_account != '' 
                            AND u.bank_number IS NOT NULL 
                            THEN true 
                            ELSE false 
                        END as has_bank_account
                     FROM users u
                     LEFT JOIN banks_code b ON u.bank_number = b.id
                     WHERE u.employeeid = $1`,
                    [employeeId]
                );

                if (bankQuery.rows.length > 0) {
                    bankInfo = bankQuery.rows[0];
                }
            } catch (dbError) {
                console.warn('⚠️ Error obteniendo info bancaria:', dbError);
            }
        }

        // 2. Refrescar datos
        const syncResult = await UserSyncService.verifyAndSyncUserSession(username);
        
        if (!syncResult.success) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: syncResult.message,
                    code: "SYNC_FAILED"
                },
                { status: 404 }
            );
        }

        // 3. Preparar respuesta enriquecida
        const responseData = {
            success: true,
            user: {
                ...syncResult.user,
                // 🔐 Añadir info específica para anticipos
                advanceInfo: {
                    employeeId: employeeId,
                    hasBankAccount: bankInfo?.has_bank_account || false,
                    bankAccount: bankInfo?.bank_account,
                    bankName: bankInfo?.bank_name,
                    lastValidation: new Date().toISOString()
                }
            },
            message: "Datos actualizados correctamente",
            validation: {
                timestamp: new Date().toISOString(),
                expires: session.expires,
                hasValidSession: true
            }
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("❌ Error refrescando sesión:", error);
        
        // 🔐 Determinar tipo de error
        let errorCode = "INTERNAL_ERROR";
        let statusCode = 500;
        
        if (error.message?.includes("timeout") || error.message?.includes("ECONNREFUSED")) {
            errorCode = "DATABASE_UNAVAILABLE";
            statusCode = 503;
        }

        return NextResponse.json(
            { 
                success: false, 
                message: "Error interno del servidor",
                code: errorCode,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: statusCode }
        );
    }
}

// 🔐 Añadir endpoint GET para verificación rápida
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { 
                    success: false, 
                    valid: false,
                    message: "Sesión no encontrada" 
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            valid: true,
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                employeeId: session.user.adUser?.employeeID || session.user.email?.split('@')[0],
                expires: session.expires
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
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