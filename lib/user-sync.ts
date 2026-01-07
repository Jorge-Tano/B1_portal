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
    private static readonly DEFAULT_CAMPAIGN_ID = 8;
    private static readonly DEFAULT_DOCUMENT_TYPE = 1;
    private static readonly DEFAULT_BANK_NUMBER = 1007;

    // Mapeo de OU a Campaign ID
    private static readonly OU_CAMPAIGN_MAP: Record<string, number> = {
        'ti': 1,
        '5757': 2,
        'parlo': 3,
        'superavance': 4,
        'capa col': 5,
        'pago liviano': 6,
        'refinanciamiento': 7,
    };

    // Configuración de supervisores por OU
    private static readonly SUPERVISOR_OU_KEYWORDS: string[] = [
        'supervisores',
        'supervision',
        'coordinacion',
        'coordinadores',
        'liderazgo operativo'
    ];

    /**
     * Sincroniza usuario desde AD (solo para primera vez o sincronización manual)
     */
    static async syncUserFromAD(adUserData: ADUserData): Promise<SyncResult> {
        try {
            console.log('[UserSync] Sincronizando usuario desde AD:', {
                name: adUserData.sAMAccountName,
                ou: adUserData.ou
            });

            if (!adUserData.sAMAccountName) {
                return { success: false, message: 'Falta nombre de usuario' };
            }

            const employeeID = this.extractEmployeeID(adUserData);
            if (!employeeID) {
                return { success: false, message: 'No se pudo obtener ID del usuario' };
            }

            const existingUser = await this.findUser(employeeID, adUserData.sAMAccountName);
            
            if (existingUser) {
                console.log('[UserSync] Usuario ya existe, sin actualizar rol automáticamente');
                // Solo actualizar info básica, NO el rol
                return await this.updateUserInfo(existingUser.id, adUserData);
            } else {
                console.log('[UserSync] Creando nuevo usuario (asignando rol por OU)');
                return await this.createUser(employeeID, adUserData);
            }
        } catch (error: any) {
            console.error('[UserSync] Error en syncUserFromAD:', error.message);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    /**
     * Verificar sesión de usuario SIN actualizar rol
     */
    static async verifyUserSession(username: string): Promise<SyncResult> {
        try {
            console.log('[UserSync] Verificando sesión para:', username);

            const result = await pool.query(
                'SELECT id, employeeID, name, email, campaign_id, role FROM users WHERE name ILIKE $1 OR employeeID = $1 LIMIT 1',
                [username]
            );

            if (result.rows.length === 0) {
                console.log('[UserSync] Usuario no encontrado en BD');
                return { success: false, message: 'Usuario no encontrado en la base de datos' };
            }

            const user = result.rows[0];
            console.log('[UserSync] Usuario verificado:', user.name, 'Rol:', user.role);

            return {
                success: true,
                user: user,
                message: 'Usuario verificado exitosamente'
            };
        } catch (error: any) {
            console.error('[UserSync] Error en verifyUserSession:', error);
            return { success: false, message: `Error de verificación: ${error.message}` };
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
            console.error('[UserSync] Error en findUser:', error);
            return null;
        }
    }

    /**
     * Crear nuevo usuario - ASIGNA ROL POR OU/TÍTULO (solo primera vez)
     */
    private static async createUser(employeeID: string, adUserData: ADUserData): Promise<SyncResult> {
        try {
            const role = this.determineInitialRole(adUserData); // Solo para creación inicial
            const campaign_id = await this.determineCampaign(adUserData);
            
            console.log('[UserSync] Creando usuario con rol inicial:', role);

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
            console.log('[UserSync] Usuario creado exitosamente:', result.rows[0].id);

            return {
                success: true,
                user: result.rows[0],
                message: 'Usuario creado exitosamente',
                action: 'created'
            };
        } catch (error: any) {
            console.error('[UserSync] ERROR en createUser:', error.message);
            
            if (error.code === '23505') {
                const existingUser = await this.findUser(employeeID, adUserData.sAMAccountName);
                if (existingUser) {
                    return await this.updateUserInfo(existingUser.id, adUserData);
                }
            }
            
            return { success: false, message: `Error al crear: ${error.message}` };
        }
    }

    /**
     * Actualizar solo información básica (NO el rol)
     */
    private static async updateUserInfo(userId: number, adUserData: ADUserData): Promise<SyncResult> {
        try {
            console.log('[UserSync] Actualizando info básica para usuario:', userId);

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
                message: 'Información actualizada exitosamente',
                action: 'updated'
            };
        } catch (error: any) {
            console.error('[UserSync] ERROR en updateUserInfo:', error);
            return { success: false, message: `Error al actualizar: ${error.message}` };
        }
    }

    /**
     * Determinar rol INICIAL basado en OU y título (solo para creación)
     */
    private static determineInitialRole(adUserData: ADUserData): string {
        const title = (adUserData.title || '').toLowerCase();
        const ou = (adUserData.ou || '').toLowerCase();

        console.log('[UserSync] Determinando rol inicial para:', { ou, title });

        // 1. Supervisores por OU
        for (const supervisorOU of this.SUPERVISOR_OU_KEYWORDS) {
            if (ou.includes(supervisorOU.toLowerCase())) {
                console.log('[UserSync] Rol inicial: supervisor por OU');
                return 'supervisor';
            }
        }

        // 2. TI/Administración
        if (ou === 'ti' || ou.includes('ti') || title.includes('tecnolog')) {
            console.log('[UserSync] Rol inicial: admin por TI');
            return 'admin';
        }

        // 3. Mapeo por título
        const titleRoleMap = [
            { keywords: ['admin', 'administrador', 'gerente'], role: 'admin' },
            { keywords: ['supervisor', 'supervisora', 'coordinador', 'coordinadora'], role: 'supervisor' },
            { keywords: ['encargado', 'encargada', 'líder'], role: 'encargado' },
            { keywords: ['ejecutivo', 'ejecutiva', 'asesor'], role: 'ejecutivo' }
        ];

        for (const mapping of titleRoleMap) {
            for (const keyword of mapping.keywords) {
                if (title.includes(keyword)) {
                    console.log('[UserSync] Rol inicial por título:', mapping.role);
                    return mapping.role;
                }
            }
        }

        // 4. OUs ejecutivas
        const executiveOUs = ['5757', 'parlo', 'superavance', 'capa col', 'pago liviano', 'refinanciamiento'];
        for (const execOU of executiveOUs) {
            if (ou.includes(execOU)) {
                console.log('[UserSync] Rol inicial: ejecutivo por OU');
                return 'ejecutivo';
            }
        }

        // 5. Default
        console.log('[UserSync] Rol inicial por defecto: ejecutivo');
        return 'ejecutivo';
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
     * Método para actualizar rol MANUALMENTE (para administradores)
     */
    static async updateUserRole(userId: number, newRole: string): Promise<SyncResult> {
        try {
            console.log('[UserSync] Actualizando rol manualmente:', { userId, newRole });

            const query = `
                UPDATE users 
                SET role = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id, employeeID, name, role
            `;

            const values = [newRole, userId];
            const result = await pool.query(query, values);

            if (result.rowCount === 0) {
                return { success: false, message: 'Usuario no encontrado' };
            }

            console.log('[UserSync] Rol actualizado manualmente:', result.rows[0]);

            return {
                success: true,
                user: result.rows[0],
                message: 'Rol actualizado exitosamente'
            };
        } catch (error: any) {
            console.error('[UserSync] ERROR en updateUserRole:', error);
            return { success: false, message: `Error al actualizar rol: ${error.message}` };
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
            console.error('[UserSync] ERROR en getUserById:', error);
            return null;
        }
    }

    /**
     * Método de prueba para diagnóstico
     */
    static async testDatabaseConnection(): Promise<boolean> {
        try {
            await pool.query('SELECT 1');
            console.log('[UserSync] Conexión a DB exitosa');
            return true;
        } catch (error) {
            console.error('[UserSync] ERROR de conexión a DB:', error);
            return false;
        }
    }
}