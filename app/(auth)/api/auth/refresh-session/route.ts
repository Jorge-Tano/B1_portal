// app/api/auth/refresh-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserSyncService } from "@/lib/user-sync";

export async function POST(request: NextRequest) {
    try {
        // Verificar que el usuario esté autenticado
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "No autenticado" },
                { status: 401 }
            );
        }

        const { username } = await request.json();
        
        // Verificar que el usuario solo pueda refrescar su propia sesión
        if (username !== session.user.id) {
            return NextResponse.json(
                { success: false, message: "No autorizado" },
                { status: 403 }
            );
        }

        // Refrescar datos
        const syncResult = await UserSyncService.verifyAndSyncUserSession(username);
        
        if (!syncResult.success) {
            return NextResponse.json(
                { success: false, message: syncResult.message },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: syncResult.user,
            message: "Datos actualizados correctamente"
        });

    } catch (error: any) {
        console.error("Error refrescando sesión:", error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: "Error interno del servidor",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}