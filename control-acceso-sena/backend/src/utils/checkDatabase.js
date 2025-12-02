// Script rápido para verificar el estado de la base de datos
import dotenv from 'dotenv';
import pool from './dbPool.js';

dotenv.config();

const checkDatabase = async () => {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // Verificar conexión
    await pool.execute('SELECT 1');
    console.log('✅ Conexión a la base de datos: OK\n');

    // Verificar tabla Usuarios
    try {
      const [users] = await pool.execute('SELECT COUNT(*) as count FROM Usuarios');
      console.log(`✅ Tabla Usuarios: OK (${users[0].count} usuarios)`);
    } catch (error) {
      console.log('❌ Tabla Usuarios: NO EXISTE');
    }

    // Verificar tabla Alertas
    try {
      const [alerts] = await pool.execute('SELECT COUNT(*) as count FROM Alertas');
      console.log(`✅ Tabla Alertas: OK (${alerts[0].count} alertas)`);
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ Tabla Alertas: NO EXISTE');
        console.log('💡 Ejecuta: node src/utils/initDB.js para crear las tablas');
      } else {
        console.log('❌ Error al verificar tabla Alertas:', error.message);
      }
    }

    // Verificar tabla Personas
    try {
      const [persons] = await pool.execute('SELECT COUNT(*) as count FROM Personas');
      console.log(`✅ Tabla Personas: OK (${persons[0].count} personas)`);
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ Tabla Personas: NO EXISTE');
      }
    }

    // Verificar tabla Accesos
    try {
      const [accesses] = await pool.execute('SELECT COUNT(*) as count FROM Accesos');
      console.log(`✅ Tabla Accesos: OK (${accesses[0].count} accesos)`);
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ Tabla Accesos: NO EXISTE');
      }
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

checkDatabase();

