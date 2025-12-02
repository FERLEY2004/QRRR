// Script para verificar y corregir el trigger de Accesos
// Ejecutar con: node src/utils/fixAccesosTrigger.js
import pool from './dbPool.js';
import { verifyTrigger, createTrigger, syncAccesosTable } from './syncAccesos.js';

async function main() {
  try {
    console.log('🔍 Verificando estado del trigger y datos...\n');
    
    // 1. Verificar si el trigger existe
    console.log('1️⃣ Verificando trigger...');
    const triggerExists = await verifyTrigger();
    
    if (!triggerExists) {
      console.log('⚠️  El trigger no existe. Creándolo...');
      await createTrigger();
      console.log('✅ Trigger creado exitosamente\n');
    } else {
      console.log('✅ El trigger ya existe\n');
    }
    
    // 2. Verificar datos en registros_entrada_salida
    console.log('2️⃣ Verificando datos en registros_entrada_salida...');
    const [registros] = await pool.execute(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN tipo = "ENTRADA" THEN 1 END) as entradas, COUNT(CASE WHEN tipo = "SALIDA" THEN 1 END) as salidas FROM registros_entrada_salida'
    );
    console.log(`   Total registros: ${registros[0].total}`);
    console.log(`   Entradas: ${registros[0].entradas}`);
    console.log(`   Salidas: ${registros[0].salidas}\n`);
    
    // 3. Verificar datos en Accesos
    console.log('3️⃣ Verificando datos en Accesos...');
    const [accesos] = await pool.execute('SELECT COUNT(*) as total FROM Accesos');
    console.log(`   Total accesos: ${accesos[0].total}\n`);
    
    // 4. Si hay datos en registros_entrada_salida pero no en Accesos, sincronizar
    if (registros[0].total > 0 && accesos[0].total === 0) {
      console.log('🔄 Sincronizando datos históricos...');
      const result = await syncAccesosTable();
      console.log(`✅ Sincronización completada:`);
      console.log(`   - Entradas procesadas: ${result.entradas}`);
      console.log(`   - Salidas sin entrada: ${result.salidasSinEntrada}\n`);
    } else if (registros[0].total === 0) {
      console.log('ℹ️  No hay datos en registros_entrada_salida para sincronizar\n');
    } else {
      console.log('ℹ️  Ya hay datos en Accesos\n');
    }
    
    // 5. Probar el trigger insertando un registro de prueba (si hay personas)
    console.log('4️⃣ Verificando que el trigger funcione...');
    const [personas] = await pool.execute('SELECT id_persona FROM Personas LIMIT 1');
    
    if (personas.length > 0) {
      const testPersonId = personas[0].id_persona;
      console.log(`   Insertando registro de prueba para persona ${testPersonId}...`);
      
      // Insertar un registro de prueba
      await pool.execute(
        'INSERT INTO registros_entrada_salida (id_persona, tipo, fecha_hora) VALUES (?, "ENTRADA", NOW())',
        [testPersonId]
      );
      
      // Verificar que se creó en Accesos
      await new Promise(resolve => setTimeout(resolve, 500)); // Esperar un poco
      
      const [accesosDespues] = await pool.execute('SELECT COUNT(*) as total FROM Accesos');
      console.log(`   Accesos después de prueba: ${accesosDespues[0].total}`);
      
      if (accesosDespues[0].total > accesos[0].total) {
        console.log('   ✅ El trigger está funcionando correctamente!\n');
        
        // Limpiar el registro de prueba
        await pool.execute(
          'DELETE FROM registros_entrada_salida WHERE id_persona = ? AND tipo = "ENTRADA" ORDER BY fecha_hora DESC LIMIT 1',
          [testPersonId]
        );
        await pool.execute(
          'DELETE FROM Accesos WHERE id_persona = ? AND tipo_acceso = "entrada" ORDER BY fecha_entrada DESC LIMIT 1',
          [testPersonId]
        );
        console.log('   🧹 Registro de prueba eliminado\n');
      } else {
        console.log('   ❌ El trigger NO está funcionando. Revisando...\n');
        
        // Verificar errores del trigger
        const [triggerInfo] = await pool.execute(
          `SELECT TRIGGER_NAME, ACTION_STATEMENT, ACTION_TIMING, EVENT_MANIPULATION
           FROM INFORMATION_SCHEMA.TRIGGERS
           WHERE TRIGGER_SCHEMA = DATABASE()
             AND TRIGGER_NAME = 'tr_sync_accesos_entrada'`
        );
        
        if (triggerInfo.length > 0) {
          console.log('   Información del trigger:');
          console.log(JSON.stringify(triggerInfo[0], null, 2));
        }
      }
    } else {
      console.log('   ⚠️  No hay personas en la base de datos para probar el trigger\n');
    }
    
    // 6. Resumen final
    console.log('📊 Resumen final:');
    const [finalRegistros] = await pool.execute('SELECT COUNT(*) as total FROM registros_entrada_salida');
    const [finalAccesos] = await pool.execute('SELECT COUNT(*) as total FROM Accesos');
    console.log(`   - Registros en registros_entrada_salida: ${finalRegistros[0].total}`);
    console.log(`   - Registros en Accesos: ${finalAccesos[0].total}`);
    console.log(`   - Trigger activo: ${await verifyTrigger() ? 'Sí' : 'No'}`);
    
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();

