import { Client } from "ldapts";

export class LdapClient {
  private getClient() {
    return new Client({
      url: process.env.LDAP_SERVER_URL!,
      timeout: 10000,
      connectTimeout: 10000,
    });
  }

  private toString(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    return String(value);
  }

  private toArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(item => this.toString(item));
    }
    return [this.toString(value)];
  }

  /**
   * 🎯 1. AUTENTICACIÓN DIRECTA - YA FUNCIONA
   */
  async authenticateUser(username: string, password: string): Promise<{
    authenticated: boolean;
    username: string;
    message?: string;
  }> {
    console.log(`🔐 Autenticando: ${username}`);
    
    const authString = `${username}@${process.env.LDAP_DOMAIN}`;
    const userClient = this.getClient();
    
    try {
      console.log(`   Formato: ${authString}`);
      await userClient.bind(authString, password);
      console.log(`   ✅ Autenticación exitosa`);
      await userClient.unbind();
      
      return {
        authenticated: true,
        username: username,
      };
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      await userClient.unbind().catch(() => {});
      
      if (error.message.includes('52e')) {
        return {
          authenticated: false,
          username: username,
          message: 'Usuario o contraseña incorrectos'
        };
      }
      
      return {
        authenticated: false,
        username: username,
        message: 'Error de autenticación'
      };
    }
  }

  /**
   * 🔍 2. INTENTAR LEER DATOS con diferentes métodos
   */
  async getUserDetails(username: string): Promise<{
    success: boolean;
    data: any;
    methodUsed: string;
    error?: string;
  }> {
    console.log(`📋 Intentando leer datos para: ${username}`);
    
    // Método 1: Intentar con credenciales de servicio configuradas
    if (process.env.LDAP_BIND_DN && process.env.LDAP_BIND_PASSWORD) {
      console.log('   Método 1: Usando credenciales de servicio...');
      try {
        const result = await this.tryWithServiceAccount(username);
        if (result.success) {
          return {
            success: true,
            data: result.data,
            methodUsed: 'Servicio AD (completo)'
          };
        }
      } catch (error: any) {
        console.log(`   ❌ Método 1 falló: ${error.message}`);
      }
    }
    
    // Método 2: Intentar autenticación anónima (solo lectura básica)
    console.log('   Método 2: Intentando lectura anónima...');
    try {
      const result = await this.tryAnonymousRead(username);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          methodUsed: 'Lectura anónima (básica)'
        };
      }
    } catch (error: any) {
      console.log(`   ❌ Método 2 falló: ${error.message}`);
    }
    
    // Método 3: Usar la sesión autenticada del usuario para leer sus propios datos
    console.log('   Método 3: Intentando con sesión del usuario...');
    try {
      const result = await this.tryWithUserSession(username);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          methodUsed: 'Sesión usuario (propios datos)'
        };
      }
    } catch (error: any) {
      console.log(`   ❌ Método 3 falló: ${error.message}`);
    }
    
    // Método 4: Datos derivados del username
    console.log('   Método 4: Usando datos derivados...');
    return {
      success: true,
      data: this.getDerivedUserInfo(username),
      methodUsed: 'Datos derivados (mínimos)',
      error: 'No se pudo leer de AD, usando datos básicos'
    };
  }

  /**
   * 2a. Método con credenciales de servicio
   */
  private async tryWithServiceAccount(username: string): Promise<{
    success: boolean;
    data?: any;
  }> {
    const serviceClient = this.getClient();
    
    try {
      console.log(`      Servicio: ${process.env.LDAP_BIND_DN}`);
      
      // PRUEBA DIFERENTES FORMATOS para el DN del servicio
      const serviceAttempts = [
        process.env.LDAP_BIND_DN!,
        `CN=${process.env.LDAP_BIND_DN!.split('@')[0]},CN=Users,DC=2call,DC=cl`,
        `${process.env.LDAP_BIND_DN!.split('@')[0]}@2call.cl`,
        `2CALL\\${process.env.LDAP_BIND_DN!.split('@')[0]}`
      ];
      
      let bindSuccess = false;
      let bindError = null;
      
      for (const bindDN of serviceAttempts) {
        try {
          console.log(`      Probando bind con: ${bindDN}`);
          await serviceClient.bind(bindDN, process.env.LDAP_BIND_PASSWORD!);
          bindSuccess = true;
          console.log(`      ✅ Bind exitoso con: ${bindDN}`);
          break;
        } catch (bindErr: any) {
          bindError = bindErr;
          console.log(`      ❌ Bind falló: ${bindErr.message}`);
        }
      }
      
      if (!bindSuccess) {
        throw new Error(`Todos los binds fallaron: ${bindError?.message}`);
      }
      
      // Buscar usuario
      const searchResult = await serviceClient.search(
        process.env.LDAP_BASE_DN || 'DC=2call,DC=cl', {
        scope: "sub",
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
        attributes: [
          "sAMAccountName", "displayName", "mail", "department", "title",
          "company", "physicalDeliveryOfficeName", "telephoneNumber", "mobile",
          "memberOf", "userAccountControl", "givenName", "sn"
        ],
      });

      if (searchResult.searchEntries.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const entry = searchResult.searchEntries[0];
      const memberOfArray = this.toArray(entry.memberOf);
      const userAccountControl = parseInt(this.toString(entry.userAccountControl)) || 0;
      const isAccountEnabled = (userAccountControl & 2) === 0;

      return {
        success: true,
        data: {
          dn: this.toString(entry.dn) || '',
          sAMAccountName: this.toString(entry.sAMAccountName) || username,
          displayName: this.toString(entry.displayName) || 
                     this.formatDisplayName(username),
          mail: this.toString(entry.mail) || `${username}@${process.env.LDAP_DOMAIN}`,
          department: this.toString(entry.department) || '',
          title: this.toString(entry.title) || '',
          company: this.toString(entry.company) || '2call.cl',
          physicalDeliveryOfficeName: this.toString(entry.physicalDeliveryOfficeName) || '',
          telephoneNumber: this.toString(entry.telephoneNumber) || '',
          mobile: this.toString(entry.mobile) || '',
          memberOf: memberOfArray,
          userAccountControl: userAccountControl,
          isAccountEnabled: isAccountEnabled,
          groupAnalysis: {
            isAdmin: memberOfArray.some(g => 
              g.toLowerCase().includes('admin') || 
              g.toLowerCase().includes('administrators')
            ),
            totalGroups: memberOfArray.length
          }
        }
      };

    } catch (error: any) {
      console.error(`      ❌ Error con servicio: ${error.message}`);
      return {
        success: false
      };
    } finally {
      await serviceClient.unbind().catch(() => {});
    }
  }

  /**
   * 2b. Método con lectura anónima
   */
  private async tryAnonymousRead(username: string): Promise<{
    success: boolean;
    data?: any;
  }> {
    const client = this.getClient();
    
    try {
      // Intentar bind anónimo
      await client.bind('', '');
      console.log('      ✅ Bind anónimo exitoso');
      
      // Algunos AD permiten lectura anónima limitada
      const searchResult = await client.search(
        process.env.LDAP_BASE_DN || 'DC=2call,DC=cl', {
        scope: "sub",
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
        attributes: ["sAMAccountName", "displayName", "mail"],
      });

      if (searchResult.searchEntries.length === 0) {
        return { success: false };
      }

      const entry = searchResult.searchEntries[0];
      
      return {
        success: true,
        data: {
          sAMAccountName: this.toString(entry.sAMAccountName) || username,
          displayName: this.toString(entry.displayName) || 
                     this.formatDisplayName(username),
          mail: this.toString(entry.mail) || `${username}@${process.env.LDAP_DOMAIN}`,
          // Datos limitados en modo anónimo
          department: '',
          title: '',
          company: '2call.cl',
          telephoneNumber: '',
          mobile: '',
          memberOf: [],
          isAccountEnabled: true
        }
      };

    } catch (error: any) {
      console.log(`      ❌ Lectura anónima falló: ${error.message}`);
      return { success: false };
    } finally {
      await client.unbind().catch(() => {});
    }
  }

  /**
   * 2c. Método usando la sesión del usuario (si tuviéramos su conexión activa)
   * Nota: Esto es teórico, ya que no mantenemos la conexión LDAP del usuario
   */
  private async tryWithUserSession(username: string): Promise<{
    success: boolean;
    data?: any;
  }> {
    // En un escenario ideal, mantendríamos la conexión LDAP del usuario
    // para leer sus propios datos. Como no la tenemos, este método
    // generalmente fallará.
    return { success: false };
  }

  /**
   * 2d. Datos derivados del username
   */
  private getDerivedUserInfo(username: string): any {
    return {
      sAMAccountName: username,
      displayName: this.formatDisplayName(username),
      mail: `${username}@${process.env.LDAP_DOMAIN}`,
      department: '',
      title: '',
      company: '2call.cl',
      physicalDeliveryOfficeName: '',
      telephoneNumber: '',
      mobile: '',
      memberOf: [],
      userAccountControl: 0,
      isAccountEnabled: true,
      groupAnalysis: {
        isAdmin: false,
        totalGroups: 0
      }
    };
  }

  /**
   * 3. Formatear nombre del usuario
   */
  private formatDisplayName(username: string): string {
    // juan.quintero -> Juan Quintero
    const parts = username.split('.');
    if (parts.length >= 2) {
      return parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  /**
   * 🧪 4. Diagnosticar problema con AD
   */
  async diagnoseConnection(): Promise<{
    authenticationWorks: boolean;
    serviceAccountWorks: boolean;
    anonymousReadWorks: boolean;
    suggestions: string[];
  }> {
    const results = {
      authenticationWorks: false,
      serviceAccountWorks: false,
      anonymousReadWorks: false,
      suggestions: [] as string[]
    };
    
    // Test 1: Autenticación básica
    try {
      const testClient = this.getClient();
      await testClient.bind(`test@${process.env.LDAP_DOMAIN}`, 'test');
      await testClient.unbind();
    } catch (error: any) {
      if (error.message.includes('52e')) {
        results.authenticationWorks = true; // 52e significa que el servidor responde
        results.suggestions.push('✅ Servidor LDAP responde a autenticaciones');
      }
    }
    
    // Test 2: Credenciales de servicio
    if (process.env.LDAP_BIND_DN && process.env.LDAP_BIND_PASSWORD) {
      try {
        const serviceClient = this.getClient();
        await serviceClient.bind(
          process.env.LDAP_BIND_DN,
          process.env.LDAP_BIND_PASSWORD
        );
        results.serviceAccountWorks = true;
        results.suggestions.push('✅ Credenciales de servicio funcionan');
        await serviceClient.unbind();
      } catch (error: any) {
        results.suggestions.push(`❌ Credenciales de servicio fallan: ${error.message}`);
        results.suggestions.push('💡 Prueba estos formatos para LDAP_BIND_DN:');
        results.suggestions.push('   - b1portal@2call.cl');
        results.suggestions.push('   - CN=b1portal,CN=Users,DC=2call,DC=cl');
        results.suggestions.push('   - 2call\\b1portal');
      }
    } else {
      results.suggestions.push('⚠️ Credenciales de servicio no configuradas');
    }
    
    // Test 3: Lectura anónima
    try {
      const anonClient = this.getClient();
      await anonClient.bind('', '');
      results.anonymousReadWorks = true;
      results.suggestions.push('✅ Lectura anónima disponible');
      await anonClient.unbind();
    } catch (error: any) {
      results.suggestions.push('❌ Lectura anónima no disponible (normal en AD seguro)');
    }
    
    return results;
  }
}