// scripts/list-users-colombia.js
const ldap = require('ldapjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class ColombiaUserLister {
  constructor() {
    this.validateEnvironment();
    this.initializeConfig();
    this.client = null;
  }

  validateEnvironment() {
    console.log('🔍 Validando configuración del entorno...\n');
    
    const requiredVars = [
      'LDAP_SERVER_URL',
      'LDAP_BIND_DN',
      'LDAP_BIND_PASSWORD',
      'LDAP_BASE_DN'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Variables de entorno faltantes:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\n⚠️  Por favor asegúrate de que tu archivo .env contiene todas las variables requeridas.');
      process.exit(1);
    }

    console.log('✅ Configuración del entorno validada correctamente');
  }

  initializeConfig() {
    this.config = {
      serverUrl: process.env.LDAP_SERVER_URL,
      bindDN: process.env.LDAP_BIND_DN,
      bindPassword: process.env.LDAP_BIND_PASSWORD,
      baseDN: process.env.LDAP_BASE_DN
    };

    console.log('\n📋 Configuración cargada:');
    console.log(`   - Servidor: ${this.config.serverUrl}`);
    console.log(`   - Base DN: ${this.config.baseDN}`);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('\n🔗 Conectando al servidor LDAP...');
      
      this.client = ldap.createClient({
        url: this.config.serverUrl,
        timeout: 30000,
        connectTimeout: 30000,
        reconnect: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      this.client.on('error', (err) => {
        console.error('❌ Error de conexión LDAP:', err.message);
        reject(err);
      });
      
      this.client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
        if (err) {
          console.error('❌ Error de autenticación:', err.message);
          reject(err);
        } else {
          console.log('✅ Conexión y autenticación exitosas');
          resolve();
        }
      });
    });
  }

  async findColombiaOU() {
    console.log('\n🔍 Buscando OU Colombia...');
    
    // Primero buscar Plataforma
    console.log('   1. Buscando OU Plataforma...');
    const plataformaOU = await this.findOUByName('Plataforma');
    
    if (!plataformaOU) {
      console.log('   ❌ OU Plataforma no encontrada');
      console.log('   💡 Buscando Colombia directamente...');
      const colombiaOU = await this.findOUByName('Colombia');
      return colombiaOU;
    }
    
    console.log(`   ✅ Plataforma encontrada: ${plataformaOU.dn}`);
    
    // Luego buscar Colombia dentro de Plataforma
    console.log('   2. Buscando Colombia dentro de Plataforma...');
    const colombiaOU = await this.findOUByName('Colombia', plataformaOU.dn);
    
    if (colombiaOU) {
      console.log(`   ✅ Colombia encontrada: ${colombiaOU.dn}`);
      return colombiaOU;
    }
    
    // Si no se encuentra dentro de Plataforma, buscar en toda la base
    console.log('   ℹ️  Colombia no encontrada dentro de Plataforma');
    console.log('   3. Buscando Colombia en toda la base...');
    return await this.findOUByName('Colombia');
  }

  async findOUByName(ouName, searchBase = null) {
    return new Promise((resolve, reject) => {
      const base = searchBase || this.config.baseDN;
      const searchOptions = {
        scope: 'sub',
        filter: `(&(objectClass=organizationalUnit)(ou=${ouName}))`,
        attributes: ['ou', 'distinguishedName'],
        sizeLimit: 1
      };
      
      this.client.search(base, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        
        let foundOU = null;
        
        res.on('searchEntry', (entry) => {
          foundOU = {
            name: entry.attributes.find(a => a.type === 'ou')?.values[0],
            dn: entry.attributes.find(a => a.type === 'distinguishedName')?.values[0]
          };
        });
        
        res.on('error', (err) => {
          // No reject aquí, solo continuar
        });
        
        res.on('end', () => {
          resolve(foundOU);
        });
      });
    });
  }

  async findTIWithinColombia(colombiaDN) {
    console.log('\n🔍 Buscando TI dentro de Colombia...');
    
    const tiOU = await this.findOUByName('TI', colombiaDN);
    
    if (tiOU) {
      console.log(`   ✅ TI encontrada: ${tiOU.dn}`);
      return tiOU;
    }
    
    console.log('   ℹ️  TI no encontrada dentro de Colombia');
    return null;
  }

  async searchUsersWithPagination(searchBase, pageSize = 100) {
    console.log(`\n👥 Buscando usuarios en: ${searchBase}`);
    console.log(`   📊 Tamaño de página: ${pageSize}`);
    
    const userAttributes = [
      'sAMAccountName',
      'displayName',
      'mail',
      'employeeID',
      'employeeNumber',
      'title',
      'department',
      'distinguishedName',
      'userAccountControl',
      'givenName',
      'sn',
      'telephoneNumber',
      'mobile'
    ];
    
    return new Promise((resolve, reject) => {
      const searchOptions = {
        scope: 'sub',
        filter: '(&(objectClass=user)(objectCategory=person))',
        attributes: userAttributes,
        paged: {
          pageSize: pageSize,
          pagePause: false
        }
      };
      
      const allUsers = [];
      let totalProcessed = 0;
      let page = 1;
      
      const search = this.client.search(searchBase, searchOptions, (err, res) => {
        if (err) {
          if (err.message.includes('Size Limit Exceeded')) {
            console.log('   ⚠️  Límite excedido, intentando con página más pequeña...');
            // Intentar con página más pequeña
            this.searchUsersWithPagination(searchBase, 50)
              .then(resolve)
              .catch(reject);
            return;
          }
          reject(err);
          return;
        }
        
        res.on('searchEntry', (entry) => {
          totalProcessed++;
          const user = this.processUserEntry(entry);
          if (user) {
            allUsers.push(user);
          }
          
          if (totalProcessed % 50 === 0) {
            process.stdout.write(`\r      📥 Procesando: ${totalProcessed} usuarios...`);
          }
        });
        
        res.on('page', (result) => {
          console.log(`\n      📄 Página ${page} completada: ${totalProcessed} usuarios`);
          page++;
        });
        
        res.on('error', (err) => {
          if (err.message.includes('Size Limit Exceeded')) {
            console.log('   ⚠️  Límite excedido en el stream');
            // Continuar con los usuarios ya obtenidos
            res.emit('end');
          } else {
            console.error(`\n      ❌ Error: ${err.message}`);
          }
        });
        
        res.on('end', () => {
          process.stdout.write(`\r      📥 Procesados: ${totalProcessed} usuarios\n`);
          console.log(`      ✅ Total encontrados: ${allUsers.length}`);
          resolve(allUsers);
        });
      });
      
      // Timeout para evitar búsquedas infinitas
      setTimeout(() => {
        if (allUsers.length > 0) {
          console.log('\n      ⏱️  Timeout alcanzado, retornando usuarios encontrados...');
          search.abandon();
          resolve(allUsers);
        }
      }, 120000);
    });
  }

  async searchUsersInContainer(searchBase) {
    console.log(`\n🔍 Búsqueda alternativa en: ${searchBase}`);
    
    // Usar búsqueda más conservadora
    const userAttributes = [
      'sAMAccountName',
      'displayName',
      'employeeID'
    ];
    
    return new Promise((resolve, reject) => {
      const searchOptions = {
        scope: 'sub',
        filter: '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
        attributes: userAttributes,
        sizeLimit: 1000 // Limitar resultados
      };
      
      const users = [];
      
      this.client.search(searchBase, searchOptions, (err, res) => {
        if (err) {
          if (err.message.includes('Size Limit Exceeded')) {
            console.log('   ℹ️  Límite alcanzado, mostrando primeros 1000 usuarios');
            resolve(users);
            return;
          }
          reject(err);
          return;
        }
        
        res.on('searchEntry', (entry) => {
          const user = this.processSimpleUserEntry(entry);
          if (user) {
            users.push(user);
          }
        });
        
        res.on('error', (err) => {
          console.error(`      ❌ Error: ${err.message}`);
        });
        
        res.on('end', () => {
          console.log(`      ✅ Encontrados: ${users.length} usuarios`);
          resolve(users);
        });
      });
    });
  }

  processUserEntry(entry) {
    const user = {
      dn: entry.objectName ? entry.objectName.toString() : ''
    };
    
    // Extraer atributos
    entry.attributes.forEach((attr) => {
      const attrName = attr.type;
      const attrValues = attr.values;
      
      if (attrValues && attrValues.length > 0) {
        user[attrName] = attrValues.length === 1 ? attrValues[0] : attrValues;
      }
    });
    
    // Extraer OU del DN
    user.ou = this.extractOUFromDN(user.dn);
    user.allOUs = this.extractAllOUsFromDN(user.dn);
    
    // Determinar si la cuenta está habilitada
    user.isEnabled = this.isAccountEnabled(user.userAccountControl);
    
    // Formatear employeeID
    user.employeeID = user.employeeID ? String(user.employeeID).trim() : '';
    user.employeeNumber = user.employeeNumber ? String(user.employeeNumber).trim() : '';
    
    return user;
  }

  processSimpleUserEntry(entry) {
    const user = {};
    
    entry.attributes.forEach((attr) => {
      const attrName = attr.type;
      const attrValues = attr.values;
      
      if (attrValues && attrValues.length > 0) {
        user[attrName] = attrValues.length === 1 ? attrValues[0] : attrValues;
      }
    });
    
    return user;
  }

  extractOUFromDN(dn) {
    if (!dn) return null;
    
    try {
      const parts = dn.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (part.toUpperCase().startsWith('OU=')) {
          return part.substring(3);
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  extractAllOUsFromDN(dn) {
    if (!dn) return [];
    
    try {
      const ous = [];
      const parts = dn.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (part.toUpperCase().startsWith('OU=')) {
          ous.push(part.substring(3));
        }
      }
      
      return ous;
    } catch (error) {
      return [];
    }
  }

  isAccountEnabled(userAccountControl) {
    if (!userAccountControl) return true;
    
    try {
      const uac = parseInt(userAccountControl, 10);
      // 0x0002 = ACCOUNTDISABLE flag
      return !(uac & 0x0002);
    } catch {
      return true;
    }
  }

  displayStructure(colombiaOU, tiOU) {
    console.log('\n🌳 ESTRUCTURA ENCONTRADA');
    console.log('═'.repeat(60));
    
    if (colombiaOU) {
      console.log(`📌 Colombia: ${colombiaOU.dn}`);
      
      if (tiOU) {
        console.log(`   └── TI: ${tiOU.dn}`);
      } else {
        console.log('   └── (No se encontró TI dentro de Colombia)');
      }
    } else {
      console.log('❌ No se encontró la OU Colombia');
      console.log('💡 Estructura visible en tu AD:');
      console.log('   • Plataforma');
      console.log('      └── (Colombia debería estar aquí)');
      console.log('   • Users (contiene usuarios del dominio)');
    }
  }

  displayUserSummary(users, location) {
    console.log(`\n📊 RESUMEN DE USUARIOS EN ${location}`);
    console.log('═'.repeat(60));
    
    if (users.length === 0) {
      console.log('📭 No se encontraron usuarios');
      return;
    }
    
    const totalUsers = users.length;
    const enabledUsers = users.filter(u => u.isEnabled !== false).length;
    const disabledUsers = totalUsers - enabledUsers;
    
    console.log(`👥 Total usuarios: ${totalUsers}`);
    console.log(`✅ Habilitados: ${enabledUsers} (${((enabledUsers / totalUsers) * 100).toFixed(1)}%)`);
    console.log(`❌ Deshabilitados: ${disabledUsers} (${((disabledUsers / totalUsers) * 100).toFixed(1)}%)`);
    
    // Usuarios con EmployeeID
    const withEmployeeID = users.filter(u => u.employeeID && u.employeeID !== '').length;
    console.log(`🆔 Con EmployeeID: ${withEmployeeID} (${((withEmployeeID / totalUsers) * 100).toFixed(1)}%)`);
    
    // Distribución por OU
    const ouDistribution = {};
    users.forEach(user => {
      const ou = user.ou || 'Sin OU';
      ouDistribution[ou] = (ouDistribution[ou] || 0) + 1;
    });
    
    if (Object.keys(ouDistribution).length > 0) {
      console.log('\n📂 Distribución por OU:');
      Object.entries(ouDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([ou, count]) => {
          const percentage = ((count / totalUsers) * 100).toFixed(1);
          console.log(`   ${ou.padEnd(25)}: ${count.toString().padStart(4)} (${percentage}%)`);
        });
    }
    
    return { totalUsers, enabledUsers, withEmployeeID };
  }

  displayUsers(users, limit = 50) {
    if (users.length === 0) {
      console.log('📭 No hay usuarios para mostrar');
      return;
    }
    
    console.log('\n👥 LISTA DE USUARIOS');
    console.log('═'.repeat(120));
    
    const displayUsers = users.slice(0, limit);
    
    console.log(
      'Usuario'.padEnd(20) + ' | ' +
      'Nombre'.padEnd(25) + ' | ' +
      'EmployeeID'.padEnd(12) + ' | ' +
      'Email'.padEnd(25) + ' | ' +
      'OU'.padEnd(20) + ' | ' +
      'Estado'
    );
    console.log('─'.repeat(120));
    
    displayUsers.forEach(user => {
      const username = user.sAMAccountName || 'N/A';
      const displayName = (user.displayName || user.givenName || '').substring(0, 24);
      const employeeId = user.employeeID || 'N/A';
      const email = (user.mail || '').substring(0, 24);
      const ou = (user.ou || 'N/A').substring(0, 19);
      const status = user.isEnabled !== false ? '✅' : '❌';
      
      console.log(
        username.padEnd(20) + ' | ' +
        displayName.padEnd(25) + ' | ' +
        employeeId.padEnd(12) + ' | ' +
        email.padEnd(25) + ' | ' +
        ou.padEnd(20) + ' | ' +
        status
      );
    });
    
    if (users.length > limit) {
      console.log(`\n⚠️  Mostrando ${limit} de ${users.length} usuarios`);
      console.log('💡 Usa --all para ver todos o --export para CSV');
    }
  }

  exportToCSV(users, filename = 'usuarios-colombia.csv') {
    if (users.length === 0) {
      console.log('❌ No hay usuarios para exportar');
      return;
    }
    
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(exportDir, `usuarios-${timestamp}.csv`);
    
    const headers = [
      'Usuario',
      'Nombre',
      'Email',
      'EmployeeID',
      'Cargo',
      'Departamento',
      'OU',
      'Estado',
      'Teléfono',
      'Móvil',
      'DN'
    ];
    
    const rows = users.map(user => [
      `"${user.sAMAccountName || ''}"`,
      `"${user.displayName || ''}"`,
      `"${user.mail || ''}"`,
      `"${user.employeeID || ''}"`,
      `"${user.title || ''}"`,
      `"${user.department || ''}"`,
      `"${user.ou || ''}"`,
      `"${user.isEnabled !== false ? 'Activo' : 'Inactivo'}"`,
      `"${user.telephoneNumber || ''}"`,
      `"${user.mobile || ''}"`,
      `"${user.dn || ''}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    console.log(`\n💾 Exportado a: ${filePath}`);
    console.log(`   Registros: ${users.length}`);
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'search';
    
    try {
      await this.connect();
      
      // Buscar estructura Colombia
      const colombiaOU = await this.findColombiaOU();
      
      if (!colombiaOU) {
        console.log('\n❌ No se pudo encontrar la OU Colombia');
        console.log('💡 Probando búsqueda en Users...');
        
        // Intentar buscar en Users
        const usersOU = { dn: 'CN=Users,' + this.config.baseDN };
        const users = await this.searchUsersInContainer(usersOU.dn);
        
        if (users.length > 0) {
          const summary = this.displayUserSummary(users, 'USERS');
          this.displayUsers(users, 50);
          
          if (args.includes('--export')) {
            this.exportToCSV(users, 'usuarios-users.csv');
          }
        }
        
        return;
      }
      
      // Buscar TI dentro de Colombia
      const tiOU = await this.findTIWithinColombia(colombiaOU.dn);
      
      // Mostrar estructura
      this.displayStructure(colombiaOU, tiOU);
      
      // Decidir dónde buscar usuarios
      let searchBase = colombiaOU.dn;
      let location = 'COLOMBIA';
      
      if (tiOU && args.includes('--ti')) {
        searchBase = tiOU.dn;
        location = 'TI (dentro de Colombia)';
      }
      
      // Buscar usuarios
      let users;
      try {
        users = await this.searchUsersWithPagination(searchBase);
      } catch (error) {
        console.log(`\n⚠️  Error en búsqueda paginada: ${error.message}`);
        console.log('   Intentando búsqueda simple...');
        users = await this.searchUsersInContainer(searchBase);
      }
      
      // Mostrar resultados
      const summary = this.displayUserSummary(users, location);
      this.displayUsers(users, args.includes('--all') ? users.length : 50);
      
      // Exportar si se solicita
      if (args.includes('--export')) {
        this.exportToCSV(users);
      }
      
      console.log(`\n🎯 PROCESO COMPLETADO`);
      console.log(`📍 Ubicación: ${location}`);
      console.log(`👥 Usuarios encontrados: ${summary?.totalUsers || 0}`);
      console.log(`🆔 Con EmployeeID: ${summary?.withEmployeeID || 0}`);
      
    } catch (error) {
      console.error('\n❌ Error en ejecución:', error.message);
    } finally {
      if (this.client) {
        this.client.destroy();
        console.log('\n🔌 Conexión LDAP cerrada');
      }
    }
  }
}

// Script de búsqueda rápida y segura
async function quickSearch() {
  console.log('🚀 BÚSQUEDA RÁPIDA DE USUARIOS EN COLOMBIA\n');
  
  require('dotenv').config();
  
  const client = ldap.createClient({
    url: process.env.LDAP_SERVER_URL,
    timeout: 15000,
    tlsOptions: { rejectUnauthorized: false }
  });
  
  try {
    // Conectar
    await new Promise((resolve, reject) => {
      client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Conectado y autenticado');
          resolve();
        }
      });
    });
    
    // Ruta CORRECTA basada en tu estructura
    const colombiaPath = 'OU=Colombia,OU=Plataforma,DC=2call,DC=cl';
    console.log(`\n🔍 Buscando en: ${colombiaPath}`);
    
    // Búsqueda simple y limitada
    const searchOptions = {
      scope: 'sub',
      filter: '(&(objectClass=user)(objectCategory=person))',
      attributes: ['sAMAccountName', 'displayName', 'employeeID', 'mail', 'title'],
      sizeLimit: 100 // LIMITAR resultados para evitar exceso
    };
    
    const users = await new Promise((resolve, reject) => {
      const results = [];
      
      client.search(colombiaPath, searchOptions, (err, res) => {
        if (err) {
          if (err.message.includes('No Such Object')) {
            console.log('❌ Ruta incorrecta. Probando alternativas...');
            
            // Probar ruta alternativa
            const altPath = 'OU=Colombia,DC=2call,DC=cl';
            console.log(`🔍 Probando: ${altPath}`);
            
            client.search(altPath, searchOptions, (err2, res2) => {
              if (err2) {
                console.log('❌ Ruta alternativa también falló');
                console.log('💡 Probando en Users...');
                
                const usersPath = 'CN=Users,DC=2call,DC=cl';
                client.search(usersPath, searchOptions, (err3, res3) => {
                  if (err3) {
                    reject(err3);
                    return;
                  }
                  
                  handleSearch(res3, results, resolve);
                });
                
              } else {
                handleSearch(res2, results, resolve);
              }
            });
            
          } else {
            reject(err);
          }
          return;
        }
        
        handleSearch(res, results, resolve);
      });
    });
    
    console.log(`\n📊 RESULTADOS: ${users.length} usuarios encontrados\n`);
    
    // Mostrar usuarios
    users.forEach((user, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${user.username} - ${user.name} - ID: ${user.employeeID || 'N/A'} - ${user.title || ''}`);
    });
    
    // Buscar específicamente pruebab1
    console.log('\n🔎 BUSCANDO USUARIO PRUEBAB1...');
    const pruebaUser = users.find(u => u.username.toLowerCase() === 'pruebab1');
    
    if (pruebaUser) {
      console.log('✅ ENCONTRADO:');
      console.log(`   Usuario: ${pruebaUser.username}`);
      console.log(`   Nombre: ${pruebaUser.name}`);
      console.log(`   EmployeeID: ${pruebaUser.employeeID || 'No tiene'}`);
      console.log(`   Email: ${pruebaUser.mail || 'No tiene'}`);
      console.log(`   Cargo: ${pruebaUser.title || 'No tiene'}`);
    } else {
      console.log('❌ pruebab1 no encontrado en los resultados');
    }
    
    client.destroy();
    console.log('\n✅ Búsqueda completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) client.destroy();
  }
}

function handleSearch(res, results, resolve) {
  res.on('searchEntry', (entry) => {
    const user = {
      username: entry.attributes.find(a => a.type === 'sAMAccountName')?.values[0],
      name: entry.attributes.find(a => a.type === 'displayName')?.values[0],
      employeeID: entry.attributes.find(a => a.type === 'employeeID')?.values[0],
      mail: entry.attributes.find(a => a.type === 'mail')?.values[0],
      title: entry.attributes.find(a => a.type === 'title')?.values[0]
    };
    results.push(user);
  });
  
  res.on('error', (err) => {
    console.error('Error en búsqueda:', err.message);
  });
  
  res.on('end', () => {
    resolve(results);
  });
}

// Ejecutar
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    quickSearch().catch(console.error);
  } else {
    const lister = new ColombiaUserLister();
    lister.run().catch(console.error);
  }
}

module.exports = ColombiaUserLister;   