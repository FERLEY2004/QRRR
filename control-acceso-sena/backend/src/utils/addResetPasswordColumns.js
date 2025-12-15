// Script para agregar columnas de recuperación de contraseña
import pool from './dbPool.js';

async function addResetPasswordColumns() {
  console.log('🔧 Verificando columnas de recuperación de contraseña...');
  
  try {
    // Verificar si las columnas ya existen
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'usuarios' 
      AND COLUMN_NAME IN ('reset_token', 'reset_token_expires')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    
    if (!existingColumns.includes('reset_token')) {
      console.log('📝 Agregando columna reset_token...');
      await pool.execute(`
        ALTER TABLE usuarios 
        ADD COLUMN reset_token VARCHAR(64) NULL,
        ADD INDEX idx_reset_token (reset_token)
      `);
      console.log('✅ Columna reset_token agregada');
    } else {
      console.log('✓ Columna reset_token ya existe');
    }

    if (!existingColumns.includes('reset_token_expires')) {
      console.log('📝 Agregando columna reset_token_expires...');
      await pool.execute(`
        ALTER TABLE usuarios 
        ADD COLUMN reset_token_expires DATETIME NULL
      `);
      console.log('✅ Columna reset_token_expires agregada');
    } else {
      console.log('✓ Columna reset_token_expires ya existe');
    }

    console.log('✅ Verificación completada');
    
  } catch (error) {
    // Si las columnas ya existen, el error será de duplicado
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Las columnas ya existen');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// Auto-ejecutar
addResetPasswordColumns()
  .then(() => {
    console.log('🎉 Script completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Script falló:', err);
    process.exit(1);
  });

export default addResetPasswordColumns;


