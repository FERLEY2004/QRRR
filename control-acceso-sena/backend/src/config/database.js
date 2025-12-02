// Database Configuration
// config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'control_acceso_sena',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar que pool tenga el método execute
if (typeof pool.execute !== 'function') {
  console.error('❌ Error: pool.execute no es una función');
  console.error('Pool type:', typeof pool);
  console.error('Pool:', pool);
}

export default pool;
