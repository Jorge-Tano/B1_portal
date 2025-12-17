import ldap from 'ldapjs';

export interface ADUser {
  dn: string;
  sAMAccountName: string;
  displayName: string;
  mail: string;
  department?: string;
  title?: string;
  company?: string;
  memberOf: string[];
  // ... otros atributos
}

export async function authenticateWithServiceAccount(
  username: string,
  password: string
): Promise<ADUser | null> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: process.env.LDAP_SERVER_URL!,
      tlsOptions: { rejectUnauthorized: false },
      timeout: 10000
    });

    // 1. PRIMERO: Bind con cuenta de servicio
    client.bind(
      process.env.LDAP_BIND_DN!, 
      process.env.LDAP_BIND_PASSWORD!, 
      (serviceBindErr) => {
        if (serviceBindErr) {
          client.destroy();
          console.error('[LDAP] Error bind cuenta servicio:', serviceBindErr.message);
          return reject(new Error('Error de configuración LDAP'));
        }

        console.log(`[LDAP] Bind exitoso con cuenta de servicio`);
        
        // 2. BUSCAR usuario con cuenta de servicio
        const searchOptions = {
          filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
          scope: 'sub' as const,
          attributes: [
            'dn', 'sAMAccountName', 'displayName', 'mail',
            'department', 'title', 'company', 'physicalDeliveryOfficeName',
            'telephoneNumber', 'manager', 'employeeType', 'memberOf'
          ]
        };

        client.search(process.env.LDAP_BASE_DN!, searchOptions, (searchErr, res) => {
          let userEntry: any = null;
          let userDN: string = '';

          res.on('searchEntry', (entry) => {
            userEntry = entry.object;
            userDN = entry.object.dn;
            console.log(`[LDAP] Usuario encontrado: ${userEntry.displayName}`);
          });

          res.on('error', (err) => {
            client.destroy();
            console.error('[LDAP] Error en búsqueda:', err.message);
            reject(new Error('Error buscando usuario'));
          });

          res.on('end', () => {
            if (!userEntry) {
              client.destroy();
              console.log(`[LDAP] Usuario ${username} no encontrado`);
              return resolve(null);
            }

            // 3. VERIFICAR credenciales del usuario
            // Creamos un NUEVO cliente para verificar las credenciales del usuario
            const userClient = ldap.createClient({
              url: process.env.LDAP_SERVER_URL!,
              tlsOptions: { rejectUnauthorized: false }
            });

            userClient.bind(userDN, password, (userBindErr) => {
              userClient.destroy();
              
              if (userBindErr) {
                client.destroy();
                console.log(`[LDAP] Credenciales inválidas para ${username}`);
                return resolve(null);
              }

              // 4. ÉXITO - Cerrar cliente principal
              client.unbind(() => {
                client.destroy();
                
                console.log(`[LDAP] Autenticación exitosa: ${username}`);
                
                const user: ADUser = {
                  dn: userDN,
                  sAMAccountName: userEntry.sAMAccountName,
                  displayName: userEntry.displayName || userEntry.sAMAccountName,
                  mail: userEntry.mail || `${username}@${process.env.LDAP_DOMAIN}`,
                  department: userEntry.department,
                  title: userEntry.title,
                  company: userEntry.company,
                  memberOf: userEntry.memberOf || []
                };
                
                resolve(user);
              });
            });
          });
        });
      }
    );

    client.on('error', (err) => {
      console.error('[LDAP] Error de conexión:', err.message);
      client.destroy();
      reject(new Error('No se puede conectar al servidor AD'));
    });
  });
}