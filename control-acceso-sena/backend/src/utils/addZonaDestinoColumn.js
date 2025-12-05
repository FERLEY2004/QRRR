// Script para agregar columna zona_destino a la tabla visitantes
import pool from './dbPool.js';

async function addZonaDestinoColumn() {
  console.log('🔧 Verificando columna zona_destino en tabla visitantes...');
  
  try {
    // Verificar si la columna ya existe
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'visitantes' 
      AND COLUMN_NAME = 'zona_destino'
    `);

    if (columns.length === 0) {
      console.log('📝 Agregando columna zona_destino...');
      await pool.execute(`
        ALTER TABLE visitantes 
        ADD COLUMN zona_destino VARCHAR(100) NULL AFTER motivo_visita
      `);
      console.log('✅ Columna zona_destino agregada');
    } else {
      console.log('✓ Columna zona_destino ya existe');
    }

    console.log('✅ Verificación completada');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ La columna zona_destino ya existe');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// Auto-ejecutar
addZonaDestinoColumn()
  .then(() => {
    console.log('🎉 Script completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Script falló:', err);
    process.exit(1);
  });

export default addZonaDestinoColumn;

