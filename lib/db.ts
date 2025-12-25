import { Pool } from 'pg';

// Configuración de la conexión
const pool = new Pool({
  host: process.env.POSTGRES_HOST as string,
  port: parseInt(process.env.POSTGRES_PORT as string),
  database: process.env.POSTGRES_DB as string,
  user: process.env.POSTGRES_USER as string,
  password: process.env.POSTGRES_PASSWORD as string,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejo de errores de conexión
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Función para obtener conexión
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Función para obtener un cliente del pool
export async function getClient() {
  const client = await pool.connect();
  
  const query = client.query;
  const release = client.release;
  
  // Establecer un timeout para prevenir conexiones colgadas
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${client['lastQuery']}`);
  }, 5000);
  
  // Monkey patch the query method to track the last query executed
  client.query = (...args: any[]) => {
    client['lastQuery'] = args[0];
    return query.apply(client, args);
  };
  
  client.release = () => {
    // Limpiar nuestro timeout
    clearTimeout(timeout);
    
    // Restaurar los métodos originales
    client.query = query;
    client.release = release;
    
    return release.apply(client);
  };
  
  return client;
}

export default pool;