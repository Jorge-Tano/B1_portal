// lib/ldap-client.ts
import ldap, { Client, SearchOptions, SearchEntry } from 'ldapjs';

// Definir tipos para la respuesta
export interface ADUserData {
  // Identificación
  dn: string;
  distinguishedName: string;
  sAMAccountName: string;
  
  // Employee ID (CRÍTICO PARA TU CASO)
  employeeID?: string;
  employeeNumber?: string;
  
  // Información personal
  displayName?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  cn?: string;
  
  // Información organizacional
  title?: string;
  department?: string;
  company?: string;
  physicalDeliveryOfficeName?: string;
  
  // Información de contacto
  telephoneNumber?: string;
  mobile?: string;
  
  // Grupos y permisos
  memberOf?: string[];
  userAccountControl?: number;
  isAccountEnabled?: boolean;
  
  // Información de OU
  ou?: string;
  allOUs?: string[];
  parentContainer?: string;
  
  // NUEVO: Estructura de OU
  ouStructure?: {
    colombia?: string;
    ti?: string;
    platform?: string;
    fullPath: string[];
    isInTI: boolean;
    isInColombia: boolean;
    isInPlatform?: boolean;
  };
  
  // Metadatos
  _metadata?: {
    source: string;
    hasFullData: boolean;
    readSuccess: boolean;
    timestamp: string;
    methodUsed: string;
    searchBase?: string;
    attributesRequested?: string[];
    ouExtraction?: {
      method: string;
      success: boolean;
      rawDN: string;
      structureAnalysis?: string;
    };
  };
}

export class LdapClient {
  private config: {
    url: string;
    bindDN: string;
    bindPassword: string;
    baseDN: string;
    userSearchBase: string;
    searchFilter: string;
    userAttributes: string[];
  };

  constructor() {
    console.log('=== LDAP CLIENT CONSTRUCTOR ===');
    
    // Verificar variables de entorno críticas
    const requiredEnvVars = [
      'LDAP_SERVER_URL',
      'LDAP_BIND_DN',
      'LDAP_BIND_PASSWORD',
      'LDAP_BASE_DN',
      'LDAP_USER_SEARCH_BASE',
      'LDAP_SEARCH_FILTER'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`❌ Variable de entorno ${envVar} no está definida`);
        throw new Error(`La variable de entorno ${envVar} no está definida`);
      }
    }

    this.config = {
      url: process.env.LDAP_SERVER_URL!,
      bindDN: process.env.LDAP_BIND_DN!,
      bindPassword: process.env.LDAP_BIND_PASSWORD!,
      baseDN: process.env.LDAP_BASE_DN!,
      userSearchBase: process.env.LDAP_USER_SEARCH_BASE!,
      searchFilter: process.env.LDAP_SEARCH_FILTER!,
      userAttributes: this.getDefaultUserAttributes()
    };

    console.log('✅ Configuración LDAP cargada:', {
      url: this.config.url,
      userSearchBase: this.config.userSearchBase,
      userAttributesCount: this.config.userAttributes.length,
      searchFilter: this.config.searchFilter
    });

    // Log específico de atributos para employeeID
    console.log('🔍 Atributos configurados para employeeID:');
    console.log('  - Incluye employeeID:', this.config.userAttributes.includes('employeeID'));
    console.log('  - Incluye employeeNumber:', this.config.userAttributes.includes('employeeNumber'));
  }

  private getDefaultUserAttributes(): string[] {
    console.log('📋 Configurando atributos LDAP...');
    
    // Atributos mínimos obligatorios - INCLUYENDO employeeID
    const mandatoryAttributes = [
      'distinguishedName',
      'sAMAccountName',
      'employeeID',        // ← CRÍTICO: Para tu caso con EmployeeID: 1234567890
      'employeeNumber',    // ← También para compatibilidad
      'displayName',
      'mail',
      'givenName',
      'sn',
      'cn',
      'title',
      'department',
      'memberOf',
      'userAccountControl'
    ];

    // Si hay atributos en .env, combinarlos
    let allAttributes = [...mandatoryAttributes];
    
    if (process.env.LDAP_USER_ATTRIBUTES) {
      const envAttributes = process.env.LDAP_USER_ATTRIBUTES!
        .split(',')
        .map(attr => attr.trim())
        .filter(attr => attr.length > 0);
      
      console.log('📝 Atributos desde .env:', envAttributes);
      
      // Combinar sin duplicados
      envAttributes.forEach(attr => {
        const attrLower = attr.toLowerCase();
        if (!allAttributes.some(a => a.toLowerCase() === attrLower)) {
          allAttributes.push(attr);
        }
      });
    }

    // Asegurar que employeeID esté presente (duplicado para seguridad)
    if (!allAttributes.includes('employeeID')) {
      allAttributes.push('employeeID');
      console.log('⚠️  Forzando inclusión de employeeID');
    }

    console.log(`✅ Atributos finales (${allAttributes.length}):`, allAttributes);
    return allAttributes;
  }

  async authenticateUser(username: string, password: string): Promise<{ 
    authenticated: boolean; 
    message?: string; 
    userDN?: string;
  }> {
    console.log(`=== LDAP AUTHENTICATE: ${username} ===`);
    
    const client = ldap.createClient({
      url: this.config.url,
      timeout: 10000,
      connectTimeout: 10000
    });

    return new Promise((resolve) => {
      this.getUserDN(username).then(userDN => {
        if (!userDN) {
          console.log(`❌ Usuario no encontrado: ${username}`);
          client.destroy();
          resolve({ 
            authenticated: false, 
            message: 'Usuario no encontrado en Active Directory' 
          });
          return;
        }

        console.log(`✅ DN encontrado: ${userDN}`);
        
        client.bind(userDN, password, (bindErr) => {
          client.destroy();
          
          if (bindErr) {
            console.log(`❌ Error en bind: ${bindErr.message}`);
            resolve({ 
              authenticated: false, 
              message: 'Credenciales inválidas',
              userDN: userDN
            });
          } else {
            console.log(`✅ Autenticación exitosa para: ${username}`);
            resolve({ 
              authenticated: true, 
              message: 'Autenticación exitosa',
              userDN: userDN
            });
          }
        });
      }).catch((error) => {
        console.error(`❌ Error en getUserDN: ${error}`);
        client.destroy();
        resolve({ 
          authenticated: false, 
          message: 'Error al buscar usuario' 
        });
      });
    });
  }

  private async getUserDN(username: string): Promise<string | null> {
    console.log(`=== GET USER DN: ${username} ===`);
    
    const client = ldap.createClient({
      url: this.config.url,
      timeout: 10000
    });

    return new Promise((resolve) => {
      client.bind(this.config.bindDN, this.config.bindPassword, (bindErr) => {
        if (bindErr) {
          console.error(`❌ Error en bind de servicio: ${bindErr.message}`);
          client.destroy();
          resolve(null);
          return;
        }

        const searchFilter = this.config.searchFilter.replace('%s', username);
        console.log(`🔍 Filter de búsqueda: ${searchFilter}`);
        
        const searchOptions: SearchOptions = {
          scope: 'sub',
          filter: searchFilter,
          attributes: ['distinguishedName'],
          sizeLimit: 1
        };

        client.search(this.config.userSearchBase, searchOptions, (searchErr, res) => {
          if (searchErr) {
            console.error(`❌ Error en búsqueda: ${searchErr.message}`);
            client.destroy();
            resolve(null);
            return;
          }

          let userDN: string | null = null;
          
          res.on('searchEntry', (entry: SearchEntry) => {
            if (entry.objectName) {
              userDN = entry.objectName.toString();
              console.log(`✅ Entry encontrada: ${userDN}`);
            }
          });

          res.on('error', (err: Error) => {
            console.error(`❌ Error en stream: ${err.message}`);
          });

          res.on('end', () => {
            console.log(`📦 Búsqueda finalizada. DN: ${userDN}`);
            client.destroy();
            resolve(userDN);
          });
        });
      });
    });
  }

  async getUserDetails(username: string, customAttributes?: string[]): Promise<{
    success: boolean;
    methodUsed: string;
    data: ADUserData;
    error?: string;
  }> {
    console.log(`=== GET USER DETAILS: ${username} ===`);
    console.log(`🎯 OBJETIVO PRINCIPAL: Obtener employeeID del usuario`);
    
    const client = ldap.createClient({
      url: this.config.url,
      timeout: 15000,
      connectTimeout: 15000,
      reconnect: true
    });

    // Priorizar employeeID en los atributos
    let attributesToRequest = customAttributes || this.config.userAttributes;
    if (!attributesToRequest.includes('employeeID')) {
      attributesToRequest = ['employeeID', ...attributesToRequest];
    }
    
    console.log(`📋 Atributos solicitados:`, attributesToRequest);

    return new Promise((resolve, reject) => {
      client.on('error', (err: Error) => {
        console.error(`❌ Error de cliente LDAP: ${err.message}`);
        client.destroy();
        reject(err);
      });

      // 1. Bind con cuenta de servicio
      client.bind(this.config.bindDN, this.config.bindPassword, (bindErr: Error | null) => {
        if (bindErr) {
          console.error(`❌ Error en bind de servicio: ${bindErr.message}`);
          client.destroy();
          resolve({
            success: false,
            methodUsed: 'LDAP bind fallido',
            data: this.createFallbackUserData(username),
            error: `Error de conexión LDAP: ${bindErr.message}`
          });
          return;
        }

        console.log(`✅ Bind de servicio exitoso`);
        
        // 2. Buscar usuario
        const searchFilter = this.config.searchFilter.replace('%s', username);
        const searchOptions: SearchOptions = {
          scope: 'sub',
          filter: searchFilter,
          attributes: attributesToRequest,
          sizeLimit: 1
        };

        console.log(`🔍 Buscando usuario con filter: ${searchFilter}`);
        console.log(`📍 Base de búsqueda: ${this.config.userSearchBase}`);
        console.log(`🎯 Atributos clave para employeeID:`, attributesToRequest.filter(a => 
          a.toLowerCase().includes('employee') || a.toLowerCase().includes('id')
        ));
        
        client.search(this.config.userSearchBase, searchOptions, (searchErr, res) => {
          if (searchErr) {
            console.error(`❌ Error en búsqueda: ${searchErr.message}`);
            client.destroy();
            resolve({
              success: false,
              methodUsed: 'LDAP búsqueda fallida',
              data: this.createFallbackUserData(username),
              error: `Error en búsqueda: ${searchErr.message}`
            });
            return;
          }

          const entries: any[] = [];
          
          res.on('searchEntry', (entry: SearchEntry) => {
            console.log(`✅ Entrada encontrada para usuario: ${username}`);
            const entryObject = this.searchEntryToObject(entry);
            
            // DEBUG DETALLADO del objeto entry
            console.log('=== ENTRY OBJECT DEBUG ===');
            console.log('Todos los campos del entry:', Object.keys(entryObject));
            
            // Verificar específicamente employeeID
            console.log('🔍 BUSCANDO employeeID EN ENTRY:');
            console.log('  • employeeID:', entryObject.employeeID);
            console.log('  • employeeNumber:', entryObject.employeeNumber);
            console.log('  • employeeid (minúsculas):', entryObject.employeeid);
            console.log('  • employeeNumber (minúsculas):', entryObject.employeenumber);
            
            // Mostrar todos los campos que contengan "employee" o "id"
            Object.keys(entryObject).forEach(key => {
              if (key.toLowerCase().includes('employee') || key.toLowerCase().includes('id')) {
                console.log(`  • ${key}:`, entryObject[key]);
              }
            });
            
            entries.push(entryObject);
          });

          res.on('error', (err: Error) => {
            console.error(`❌ Error en stream de búsqueda: ${err.message}`);
          });

          res.on('end', () => {
            console.log(`📦 Búsqueda finalizada. Encontradas ${entries.length} entradas`);
            client.destroy();

            if (entries.length === 0) {
              console.log(`❌ No se encontraron entradas para: ${username}`);
              resolve({
                success: false,
                methodUsed: 'LDAP - usuario no encontrado',
                data: this.createFallbackUserData(username),
                error: 'Usuario no encontrado en Active Directory'
              });
              return;
            }

            const userEntry = entries[0];
            console.log(`🎯 Procesando entrada del usuario`);
            const userData = this.processUserData(userEntry, username, attributesToRequest);
            
            console.log(`✅ DATOS PROCESADOS FINALES:`);
            console.log(`  • employeeID: "${userData.employeeID}" (${typeof userData.employeeID})`);
            console.log(`  • employeeNumber: "${userData.employeeNumber}" (${typeof userData.employeeNumber})`);
            console.log(`  • displayName: "${userData.displayName}"`);
            console.log(`  • sAMAccountName: "${userData.sAMAccountName}"`);
            console.log(`  • title: "${userData.title}"`);
            console.log(`  • department: "${userData.department}"`);
            console.log(`  • OU Structure:`, userData.ouStructure);
            
            resolve({
              success: true,
              methodUsed: 'LDAP directo - datos completos',
              data: userData
            });
          });
        });
      });
    });
  }

  private searchEntryToObject(entry: SearchEntry): any {
    const obj: any = {
      dn: entry.objectName ? entry.objectName.toString() : '',
      distinguishedName: entry.objectName ? entry.objectName.toString() : ''
    };

    console.log('📝 Atributos recibidos del LDAP:');
    
    entry.attributes?.forEach((attr: any) => {
      const attrName = attr.type;
      const attrValues = attr.values;
      
      console.log(`  • ${attrName}:`, attrValues);
      
      if (attrValues && attrValues.length > 0) {
        obj[attrName] = attrValues.length === 1 ? attrValues[0] : attrValues;
      }
    });

    return obj;
  }

  private processUserData(entry: any, username: string, requestedAttributes: string[]): ADUserData {
    console.log('🔄 PROCESANDO DATOS DEL USUARIO');
    
    // Función mejorada para obtener campos (case-insensitive)
    const getField = (fieldNames: string[], defaultValue: string = ''): string => {
      for (const fieldName of fieldNames) {
        // Buscar exacto
        if (entry[fieldName] !== undefined && entry[fieldName] !== null && entry[fieldName] !== '') {
          const value = String(entry[fieldName]).trim();
          console.log(`✅ Campo encontrado: ${fieldName} = "${value}"`);
          return value;
        }
        
        // Buscar case-insensitive
        const entryKeys = Object.keys(entry);
        const matchingKey = entryKeys.find(key => key.toLowerCase() === fieldName.toLowerCase());
        if (matchingKey && entry[matchingKey]) {
          const value = String(entry[matchingKey]).trim();
          console.log(`✅ Campo encontrado (case-insensitive): ${matchingKey} = "${value}"`);
          return value;
        }
      }
      console.log(`⚠️  Campo no encontrado: ${fieldNames[0]}, usando: "${defaultValue}"`);
      return defaultValue;
    };

    // ESPECIAL: Buscar employeeID de múltiples formas
    const employeeID = getField(['employeeID', 'employeeid', 'EmployeeID', 'EmployeeId'], '');
    const employeeNumber = getField(['employeeNumber', 'employeenumber', 'EmployeeNumber'], '');
    
    console.log('🔍 RESULTADO BUSQUEDA EMPLOYEE ID:');
    console.log(`  • employeeID: "${employeeID}"`);
    console.log(`  • employeeNumber: "${employeeNumber}"`);
    
    // Si no se encuentra employeeID, mostrar todos los campos para debug
    if (!employeeID && !employeeNumber) {
      console.log('⚠️  NO SE ENCONTRÓ employeeID NI employeeNumber');
      console.log('📋 Todos los campos disponibles:', Object.keys(entry));
    }

    const memberOf = this.normalizeMemberOf(entry.memberOf);
    const ouExtraction = this.extractOUInfo(entry.dn || entry.distinguishedName);
    const ouStructure = this.extractOUStructure(entry.dn || entry.distinguishedName);

    const result: ADUserData = {
      // Identificación
      dn: getField(['dn', 'distinguishedName'], ''),
      distinguishedName: getField(['distinguishedName', 'dn'], ''),
      sAMAccountName: getField(['sAMAccountName', 'samaccountname'], username),
      
      // Employee ID (PRIORITARIO)
      employeeID: employeeID,
      employeeNumber: employeeNumber,
      
      // Información personal
      displayName: getField(['displayName', 'displayname', 'cn'], username),
      mail: getField(['mail', 'userPrincipalName'], `${username}@2cal1.c1`),
      givenName: getField(['givenName', 'givenname'], ''),
      sn: getField(['sn', 'surname'], ''),
      cn: getField(['cn'], username),
      
      // Información organizacional
      title: getField(['title', 'description'], 'Sin cargo'),
      department: getField(['department'], 'Sin departamento'),
      company: getField(['company'], ''),
      physicalDeliveryOfficeName: getField(['physicalDeliveryOfficeName', 'physicaldeliveryofficename'], ''),
      
      // Información de contacto
      telephoneNumber: getField(['telephoneNumber', 'telephonenumber'], ''),
      mobile: getField(['mobile'], ''),
      
      // Grupos y permisos
      memberOf: memberOf,
      userAccountControl: this.parseUserAccountControl(entry.userAccountControl || entry.useraccountcontrol),
      isAccountEnabled: this.isAccountEnabled(entry.userAccountControl || entry.useraccountcontrol),
      
      // Información de OU
      ou: ouExtraction.primaryOU,
      allOUs: ouExtraction.allOUs,
      parentContainer: ouExtraction.parentContainer,
      
      // NUEVO: Estructura de OU
      ouStructure: ouStructure,
      
      // Metadatos
      _metadata: {
        source: 'Active Directory',
        hasFullData: true,
        readSuccess: true,
        timestamp: new Date().toISOString(),
        methodUsed: 'LDAP search con atributos completos',
        searchBase: this.config.userSearchBase,
        attributesRequested: requestedAttributes,
        ouExtraction: {
          method: ouExtraction.method,
          success: ouExtraction.success,
          rawDN: entry.dn || entry.distinguishedName || '',
          structureAnalysis: this.analyzeOUStructure(ouStructure)
        }
      }
    };

    return result;
  }

  // NUEVO MÉTODO: Extraer estructura de OU del DN
  private extractOUStructure(dn: string): {
    colombia?: string;
    ti?: string;
    platform?: string;
    fullPath: string[];
    isInTI: boolean;
    isInColombia: boolean;
    isInPlatform?: boolean;
  } {
    if (!dn) {
      return {
        fullPath: [],
        isInTI: false,
        isInColombia: false,
        isInPlatform: false
      };
    }

    try {
      console.log(`🧩 Analizando estructura de OU del DN: ${dn}`);
      
      const fullPath: string[] = [];
      let colombiaOU: string | undefined;
      let tiOU: string | undefined;
      let platformOU: string | undefined;
      
      const parts = dn.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (part.toUpperCase().startsWith('OU=')) {
          const ouName = part.substring(3);
          fullPath.push(ouName);
          
          // Detectar OUs específicas basadas en tu estructura
          const ouNameLower = ouName.toLowerCase();
          if (ouNameLower === 'colombia') {
            colombiaOU = ouName;
          } else if (ouNameLower === 'ti') {
            tiOU = ouName;
          } else if (ouNameLower === 'plataforma') {
            platformOU = ouName;
          }
        }
      }
      
      // Determinar si está en Colombia o TI
      const isInColombia = fullPath.some(ou => ou.toLowerCase() === 'colombia');
      const isInTI = fullPath.some(ou => ou.toLowerCase() === 'ti');
      const isInPlatform = fullPath.some(ou => ou.toLowerCase() === 'plataforma');
      
      console.log(`✅ Estructura analizada:`, {
        colombia: colombiaOU,
        ti: tiOU,
        platform: platformOU,
        isInColombia,
        isInTI,
        isInPlatform,
        fullPath
      });
      
      return {
        colombia: colombiaOU,
        ti: tiOU,
        platform: platformOU,
        fullPath,
        isInTI,
        isInColombia,
        isInPlatform
      };
      
    } catch (error) {
      console.error('❌ Error analizando estructura de OU:', error);
      return {
        fullPath: [],
        isInTI: false,
        isInColombia: false,
        isInPlatform: false
      };
    }
  }

  // NUEVO MÉTODO: Analizar estructura de OU para metadatos
  private analyzeOUStructure(ouStructure: any): string {
    const parts = [];
    
    if (ouStructure.isInColombia) {
      parts.push('En Colombia');
      if (ouStructure.isInTI) {
        parts.push('dentro de TI');
      }
    }
    
    if (ouStructure.isInPlatform) {
      parts.push('En Plataforma');
    }
    
    if (ouStructure.fullPath.length > 0) {
      parts.push(`Ruta: ${ouStructure.fullPath.join(' → ')}`);
    }
    
    return parts.join(', ') || 'Sin estructura específica';
  }

  private extractOUInfo(dn: string): {
    primaryOU: string | undefined;
    allOUs: string[];
    parentContainer: string | undefined;
    method: string;
    success: boolean;
  } {
    if (!dn) {
      return {
        primaryOU: undefined,
        allOUs: [],
        parentContainer: undefined,
        method: 'none',
        success: false
      };
    }

    try {
      console.log(`🧩 Extrayendo OU de DN: ${dn}`);
      
      const allOUs: string[] = [];
      let primaryOU: string | undefined;
      
      const parts = dn.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (part.toUpperCase().startsWith('OU=')) {
          const ouName = part.substring(3);
          allOUs.push(ouName);
          
          if (!primaryOU) {
            primaryOU = ouName;
          }
        }
      }
      
      console.log(`✅ OUs extraídas:`, allOUs);
      
      return {
        primaryOU,
        allOUs,
        parentContainer: allOUs.length > 0 ? allOUs[allOUs.length - 1] : undefined,
        method: 'dn-parsing',
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error extrayendo OU:', error);
      return {
        primaryOU: undefined,
        allOUs: [],
        parentContainer: undefined,
        method: 'error',
        success: false
      };
    }
  }

  private parseUserAccountControl(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private normalizeMemberOf(memberOf: any): string[] {
    if (!memberOf) return [];
    
    if (Array.isArray(memberOf)) {
      return memberOf.map(item => String(item));
    }
    
    if (typeof memberOf === 'string') {
      return [memberOf];
    }
    
    return [];
  }

  private isAccountEnabled(userAccountControl: any): boolean {
    const uac = this.parseUserAccountControl(userAccountControl);
    // 0x0002 = ACCOUNTDISABLE flag
    return !(uac & 0x0002);
  }

  private createFallbackUserData(username: string): ADUserData {
    console.log(`⚠️ Creando datos fallback para: ${username}`);
    return {
      dn: '',
      distinguishedName: '',
      sAMAccountName: username,
      employeeID: '',
      employeeNumber: '',
      displayName: username,
      mail: `${username}@2cal1.c1`,
      givenName: '',
      sn: '',
      cn: username,
      title: 'Usuario',
      department: '',
      company: '',
      telephoneNumber: '',
      memberOf: [],
      userAccountControl: 0,
      isAccountEnabled: true,
      ou: undefined,
      allOUs: [],
      parentContainer: undefined,
      ouStructure: {
        fullPath: [],
        isInTI: false,
        isInColombia: false,
        isInPlatform: false
      },
      _metadata: {
        source: 'Fallback',
        hasFullData: false,
        readSuccess: false,
        timestamp: new Date().toISOString(),
        methodUsed: 'Datos por defecto'
      }
    };
  }

  private analyzeGroups(memberOf: string[]): { isAdmin: boolean; totalGroups: number; adminGroups?: string[] } {
    const adminKeywords = ['admin', 'administrador', 'administradores', 'domain admins', 'enterprise admins'];
    const adminGroups: string[] = [];

    memberOf.forEach(group => {
      const groupName = group.toLowerCase();
      if (adminKeywords.some(keyword => groupName.includes(keyword))) {
        adminGroups.push(group);
      }
    });

    return {
      isAdmin: adminGroups.length > 0,
      totalGroups: memberOf.length,
      adminGroups: adminGroups.length > 0 ? adminGroups : undefined
    };
  }

  public async validateUserOU(username: string, allowedOUs: string[]): Promise<{
    isValid: boolean;
    userOU?: string;
    allOUs?: string[];
    message?: string;
  }> {
    try {
      const result = await this.getUserDetails(username, ['distinguishedName']);
      
      if (!result.success) {
        return {
          isValid: false,
          message: 'No se pudo obtener información del usuario'
        };
      }
      
      const userData = result.data;
      const userOU = userData.ou;
      const userAllOUs = userData.allOUs || [];
      
      if (!userOU) {
        return {
          isValid: false,
          message: 'Usuario no pertenece a ninguna OU identificable'
        };
      }
      
      const hasAllowedOU = allowedOUs.some(allowedOU => 
        userAllOUs.some(userOUItem => 
          userOUItem.toLowerCase() === allowedOU.toLowerCase()
        ) || userOU.toLowerCase() === allowedOU.toLowerCase()
      );
      
      return {
        isValid: hasAllowedOU,
        userOU,
        allOUs: userAllOUs,
        message: hasAllowedOU 
          ? `Usuario válido - OU: ${userOU}` 
          : `Usuario no permitido - OU: ${userOU}. Permitidas: ${allowedOUs.join(', ')}`
      };
      
    } catch (error: any) {
      return {
        isValid: false,
        message: `Error en validación: ${error.message}`
      };
    }
  }

  // Método específico para debug de employeeID
  public async debugEmployeeID(username: string): Promise<{
    success: boolean;
    employeeID?: string;
    employeeNumber?: string;
    allFields?: Record<string, any>;
    rawEntry?: any;
  }> {
    try {
      const client = ldap.createClient({
        url: this.config.url,
        timeout: 10000
      });

      return new Promise((resolve) => {
        client.bind(this.config.bindDN, this.config.bindPassword, (bindErr) => {
          if (bindErr) {
            console.error('❌ Bind error:', bindErr);
            client.destroy();
            resolve({ success: false });
            return;
          }

          const searchFilter = this.config.searchFilter.replace('%s', username);
          const searchOptions: SearchOptions = {
            scope: 'sub',
            filter: searchFilter,
            attributes: ['*'], // Solicitar TODOS los atributos
            sizeLimit: 1
          };

          client.search(this.config.userSearchBase, searchOptions, (searchErr, res) => {
            if (searchErr) {
              console.error('❌ Search error:', searchErr);
              client.destroy();
              resolve({ success: false });
              return;
            }

            let rawEntry: any = null;
            
            res.on('searchEntry', (entry: SearchEntry) => {
              rawEntry = this.searchEntryToObject(entry);
              
              console.log('=== DEBUG COMPLETO DE ATRIBUTOS ===');
              Object.keys(rawEntry).forEach(key => {
                console.log(`  • ${key}:`, rawEntry[key]);
              });
            });

            res.on('end', () => {
              client.destroy();
              
              if (!rawEntry) {
                resolve({ success: false });
                return;
              }

              const employeeID = rawEntry.employeeID || rawEntry.employeeid || rawEntry.EmployeeID;
              const employeeNumber = rawEntry.employeeNumber || rawEntry.employeenumber || rawEntry.EmployeeNumber;

              resolve({
                success: true,
                employeeID,
                employeeNumber,
                allFields: rawEntry,
                rawEntry
              });
            });
          });
        });
      });
    } catch (error) {
      console.error('❌ Debug error:', error);
      return { success: false };
    }
  }

  // NUEVO MÉTODO: Obtener solo la estructura de OU
  public async getUserOUStructure(username: string): Promise<{
    success: boolean;
    ouStructure?: {
      colombia?: string;
      ti?: string;
      platform?: string;
      fullPath: string[];
      isInTI: boolean;
      isInColombia: boolean;
      isInPlatform?: boolean;
    };
    error?: string;
  }> {
    try {
      const result = await this.getUserDetails(username, ['distinguishedName']);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      return {
        success: true,
        ouStructure: result.data.ouStructure
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // NUEVO MÉTODO: Verificar si usuario está en Colombia
  public async isUserInColombia(username: string): Promise<{
    success: boolean;
    isInColombia?: boolean;
    details?: {
      ou?: string;
      fullPath?: string[];
      structure?: any;
    };
    error?: string;
  }> {
    try {
      const result = await this.getUserDetails(username, ['distinguishedName']);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      const ouStructure = result.data.ouStructure;
      
      return {
        success: true,
        isInColombia: ouStructure?.isInColombia || false,
        details: {
          ou: result.data.ou,
          fullPath: result.data.allOUs,
          structure: ouStructure
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}