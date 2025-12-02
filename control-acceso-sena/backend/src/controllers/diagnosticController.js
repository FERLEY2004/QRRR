// Diagnostic Controller - Para diagnosticar estructura de tablas
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

/**
 * Diagnosticar estructura de tablas de accesos
 */
export const diagnoseTables = async (req, res) => {
  try {
    console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico de estructura de tablas...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: []
    };

    // 1. Verificar tabla Accesos
    try {
      console.log('📋 Verificando tabla Accesos...');
      const [accesosStructure] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Accesos'
        ORDER BY ORDINAL_POSITION
      `);
      
      const [accesosCount] = await pool.execute('SELECT COUNT(*) as total FROM Accesos');
      const [accesosSample] = await pool.execute('SELECT * FROM Accesos LIMIT 3');
      
      diagnostics.tables.Accesos = {
        exists: true,
        structure: accesosStructure,
        total_records: accesosCount[0]?.total || 0,
        sample_records: accesosSample,
        columns: accesosStructure.map(col => col.COLUMN_NAME)
      };
      
      console.log(`✅ Tabla Accesos encontrada: ${accesosCount[0]?.total || 0} registros`);
      console.log(`📋 Columnas: ${diagnostics.tables.Accesos.columns.join(', ')}`);
    } catch (error) {
      console.error('❌ Error verificando tabla Accesos:', error.message);
      diagnostics.tables.Accesos = {
        exists: false,
        error: error.message
      };
      diagnostics.errors.push({ table: 'Accesos', error: error.message });
    }

    // 2. Verificar tabla registros_entrada_salida
    try {
      console.log('📋 Verificando tabla registros_entrada_salida...');
      const [registrosStructure] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'registros_entrada_salida'
        ORDER BY ORDINAL_POSITION
      `);
      
      const [registrosCount] = await pool.execute('SELECT COUNT(*) as total FROM registros_entrada_salida');
      const [registrosSample] = await pool.execute('SELECT * FROM registros_entrada_salida LIMIT 3');
      
      diagnostics.tables.registros_entrada_salida = {
        exists: true,
        structure: registrosStructure,
        total_records: registrosCount[0]?.total || 0,
        sample_records: registrosSample,
        columns: registrosStructure.map(col => col.COLUMN_NAME)
      };
      
      console.log(`✅ Tabla registros_entrada_salida encontrada: ${registrosCount[0]?.total || 0} registros`);
      console.log(`📋 Columnas: ${diagnostics.tables.registros_entrada_salida.columns.join(', ')}`);
    } catch (error) {
      console.error('❌ Error verificando tabla registros_entrada_salida:', error.message);
      diagnostics.tables.registros_entrada_salida = {
        exists: false,
        error: error.message
      };
      diagnostics.errors.push({ table: 'registros_entrada_salida', error: error.message });
    }

    // 3. Verificar tabla Personas
    try {
      console.log('📋 Verificando tabla Personas...');
      const [personasStructure] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Personas'
        ORDER BY ORDINAL_POSITION
      `);
      
      const [personasCount] = await pool.execute('SELECT COUNT(*) as total FROM Personas');
      
      diagnostics.tables.Personas = {
        exists: true,
        structure: personasStructure,
        total_records: personasCount[0]?.total || 0,
        columns: personasStructure.map(col => col.COLUMN_NAME)
      };
      
      console.log(`✅ Tabla Personas encontrada: ${personasCount[0]?.total || 0} registros`);
    } catch (error) {
      console.error('❌ Error verificando tabla Personas:', error.message);
      diagnostics.tables.Personas = {
        exists: false,
        error: error.message
      };
      diagnostics.errors.push({ table: 'Personas', error: error.message });
    }

    // 4. Verificar relaciones entre tablas
    try {
      console.log('📋 Verificando relaciones entre tablas...');
      
      // Verificar registros en Accesos sin Persona
      if (diagnostics.tables.Accesos?.exists) {
        const [orphanAccesos] = await pool.execute(`
          SELECT COUNT(*) as total
          FROM Accesos a
          LEFT JOIN Personas p ON a.id_persona = p.id_persona
          WHERE p.id_persona IS NULL
        `);
        diagnostics.tables.Accesos.orphan_records = orphanAccesos[0]?.total || 0;
        console.log(`⚠️  Registros en Accesos sin Persona: ${diagnostics.tables.Accesos.orphan_records}`);
      }

      // Verificar registros en registros_entrada_salida sin Persona
      if (diagnostics.tables.registros_entrada_salida?.exists) {
        const [orphanRegistros] = await pool.execute(`
          SELECT COUNT(*) as total
          FROM registros_entrada_salida r
          LEFT JOIN Personas p ON r.id_persona = p.id_persona
          WHERE p.id_persona IS NULL
        `);
        diagnostics.tables.registros_entrada_salida.orphan_records = orphanRegistros[0]?.total || 0;
        console.log(`⚠️  Registros en registros_entrada_salida sin Persona: ${diagnostics.tables.registros_entrada_salida.orphan_records}`);
      }
    } catch (error) {
      console.error('❌ Error verificando relaciones:', error.message);
      diagnostics.errors.push({ operation: 'check_relations', error: error.message });
    }

    // 5. Probar consultas de ejemplo
    try {
      console.log('📋 Probando consultas de ejemplo...');
      
      if (diagnostics.tables.Accesos?.exists && diagnostics.tables.Accesos.total_records > 0) {
        const [testQuery] = await pool.execute(`
          SELECT 
            a.id_acceso,
            a.tipo_acceso,
            a.fecha_entrada,
            a.id_persona,
            p.documento,
            p.nombres,
            p.apellidos
          FROM Accesos a
          LEFT JOIN Personas p ON a.id_persona = p.id_persona
          LIMIT 3
        `);
        diagnostics.tables.Accesos.test_query_result = testQuery;
        console.log(`✅ Consulta de prueba Accesos: ${testQuery.length} registros`);
      }

      if (diagnostics.tables.registros_entrada_salida?.exists && diagnostics.tables.registros_entrada_salida.total_records > 0) {
        const idColumn = await getRegistroIdField();
        const [testQuery] = await pool.execute(`
          SELECT 
            r.${idColumn} as id_registro_acceso,
            r.tipo,
            r.fecha_hora,
            r.id_persona,
            p.documento,
            p.nombres,
            p.apellidos
          FROM registros_entrada_salida r
          LEFT JOIN Personas p ON r.id_persona = p.id_persona
          LIMIT 3
        `);
        diagnostics.tables.registros_entrada_salida.test_query_result = testQuery;
        console.log(`✅ Consulta de prueba registros_entrada_salida: ${testQuery.length} registros`);
      }
    } catch (error) {
      console.error('❌ Error en consultas de prueba:', error.message);
      diagnostics.errors.push({ operation: 'test_queries', error: error.message });
    }

    console.log('✅ Diagnóstico completado');
    
    res.json({
      success: true,
      diagnostics,
      summary: {
        accesos_total: diagnostics.tables.Accesos?.total_records || 0,
        registros_total: diagnostics.tables.registros_entrada_salida?.total_records || 0,
        personas_total: diagnostics.tables.Personas?.total_records || 0,
        errors_count: diagnostics.errors.length
      }
    });
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

