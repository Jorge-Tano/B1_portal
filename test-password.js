// test-servicio-account.js
const ldap = require('ldapjs');

async function testServiceAccount() {
  console.log('🔧 TEST ESPECÍFICO PARA CUENTA DE SERVICIO b1portal\n');
  
  const serviceAccounts = [
    // Diferentes formas de referirse a la misma cuenta
    { dn: 'b1portal@2call.cl', type: 'UPN', password: '!b12025B1!' },
    { dn: 'b1portal', type: 'SAM simple', password: '!b12025B1!' },
    { dn: '2call.cl\\b1portal', type: 'Down-Level Logon', password: '!b12025B1!' },
    
    // Posibles DNs según OUs de tu estructura
    { dn: 'CN=b1portal,CN=Users,DC=2call,DC=cl', type: 'DN Users', password: '!b12025B1!' },
    { dn: 'CN=b1portal,OU=TI,DC=2call,DC=cl', type: 'DN TI', password: '!b12025B1!' },
    { dn: 'CN=b1portal,OU=Service Accounts,DC=2call,DC=cl', type: 'DN Service', password: '!b12025B1!' },
    { dn: 'CN=b1portal,OU=Administrativos,DC=2call,DC=cl', type: 'DN Admin', password: '!b12025B1!' },
    { dn: 'CN=b1portal,OU=Plataforma,DC=2call,DC=cl', type: 'DN Plataforma', password: '!b12025B1!' },
    { dn: 'CN=b1portal,OU=Kyros,DC=2call,DC=cl', type: 'DN Kyros', password: '!b12025B1!' },
    
    // Posibles variantes del nombre
    { dn: 'svc-b1portal@2call.cl', type: 'UPN svc-', password: '!b12025B1!' },
    { dn: 'svc_b1portal@2call.cl', type: 'UPN svc_', password: '!b12025B1!' },
    { dn: 'svc.b1portal@2call.cl', type: 'UPN svc.', password: '!b12025B1!' },
  ];

  const url = 'ldap://2call.cl:389';
  let successfulAccount = null;

  for (const account of serviceAccounts) {
    console.log(`\n🧪 Probando: ${account.type}`);
    console.log(`   DN: ${account.dn}`);
    
    const client = ldap.createClient({ 
      url: url, 
      timeout: 3000,
      connectTimeout: 3000
    });

    try {
      const result = await new Promise((resolve) => {
        client.on('error', (err) => {
          console.log(`   ❌ Error de cliente: ${err.message}`);
          resolve({ success: false, error: err.message });
        });

        client.bind(account.dn, account.password, (bindErr) => {
          if (bindErr) {
            console.log(`   ❌ Bind falló: ${bindErr.message}`);
            client.destroy();
            resolve({ success: false, error: bindErr.message });
          } else {
            console.log(`   ✅ ¡BIND EXITOSO!`);
            
            // Verificar que puede leer
            client.search('DC=2call,DC=cl', {
              filter: '(objectClass=user)',
              scope: 'sub',
              attributes: ['sAMAccountName'],
              sizeLimit: 1,
              timeLimit: 5
            }, (searchErr, res) => {
              if (searchErr) {
                console.log(`   ⚠️ Búsqueda falló: ${searchErr.message}`);
                client.destroy();
                resolve({ success: false, error: 'No tiene permisos de lectura' });
              } else {
                let foundUser = false;
                res.on('searchEntry', () => {
                  foundUser = true;
                });
                res.on('end', () => {
                  console.log(`   ✅ Permisos de lectura confirmados`);
                  client.destroy();
                  resolve({ 
                    success: true, 
                    account: account,
                    canRead: foundUser 
                  });
                });
              }
            });
          }
        });
      });

      if (result.success) {
        successfulAccount = result.account;
        console.log(`\n🎉 ¡CUENTA ENCONTRADA!`);
        console.log(`   Tipo: ${account.type}`);
        console.log(`   DN: ${account.dn}`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ Error inesperado: ${error.message}`);
    }
  }

  if (!successfulAccount) {
    console.log('\n❌ NINGUNA configuración funcionó para b1portal');
    console.log('\n🔍 POSIBLES PROBLEMAS:');
    console.log('1. La cuenta b1portal NO existe en el AD');
    console.log('2. La contraseña es incorrecta');
    console.log('3. La cuenta está deshabilitada');
    console.log('4. La cuenta está bloqueada');
    console.log('5. La cuenta no tiene permisos LDAP');
    
    console.log('\n🚨 ACCIONES REQUERIDAS:');
    console.log('1. Verificar en Active Directory si la cuenta existe:');
    console.log('   Get-ADUser -Filter {SamAccountName -eq "b1portal"}');
    console.log('2. Consultar con el administrador del AD');
    console.log('3. Solicitar una cuenta de servicio con permisos LDAP de lectura');
  } else {
    console.log('\n📋 CONFIGURACIÓN PARA .env:');
    console.log(`LDAP_BIND_DN=${successfulAccount.dn}`);
    console.log(`LDAP_BIND_PASSWORD="${successfulAccount.password}"`);
  }
}

// Ejecutar test
testServiceAccount().catch(console.error);