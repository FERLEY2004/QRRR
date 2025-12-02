// Script para crear la tabla Fichas en la base de datos
import pool from './dbPool.js';

async function createFichasTable() {
  let connection;
  
  try {
    console.log('🔧 Creando tabla Fichas...');
    
    connection = await pool.getConnection();
    
    // Primero verificar si las tablas relacionadas existen
    const [programasExists] = await connection.query(
      "SHOW TABLES LIKE 'Programas_Formacion'"
    );
    
    const [ambientesExists] = await connection.query(
      "SHOW TABLES LIKE 'Ambientes'"
    );
    
    if (programasExists.length === 0) {
      console.log('⚠️  Advertencia: La tabla Programas_Formacion no existe. Las foreign keys pueden fallar.');
    }
    
    if (ambientesExists.length === 0) {
      console.log('⚠️  Advertencia: La tabla Ambientes no existe. Las foreign keys pueden fallar.');
    }
    
    // Crear la tabla Fichas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Fichas (
        id_ficha INT AUTO_INCREMENT PRIMARY KEY,
        codigo_ficha VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código único de la ficha (ej: 3066232)',
        programa_formacion VARCHAR(200) NOT NULL COMMENT 'Nombre del programa de formación',
        id_programa INT NULL COMMENT 'Referencia al programa de formación',
        id_ambiente_principal INT NULL COMMENT 'Ambiente principal asignado a la ficha',
        jornada ENUM('diurna', 'nocturna', 'mixta') DEFAULT 'diurna' COMMENT 'Jornada de formación',
        fecha_inicio DATE NULL COMMENT 'Fecha de inicio de la ficha',
        fecha_fin DATE NULL COMMENT 'Fecha de finalización de la ficha',
        estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa' COMMENT 'Estado actual de la ficha',
        numero_aprendices INT DEFAULT 0 COMMENT 'Número de aprendices asignados',
        capacidad_maxima INT NULL COMMENT 'Capacidad máxima de aprendices',
        observaciones TEXT NULL COMMENT 'Observaciones adicionales',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ficha_codigo (codigo_ficha),
        INDEX idx_ficha_programa (id_programa),
        INDEX idx_ficha_estado (estado),
        INDEX idx_ficha_jornada (jornada),
        INDEX idx_ficha_fechas (fecha_inicio, fecha_fin),
        INDEX idx_ficha_ambiente (id_ambiente_principal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Tabla para gestionar las fichas de formación del SENA'
    `);
    console.log('✅ Tabla Fichas creada o verificada');
    
    // Intentar agregar foreign keys si las tablas relacionadas existen
    if (programasExists.length > 0) {
      try {
        await connection.query(`
          ALTER TABLE Fichas 
          ADD CONSTRAINT fk_fichas_programa 
          FOREIGN KEY (id_programa) REFERENCES Programas_Formacion(id_programa) ON DELETE SET NULL
        `);
        console.log('✅ Foreign key a Programas_Formacion agregada');
      } catch (error) {
        if (error.code === 'ER_DUP_KEY' || error.message.includes('Duplicate key')) {
          console.log('ℹ️  Foreign key a Programas_Formacion ya existe');
        } else {
          console.log('⚠️  No se pudo agregar foreign key a Programas_Formacion:', error.message);
        }
      }
    }
    
    if (ambientesExists.length > 0) {
      try {
        await connection.query(`
          ALTER TABLE Fichas 
          ADD CONSTRAINT fk_fichas_ambiente 
          FOREIGN KEY (id_ambiente_principal) REFERENCES Ambientes(id_ambiente) ON DELETE SET NULL
        `);
        console.log('✅ Foreign key a Ambientes agregada');
      } catch (error) {
        if (error.code === 'ER_DUP_KEY' || error.message.includes('Duplicate key')) {
          console.log('ℹ️  Foreign key a Ambientes ya existe');
        } else {
          console.log('⚠️  No se pudo agregar foreign key a Ambientes:', error.message);
        }
      }
    }
    
    // Crear índice en Personas para id_ficha si no existe
    try {
      await connection.query(`
        CREATE INDEX idx_personas_ficha_id ON Personas(id_ficha)
      `);
      console.log('✅ Índice en Personas.id_ficha creado');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key')) {
        console.log('ℹ️  Índice en Personas.id_ficha ya existe');
      } else {
        console.log('⚠️  No se pudo crear índice en Personas:', error.message);
      }
    }
    
    // Verificar que la tabla existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'Fichas'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Tabla Fichas creada exitosamente');
      
      // Mostrar estructura de la tabla
      const [columns] = await connection.query(
        "DESCRIBE Fichas"
      );
      console.log('\n📋 Estructura de la tabla Fichas:');
      console.table(columns);
      
      // Contar registros
      const [count] = await connection.query(
        "SELECT COUNT(*) as total FROM Fichas"
      );
      console.log(`\n📊 Total de fichas en la base de datos: ${count[0].total}`);
    } else {
      throw new Error('La tabla Fichas no se creó correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error al crear la tabla Fichas:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Ejecutar siempre cuando se llama directamente
createFichasTable()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  });

export default createFichasTable;

