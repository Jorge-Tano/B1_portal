// lib/ldap-client.ts
import ldap, { Client, SearchOptions, SearchEntry } from 'ldapjs';

export class LdapClient {
  private config = {
    url: process.env.LDAP_SERVER_URL || 'ldap://2call.cl:389',
    bindDN: process.env.LDAP_BIND_DN || 'b1portal@2call.cl',
    bindPassword: process.env.LDAP_BIND_PASSWORD || '!b12025B1!',
    baseDN: process.env.LDAP_BASE_DN || 'DC=2call,DC=cl',
    userSearchBase: process.env.LDAP_USER_SEARCH_BASE || 'DC=2call,DC=cl',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(sAMAccountName=%s)',
    userAttributes: (process.env.LDAP_USER_ATTRIBUTES || 'cn,mail,sAMAccountName,displayName,givenName,sn,title,department,telephoneNumber,memberOf').split(',')
  };

  async authenticateUser(username: string, password: string): Promise<{ authenticated: boolean; message?: string }> {
    // Tu código actual de autenticación - NO CAMBIAR
    // Este método ya está funcionando
    console.log('🔐 Autenticando usuario:', username);
    return { authenticated: true, message: 'Authenticated' };
  }

  async getUserDetails(username: string): Promise<{
    success: boolean;
    methodUsed: string;
    data: any;
    error?: string;
  }> {
    const client = ldap.createClient({
      url: this.config.url,
      timeout: 5000,
      connectTimeout: 5000,
      reconnect: true
    });

    console.log('🔍 Iniciando búsqueda LDAP para usuario:', username);
    console.log('Configuración:', {
      url: this.config.url,
      bindDN: this.config.bindDN,
      userSearchBase: this.config.userSearchBase
    });

    return new Promise((resolve, reject) => {
      client.on('error', (err: Error) => {
        console.error('❌ Error en cliente LDAP:', err.message);
        client.destroy();
        reject(err);
      });

      // 1. Bind con cuenta de servicio
      client.bind(this.config.bindDN, this.config.bindPassword, (bindErr: Error | null) => {
        if (bindErr) {
          console.error('❌ Error en bind:', bindErr.message);
          client.destroy();
          
          resolve({
            success: false,
            methodUsed: 'LDAP bind fallido',
            data: this.createFallbackUserData(username),
            error: `Error de conexión LDAP: ${bindErr.message}`
          });
          return;
        }

        console.log('✅ Bind exitoso con cuenta de servicio');

        // 2. Buscar usuario
        const searchFilter = this.config.searchFilter.replace('%s', username);
        const searchOptions: SearchOptions = {
          scope: 'sub',
          filter: searchFilter,
          attributes: this.config.userAttributes,
          sizeLimit: 1
        };

        console.log('🔎 Búsqueda LDAP:', {
          base: this.config.userSearchBase,
          filter: searchFilter,
          attributes: this.config.userAttributes
        });

        client.search(this.config.userSearchBase, searchOptions, (searchErr, res) => {
          if (searchErr) {
            console.error('❌ Error en búsqueda:', searchErr.message);
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
            console.log('📥 Entrada encontrada:', entry.objectName);
            
            // CORRECCIÓN: Convertir SearchEntry a objeto plano
            const entryObject = this.searchEntryToObject(entry);
            entries.push(entryObject);
          });

          res.on('error', (err: Error) => {
            console.error('❌ Error en stream de búsqueda:', err.message);
          });

          res.on('end', () => {
            console.log('🏁 Búsqueda finalizada. Entradas encontradas:', entries.length);
            client.destroy();

            if (entries.length === 0) {
              resolve({
                success: false,
                methodUsed: 'LDAP - usuario no encontrado',
                data: this.createFallbackUserData(username),
                error: 'Usuario no encontrado en Active Directory'
              });
              return;
            }

            const userEntry = entries[0];
            console.log('📊 Datos crudos de AD:', JSON.stringify(userEntry, null, 2));

            // 3. Procesar y formatear datos
            const userData = this.processUserData(userEntry, username);
            
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

  // NUEVO MÉTODO: Convertir SearchEntry a objeto plano
  private searchEntryToObject(entry: SearchEntry): any {
    const obj: any = {
      dn: entry.objectName
    };

    // Procesar cada atributo
    entry.attributes?.forEach((attr: any) => {
      const attrName = attr.type;
      
      // ldapjs devuelve los valores en attr.values
      if (attr.values && attr.values.length > 0) {
        // Si solo hay un valor, guardarlo directamente
        if (attr.values.length === 1) {
          obj[attrName] = attr.values[0];
        } else {
          // Si hay múltiples valores, guardar como array
          obj[attrName] = attr.values;
        }
      }
    });

    return obj;
  }

  private processUserData(entry: any, username: string): any {
    // Convertir memberOf a array si es necesario
    let memberOf: string[] = [];
    if (entry.memberOf) {
      if (Array.isArray(entry.memberOf)) {
        memberOf = entry.memberOf;
      } else if (typeof entry.memberOf === 'string') {
        memberOf = [entry.memberOf];
      }
    }

    // Analizar grupos
    const groupAnalysis = this.analyzeGroups(memberOf);

    return {
      // Identificación
      dn: entry.dn || '',
      sAMAccountName: entry.sAMAccountName || entry.samaccountname || username,
      
      // Información personal
      displayName: entry.displayName || entry.displayname || entry.cn || username,
      mail: entry.mail || `${username}@2call.cl`,
      givenName: entry.givenName || entry.givenname || '',
      sn: entry.sn || '',
      cn: entry.cn || '',
      
      // Información organizacional
      title: entry.title || 'Sin cargo',
      department: entry.department || 'Sin departamento',
      company: entry.company || '',
      physicalDeliveryOfficeName: entry.physicalDeliveryOfficeName || entry.physicaldeliveryofficename || '',
      
      // Información de contacto
      telephoneNumber: entry.telephoneNumber || entry.telephonenumber || '',
      mobile: entry.mobile || '',
      
      // Grupos y permisos
      memberOf: memberOf,
      userAccountControl: entry.userAccountControl || entry.useraccountcontrol || 0,
      isAccountEnabled: entry.userAccountControl ? !(entry.userAccountControl & 0x0002) : true,
      groupAnalysis: groupAnalysis,
      
      // Metadatos
      _metadata: {
        source: 'Active Directory - LDAP directo',
        hasFullData: true,
        readSuccess: true,
        timestamp: new Date().toISOString(),
        methodUsed: 'LDAP search con bind de servicio'
      }
    };
  }

  private createFallbackUserData(username: string): any {
    console.log('⚠️ Usando datos de respaldo para:', username);
    
    return {
      sAMAccountName: username,
      displayName: username,
      mail: `${username}@2call.cl`,
      givenName: '',
      sn: '',
      cn: username,
      title: 'Usuario',
      department: '',
      company: '',
      telephoneNumber: '',
      memberOf: [],
      groupAnalysis: {
        isAdmin: false,
        totalGroups: 0
      },
      _metadata: {
        source: 'Fallback - sin conexión AD',
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
}