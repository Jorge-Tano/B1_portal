// lib/user-sync.ts
import pool from '@/lib/db';
import { ADUserData } from '@/lib/ldap-client';

export interface SyncResult {
    success: boolean;
    user?: {
        id: number;
        employeeID: string;
        name: string;
        email?: string;
        campaign_id?: number;
        role?: string;
    };
    message: string;
    action?: 'created' | 'updated' | 'skipped';
}

export class UserSyncService {
    private static readonly DEFAULT_CAMPAIGN_ID = 8; // Colombia General
    private static readonly DEFAULT_DOCUMENT_TYPE = 1;
    private static readonly DEFAULT_BANK_NUMBER = 1007;

    private static readonly OU_CAMPAIGN_MAP: Record<string, number> = {
        'ti': 1,                // TI Colombia
        '5757': 2,              // 5757 Colombia
        'parlo': 3,             // Parlo Colombia
        'superavance': 4,       // SuperAvance Colombia
        'capa col': 5,          // Capa Colombia
        'pago liviano': 6,      // Pago Liviano Colombia
        'refinanciamiento': 7,  // Refinanciamiento Colombia
    };

    /**
     * Sincroniza usuario desde AD
     */
    static async syncUserFromAD(adUserData: ADUserData): Promise<SyncResult> {
        try {
            if (!adUserData.sAMAccountName) {
                return { success: false, message: 'Falta nombre de usuario' };
            }

            const employeeID = this.extractEmployeeID(adUserData);
            if (!employeeID) {
                return { success: false, message: 'No se pudo obtener ID del usuario' };
            }

            const existingUser = await this.findUser(employeeID, adUserData.sAMAccountName);
            
            if (existingUser) {
                return await this.updateUser(existingUser.id, adUserData);
            } else {
                return await this.createUser(employeeID, adUserData);
            }
        } catch (error: any) {
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    /**
     * Extraer employeeID con prioridades
     */
    private static extractEmployeeID(adUserData: ADUserData): string {
        if (adUserData.employeeID?.trim()) {
            return adUserData.employeeID.trim();
        }
        
        if (adUserData.employeeNumber?.trim()) {
            return adUserData.employeeNumber.trim();
        }
        
        return adUserData.sAMAccountName;
    }

    /**
     * Buscar usuario existente
     */
    private static async findUser(employeeID: string, sAMAccountName: string): Promise<any | null> {
        try {
            const byEmployeeID = await pool.query(
                'SELECT id, employeeID, name, email, campaign_id, role FROM users WHERE employeeID = $1 LIMIT 1',
                [employeeID]
            );
            
            if (byEmployeeID.rows.length > 0) {
                return byEmployeeID.rows[0];
            }

            const byName = await pool.query(
                'SELECT id, employeeID, name, email, campaign_id, role FROM users WHERE LOWER(name) LIKE LOWER($1) LIMIT 1',
                [`%${sAMAccountName}%`]
            );
            
            return byName.rows[0] || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Crear nuevo usuario
     */
    private static async createUser(employeeID: string, adUserData: ADUserData): Promise<SyncResult> {
        try {
            const role = this.determineUserRole(adUserData);
            const campaign_id = await this.determineCampaign(adUserData);
            
            const query = `
                INSERT INTO users (
                    employeeID, name, email, campaign_id, role, 
                    document_type, bank_number, ou, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING id, employeeID, name, email, campaign_id, role, ou
            `;

            const values = [
                employeeID,
                adUserData.displayName || adUserData.sAMAccountName,
                adUserData.mail || null,
                campaign_id,
                role,
                this.DEFAULT_DOCUMENT_TYPE,
                this.DEFAULT_BANK_NUMBER,
                adUserData.ou || null
            ];

            const result = await pool.query(query, values);

            return {
                success: true,
                user: result.rows[0],
                message: 'Usuario creado exitosamente',
                action: 'created'
            };
        } catch (error: any) {
            if (error.code === '23505') {
                const existingUser = await this.findUser(employeeID, adUserData.sAMAccountName);
                if (existingUser) {
                    return await this.updateUser(existingUser.id, adUserData);
                }
            }
            
            return { success: false, message: `Error al crear: ${error.message}` };
        }
    }

    /**
     * Actualizar usuario existente
     */
    private static async updateUser(userId: number, adUserData: ADUserData): Promise<SyncResult> {
        try {
            const query = `
                UPDATE users 
                SET name = $1, 
                    email = COALESCE($2, email),
                    ou = COALESCE($3, ou),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING id, employeeID, name, email, campaign_id, role, ou
            `;

            const values = [
                adUserData.displayName || adUserData.sAMAccountName,
                adUserData.mail || null,
                adUserData.ou || null,
                userId
            ];

            const result = await pool.query(query, values);

            return {
                success: true,
                user: result.rows[0],
                message: 'Usuario actualizado exitosamente',
                action: 'updated'
            };
        } catch (error: any) {
            return { success: false, message: `Error al actualizar: ${error.message}` };
        }
    }

    /**
     * Determinar campaign basado en OU
     */
    private static async determineCampaign(adUserData: ADUserData): Promise<number> {
        if (!adUserData.ou) {
            return this.DEFAULT_CAMPAIGN_ID;
        }

        const ou = adUserData.ou.toLowerCase();
        
        if (this.OU_CAMPAIGN_MAP[ou]) {
            return this.OU_CAMPAIGN_MAP[ou];
        }

        for (const [key, id] of Object.entries(this.OU_CAMPAIGN_MAP)) {
            if (ou.includes(key)) {
                return id;
            }
        }

        return this.DEFAULT_CAMPAIGN_ID;
    }

    /**
     * Determinar role basado en título y OU
     */
    private static determineUserRole(adUserData: ADUserData): string {
        const title = (adUserData.title || '').toLowerCase();
        const ou = (adUserData.ou || '').toLowerCase();

        if (ou === 'ti' || ou.includes('ti') || title.includes('tecnolog')) {
            return 'admin';
        }

        const titleRoleMap = [
            { keywords: ['admin', 'administrador', 'gerente'], role: 'admin' },
            { keywords: ['supervisor', 'supervisora'], role: 'supervisor' },
            { keywords: ['encargado', 'encargada', 'líder'], role: 'encargado' },
            { keywords: ['ejecutivo', 'ejecutiva', 'asesor'], role: 'ejecutivo' }
        ];

        for (const mapping of titleRoleMap) {
            if (mapping.keywords.some(keyword => title.includes(keyword))) {
                return mapping.role;
            }
        }

        const executiveOUs = ['5757', 'parlo', 'superavance', 'capa col', 'pago liviano', 'refinanciamiento'];
        if (executiveOUs.includes(ou)) {
            return 'ejecutivo';
        }

        return 'ejecutivo';
    }

    /**
     * Verificar sesión de usuario
     */
    static async verifyAndSyncUserSession(username: string): Promise<SyncResult> {
        try {
            const result = await pool.query(
                'SELECT id, employeeID, name, email, campaign_id, role FROM users WHERE name ILIKE $1 OR employeeID = $1 LIMIT 1',
                [username]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Usuario no encontrado en la base de datos' };
            }

            return {
                success: true,
                user: result.rows[0],
                message: 'Usuario verificado exitosamente'
            };
        } catch (error: any) {
            return { success: false, message: `Error de verificación: ${error.message}` };
        }
    }

    /**
     * Obtener usuario por ID
     */
    static async getUserById(userId: number): Promise<any | null> {
        try {
            const result = await pool.query(
                'SELECT id, employeeID, name, email, campaign_id, role FROM users WHERE id = $1 LIMIT 1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            return null;
        }
    }
}