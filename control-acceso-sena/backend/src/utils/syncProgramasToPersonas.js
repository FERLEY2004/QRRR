// Script para sincronizar id_programa en la tabla Personas
// Asigna id_programa a aprendices que tienen el nombre del programa pero no el id_programa
import pool from '../utils/dbPool.js';

async function syncProgramasToPersonas() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 SINCRONIZACIÓN DE PROGRAMAS A PERSONAS');
    console.log('='.repeat(80));
    console.log('');

    // Obtener todos los aprendices que tienen programa pero no id_programa
    const [aprendicesSinIdPrograma] = await pool.execute(
      `SELECT DISTINCT programa, COUNT(*) as total
       FROM Personas
       WHERE rol = 'aprendiz'
         AND programa IS NOT NULL
         AND programa != ''
         AND id_programa IS NULL
       GROUP BY programa`
    );

    console.log(`📊 Encontrados ${aprendicesSinIdPrograma.length} programas diferentes sin id_programa asignado`);
    console.log('');

    let totalActualizados = 0;
    let totalNoEncontrados = 0;
    const programasNoEncontrados = [];

    for (const row of aprendicesSinIdPrograma) {
      const nombrePrograma = row.programa.trim();
      console.log(`🔍 Buscando programa: "${nombrePrograma}" (${row.total} aprendices)...`);

      // Buscar el programa por nombre exacto o similar
      const [programas] = await pool.execute(
        `SELECT id_programa, codigo_programa, nombre_programa
         FROM Programas_Formacion
         WHERE nombre_programa = ?
            OR nombre_programa LIKE ?
            OR nombre_programa LIKE ?`,
        [
          nombrePrograma,
          `%${nombrePrograma}%`,
          `${nombrePrograma}%`
        ]
      );

      if (programas.length > 0) {
        const programa = programas[0];
        console.log(`   ✅ Encontrado: ${programa.codigo_programa} - ${programa.nombre_programa}`);

        // Actualizar todos los aprendices con este programa
        const [result] = await pool.execute(
          `UPDATE Personas
           SET id_programa = ?
           WHERE rol = 'aprendiz'
             AND programa = ?
             AND id_programa IS NULL`,
          [programa.id_programa, nombrePrograma]
        );

        console.log(`   ✅ Actualizados: ${result.affectedRows} aprendices`);
        totalActualizados += result.affectedRows;
      } else {
        console.log(`   ⚠️  No se encontró programa para: "${nombrePrograma}"`);
        programasNoEncontrados.push({
          nombre: nombrePrograma,
          total: row.total
        });
        totalNoEncontrados += row.total;
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log('='.repeat(80));
    console.log(`📊 Resumen:`);
    console.log(`   - Aprendices actualizados: ${totalActualizados}`);
    console.log(`   - Aprendices sin programa encontrado: ${totalNoEncontrados}`);

    if (programasNoEncontrados.length > 0) {
      console.log('');
      console.log('⚠️  Programas no encontrados en la base de datos:');
      programasNoEncontrados.forEach(p => {
        console.log(`   - "${p.nombre}" (${p.total} aprendices)`);
      });
      console.log('');
      console.log('💡 Sugerencia: Verifica que estos programas estén en la tabla Programas_Formacion');
    }

    console.log('');

    return {
      success: true,
      totalActualizados,
      totalNoEncontrados,
      programasNoEncontrados
    };
  } catch (error) {
    console.error('❌ Error en syncProgramasToPersonas:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('syncProgramasToPersonas.js')) {
  syncProgramasToPersonas()
    .then(result => {
      if (result.success) {
        console.log('✅ Proceso completado exitosamente');
        process.exit(0);
      } else {
        console.error('❌ Proceso completado con errores');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { syncProgramasToPersonas };







