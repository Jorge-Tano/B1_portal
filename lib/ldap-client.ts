// lib/ldap-client.ts
import ldapjs, { SearchEntry } from 'ldapjs';

export interface ADUserData {
    dn: string;
    distinguishedName: string;
    sAMAccountName: string;
    employeeID?: string;
    employeeNumber?: string;
    displayName?: string;
    mail?: string;
    givenName?: string;
    sn?: string;
    title?: string;
    department?: string;
    telephoneNumber?: string;
    mobile?: string;
    memberOf?: string[];
    userAccountControl?: number;
    isAccountEnabled?: boolean;
    ou?: string;
    allOUs?: string[];
}

export class LdapClient {
    private config: {
        url: string;
        bindDN: string;
        bindPassword: string;
        baseDN: string;
    };

    constructor() {
        const requiredVars = [
            'LDAP_SERVER_URL',
            'LDAP_BIND_DN',
            'LDAP_BIND_PASSWORD',
            'LDAP_BASE_DN'
        ];

        const missingVars = requiredVars.filter(envVar => !process.env[envVar]);
        
        if (missingVars.length > 0) {
            throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
        }

        this.config = {
            url: process.env.LDAP_SERVER_URL!,
            bindDN: process.env.LDAP_BIND_DN!,
            bindPassword: process.env.LDAP_BIND_PASSWORD!,
            baseDN: process.env.LDAP_BASE_DN!,
        };
    }

    async authenticateUser(username: string, password: string): Promise<{ 
        authenticated: boolean; 
        message?: string;
    }> {
        return new Promise((resolve) => {
            const client = ldapjs.createClient({
                url: this.config.url,
                timeout: 10000,
                tlsOptions: { rejectUnauthorized: false }
            });

            client.on('error', () => {});

            this.getUserDN(username).then(userDN => {
                if (!userDN) {
                    client.destroy();
                    resolve({ 
                        authenticated: false, 
                        message: 'Usuario no encontrado'
                    });
                    return;
                }

                client.bind(userDN, password, (bindErr) => {
                    client.destroy();
                    
                    if (bindErr) {
                        resolve({ 
                            authenticated: false, 
                            message: 'Credenciales inválidas'
                        });
                    } else {
                        resolve({ 
                            authenticated: true, 
                            message: 'Autenticación exitosa'
                        });
                    }
                });
            }).catch(() => {
                client.destroy();
                resolve({ 
                    authenticated: false, 
                    message: 'Error de conexión al servidor'
                });
            });
        });
    }

    private async getUserDN(username: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            const client = ldapjs.createClient({
                url: this.config.url,
                timeout: 10000,
                tlsOptions: { rejectUnauthorized: false }
            });

            client.on('error', () => {});

            client.bind(this.config.bindDN, this.config.bindPassword, (bindErr) => {
                if (bindErr) {
                    client.destroy();
                    reject(bindErr);
                    return;
                }

                const searchOptions = {
                    scope: 'sub' as 'sub',
                    filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
                    attributes: ['distinguishedName'],
                    sizeLimit: 1
                };

                client.search(this.config.baseDN, searchOptions, (searchErr, res) => {
                    if (searchErr) {
                        client.destroy();
                        reject(searchErr);
                        return;
                    }

                    let userDN: string | null = null;
                    
                    res.on('searchEntry', (entry: SearchEntry) => {
                        if (entry.objectName) {
                            userDN = entry.objectName.toString();
                        }
                    });

                    res.on('error', (err: Error) => {
                        client.destroy();
                        reject(err);
                    });

                    res.on('end', () => {
                        client.destroy();
                        resolve(userDN);
                    });
                });
            });
        });
    }

    async getUserDetails(username: string): Promise<{
        success: boolean;
        data: ADUserData;
        error?: string;
    }> {
        return new Promise((resolve) => {
            const client = ldapjs.createClient({
                url: this.config.url,
                timeout: 15000,
                tlsOptions: { rejectUnauthorized: false }
            });

            client.on('error', () => {});

            client.bind(this.config.bindDN, this.config.bindPassword, (bindErr) => {
                if (bindErr) {
                    client.destroy();
                    resolve({
                        success: false,
                        data: this.createFallbackUserData(username),
                        error: `Error de conexión: ${bindErr.message}`
                    });
                    return;
                }

                const searchOptions = {
                    scope: 'sub' as 'sub',
                    filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
                    attributes: [
                        'sAMAccountName',
                        'displayName',
                        'mail',
                        'employeeID',
                        'employeeNumber',
                        'title',
                        'department',
                        'distinguishedName',
                        'givenName',
                        'sn',
                        'telephoneNumber',
                        'mobile',
                        'memberOf',
                        'userAccountControl'
                    ],
                    sizeLimit: 1
                };

                client.search(this.config.baseDN, searchOptions, (searchErr, res) => {
                    if (searchErr) {
                        client.destroy();
                        resolve({
                            success: false,
                            data: this.createFallbackUserData(username),
                            error: `Error en búsqueda: ${searchErr.message}`
                        });
                        return;
                    }

                    let userData: ADUserData | null = null;
                    
                    res.on('searchEntry', (entry: SearchEntry) => {
                        userData = this.processEntry(entry, username);
                    });

                    res.on('error', () => {
                        // Error ya manejado por el evento 'end'
                    });

                    res.on('end', () => {
                        client.destroy();

                        if (!userData) {
                            resolve({
                                success: false,
                                data: this.createFallbackUserData(username),
                                error: 'Usuario no encontrado'
                            });
                            return;
                        }

                        resolve({
                            success: true,
                            data: userData
                        });
                    });
                });
            });
        });
    }

    private processEntry(entry: SearchEntry, username: string): ADUserData {
        const user: any = {
            dn: entry.objectName ? entry.objectName.toString() : '',
            distinguishedName: entry.objectName ? entry.objectName.toString() : '',
            sAMAccountName: username
        };

        entry.attributes?.forEach((attr: any) => {
            const attrName = attr.type;
            const attrValues = attr.values;
            
            if (attrValues && attrValues.length > 0) {
                user[attrName] = attrValues.length === 1 ? attrValues[0] : attrValues;
            }
        });

        const dn = user.dn || '';
        const ou = this.extractOUFromDN(dn);
        const allOUs = this.extractAllOUsFromDN(dn);
        
        let employeeID = '';
        if (user.employeeID) {
            employeeID = String(user.employeeID).trim();
        } else if (user.employeeNumber) {
            employeeID = String(user.employeeNumber).trim();
        }

        const isAccountEnabled = this.isAccountEnabled(user.userAccountControl);

        return {
            dn: user.dn,
            distinguishedName: user.distinguishedName,
            sAMAccountName: user.sAMAccountName || username,
            employeeID: employeeID || undefined,
            employeeNumber: user.employeeNumber || undefined,
            displayName: user.displayName || undefined,
            mail: user.mail || undefined,
            givenName: user.givenName || undefined,
            sn: user.sn || undefined,
            title: user.title || undefined,
            department: user.department || undefined,
            telephoneNumber: user.telephoneNumber || undefined,
            mobile: user.mobile || undefined,
            memberOf: this.normalizeMemberOf(user.memberOf),
            userAccountControl: this.parseUserAccountControl(user.userAccountControl),
            isAccountEnabled,
            ou: ou || undefined,
            allOUs: allOUs,
        };
    }

    private extractOUFromDN(dn: string): string | null {
        if (!dn) {
            return null;
        }
        
        try {
            const parts = dn.split(',').map(part => part.trim());
            
            for (const part of parts) {
                if (part.toUpperCase().startsWith('OU=')) {
                    return part.substring(3);
                }
            }
            
            return null;
        } catch {
            return null;
        }
    }

    private extractAllOUsFromDN(dn: string): string[] {
        if (!dn) {
            return [];
        }
        
        try {
            const ous: string[] = [];
            const parts = dn.split(',').map(part => part.trim());
            
            for (const part of parts) {
                if (part.toUpperCase().startsWith('OU=')) {
                    ous.push(part.substring(3));
                }
            }
            
            return ous;
        } catch {
            return [];
        }
    }

    private parseUserAccountControl(value: any): number {
        try {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const parsed = parseInt(value, 10);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    private normalizeMemberOf(memberOf: any): string[] {
        if (!memberOf) {
            return [];
        }
        
        try {
            if (Array.isArray(memberOf)) {
                return memberOf.map(item => String(item));
            }
            
            if (typeof memberOf === 'string') {
                return [memberOf];
            }
            
            return [];
        } catch {
            return [];
        }
    }

    private isAccountEnabled(userAccountControl: any): boolean {
        try {
            const uac = this.parseUserAccountControl(userAccountControl);
            return !(uac & 0x0002);
        } catch {
            return true;
        }
    }

    private createFallbackUserData(username: string): ADUserData {
        return {
            dn: '',
            distinguishedName: '',
            sAMAccountName: username,
            displayName: username,
            mail: `${username}@2call.cl`,
            memberOf: [],
            userAccountControl: 0,
            isAccountEnabled: true,
            allOUs: [],
        };
    }
}