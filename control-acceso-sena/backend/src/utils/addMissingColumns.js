// Script para agregar columnas faltantes a la tabla Personas
import pool from './dbPool.js';

async function addMissingColumns() {
  let connection;
  
  try {
    console.log('🔧 Verificando y agregando columnas faltantes en Personas...');
    
    connection = await pool.getConnection();
    
    // Verificar qué columnas existen
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM Personas"
    );
    
    const existingColumns = columns.map(col => col.Field);
    console.log(`📋 Columnas existentes: ${existingColumns.length}`);
    
    const columnsToAdd = [];
    
    // Verificar y agregar columnas faltantes
    const requiredColumns = [
      {
        name: 'rh',
        definition: "VARCHAR(10) NULL COMMENT 'Grupo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)'",
        after: 'telefono'
      },
      {
        name: 'fecha_inicio_formacion',
        definition: 'DATE NULL COMMENT \'Fecha de inicio de formación\'',
        after: 'rh'
      },
      {
        name: 'fecha_fin_formacion',
        definition: 'DATE NULL COMMENT \'Fecha de fin de formación\'',
        after: 'fecha_inicio_formacion'
      },
      {
        name: 'id_ficha',
        definition: 'INT NULL COMMENT \'Referencia a tabla Fichas\'',
        after: 'ficha'
      },
      {
        name: 'cargo',
        definition: "VARCHAR(100) NULL COMMENT 'Cargo para instructores y administrativos'",
        after: 'id_ficha'
      },
      {
        name: 'tipo_contrato',
        definition: "ENUM('planta', 'contrato', 'catedra') NULL COMMENT 'Tipo de contrato para instructores'",
        after: 'cargo'
      }
    ];
    
    for (const col of requiredColumns) {
      if (!existingColumns.includes(col.name)) {
        columnsToAdd.push(col);
        console.log(`⚠️  Columna faltante detectada: ${col.name}`);
      } else {
        console.log(`✅ Columna existe: ${col.name}`);
      }
    }
    
    if (columnsToAdd.length === 0) {
      console.log('\n✅ Todas las columnas necesarias ya existen');
      return;
    }
    
    // Agregar columnas faltantes
    for (const col of columnsToAdd) {
      try {
        // Verificar si la columna "after" existe
        let afterClause = '';
        if (col.after && existingColumns.includes(col.after)) {
          afterClause = `AFTER ${col.after}`;
        } else if (col.after && columnsToAdd.find(c => c.name === col.after)) {
          // La columna "after" será agregada antes, así que no podemos usar AFTER
          afterClause = '';
        }
        
        const alterQuery = `ALTER TABLE Personas ADD COLUMN ${col.name} ${col.definition} ${afterClause}`.trim();
        
        console.log(`\n🔧 Agregando columna: ${col.name}`);
        await connection.query(alterQuery);
        console.log(`✅ Columna ${col.name} agregada exitosamente`);
        
        // Agregar a la lista de columnas existentes para las siguientes iteraciones
        existingColumns.push(col.name);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
          console.log(`ℹ️  Columna ${col.name} ya existe (ignorado)`);
        } else {
          console.error(`❌ Error agregando columna ${col.name}:`, error.message);
          throw error;
        }
      }
    }
    
    // Crear índices si no existen
    const indexesToCreate = [
      { name: 'idx_personas_rh', column: 'rh' },
      { name: 'idx_personas_cargo', column: 'cargo' },
      { name: 'idx_personas_ficha_id', column: 'id_ficha' }
    ];
    
    console.log('\n🔧 Verificando índices...');
    const [indexes] = await connection.query(
      "SHOW INDEXES FROM Personas"
    );
    const existingIndexes = indexes.map(idx => idx.Key_name);
    
    for (const idx of indexesToCreate) {
      if (!existingIndexes.includes(idx.name)) {
        try {
          await connection.query(
            `CREATE INDEX ${idx.name} ON Personas(${idx.column})`
          );
          console.log(`✅ Índice ${idx.name} creado`);
        } catch (error) {
          if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key')) {
            console.log(`ℹ️  Índice ${idx.name} ya existe`);
          } else {
            console.log(`⚠️  No se pudo crear índice ${idx.name}:`, error.message);
          }
        }
      } else {
        console.log(`✅ Índice ${idx.name} ya existe`);
      }
    }
    
    // Verificar estructura final
    const [finalColumns] = await connection.query(
      "SHOW COLUMNS FROM Personas"
    );
    console.log(`\n📊 Total de columnas en Personas: ${finalColumns.length}`);
    
    console.log('\n✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Ejecutar siempre cuando se llama directamente
addMissingColumns()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  });

export default addMissingColumns;

