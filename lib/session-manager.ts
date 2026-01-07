// lib/session-manager.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserSyncService } from "@/lib/user-sync";

export interface EnrichedSession {
    user: {
        id: string;
        name: string;
        email?: string;
        employeeID: string;
        ou?: string;
        allOUs: string[];
        adUser: any;
        syncData?: any;
        dbUser: {
            id: number;
            employeeID: string;
            name: string;
            email?: string;
            campaign_id?: number;
            role?: string;
            document_type?: number;
            bank_number?: number;
            ou?: string;
            created_at?: Date;
            updated_at?: Date;
        } | null;
    };
    expires: string;
}

export class SessionManager {
    static async getEnrichedSession(): Promise<EnrichedSession | null> {
        try {
            const session = await getServerSession(authOptions);
            
            if (!session?.user) {
                return null;
            }

            if (session.user.dbUser) {
                return session as EnrichedSession;
            }

            const syncResult = await UserSyncService.verifyAndSyncUserSession(
                session.user.id
            );

            return {
                ...session,
                user: {
                    ...session.user,
                    dbUser: syncResult.success ? syncResult.user : null
                }
            } as EnrichedSession;
        } catch (error) {
            console.error("Error obteniendo sesión enriquecida:", error);
            return null;
        }
    }

    static async refreshSessionData(username: string): Promise<any> {
        try {
            const syncResult = await UserSyncService.verifyAndSyncUserSession(username);
            
            if (syncResult.success) {
                return {
                    success: true,
                    user: syncResult.user,
                    message: 'Datos actualizados'
                };
            }
            
            return {
                success: false,
                message: syncResult.message
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    static async checkPermission(session: EnrichedSession, requiredRole?: string): Promise<boolean> {
        if (!session.user.dbUser) {
            return false;
        }

        if (requiredRole && session.user.dbUser.role !== requiredRole) {
            return false;
        }

        return true;
    }
}