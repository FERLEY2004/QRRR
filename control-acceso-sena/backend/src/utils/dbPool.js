// Database Pool Helper
// Este archivo asegura que el pool se importe correctamente
import poolModule from '../config/database.js';

// Manejar tanto default como named export
const pool = poolModule.default || poolModule;

// Verificar que pool tenga el método execute
if (typeof pool?.execute !== 'function') {
  console.error('❌ Error crítico: pool no tiene método execute');
  console.error('Pool type:', typeof pool);
  console.error('Pool module:', poolModule);
  throw new Error('Error en la configuración de la base de datos: pool.execute no está disponible');
}

export default pool;

