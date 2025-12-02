// Script para verificar la tabla de Alertas
import pool from './dbPool.js';

const checkAlertsTable = async () => {
  try {
    console.log('🔍 Verificando tabla Alertas...\n');

    // Verificar si la tabla existe
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Alertas'
    `);

    if (tables.length === 0) {
      console.log('❌ La tabla Alertas NO existe');
      console.log('💡 Ejecuta el script de inicialización: npm run init-db o node src/utils/initDB.js');
      return;
    }

    console.log('✅ La tabla Alertas existe\n');

    // Verificar estructura de la tabla
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Alertas'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Estructura de la tabla:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Contar alertas
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM Alertas');
    console.log(`\n📊 Total de alertas en la base de datos: ${count[0].total}`);

    // Contar alertas por tipo
    const [byType] = await pool.execute(`
      SELECT tipo, COUNT(*) as cantidad
      FROM Alertas
      GROUP BY tipo
      ORDER BY cantidad DESC
    `);

    if (byType.length > 0) {
      console.log('\n📈 Alertas por tipo:');
      byType.forEach(row => {
        console.log(`   - ${row.tipo}: ${row.cantidad}`);
      });
    }

    // Contar alertas no leídas
    const [unread] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM Alertas
      WHERE leida = FALSE
    `);
    console.log(`\n🔔 Alertas no leídas: ${unread[0].total}`);

    // Intentar crear una alerta de prueba
    console.log('\n🧪 Creando alerta de prueba...');
    const [testResult] = await pool.execute(`
      INSERT INTO Alertas (tipo, severidad, titulo, mensaje)
      VALUES ('sistema', 'baja', 'Alerta de prueba', 'Esta es una alerta de prueba para verificar que la inserción funciona')
    `);

    console.log(`✅ Alerta de prueba creada con ID: ${testResult.insertId}`);

    // Eliminar la alerta de prueba
    await pool.execute('DELETE FROM Alertas WHERE id_alerta = ?', [testResult.insertId]);
    console.log('✅ Alerta de prueba eliminada\n');

    console.log('✅ Verificación completada. La tabla Alertas está funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error al verificar la tabla Alertas:', error.message);
    console.error('Código de error:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 La tabla no existe. Ejecuta el script de inicialización.');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n💡 La estructura de la tabla es incorrecta. Verifica el esquema.');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
};

checkAlertsTable();

