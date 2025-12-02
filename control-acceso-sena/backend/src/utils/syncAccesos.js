// Script para sincronizar la tabla Accesos con registros_entrada_salida
// Este script puede ejecutarse manualmente para poblar datos históricos
import pool from './dbPool.js';

/**
 * Sincroniza la tabla Accesos con los datos existentes en registros_entrada_salida
 */
export async function syncAccesosTable() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🔄 Iniciando sincronización de tabla Accesos...');
    
    // Limpiar tabla Accesos (opcional, comentar si no se desea)
    // await connection.execute('TRUNCATE TABLE Accesos');
    
    // Obtener todas las entradas ordenadas por persona y fecha
    const [entradas] = await connection.execute(
      `SELECT id_persona, fecha_hora
       FROM registros_entrada_salida
       WHERE tipo = 'ENTRADA'
       ORDER BY id_persona, fecha_hora`
    );
    
    console.log(`📊 Procesando ${entradas.length} entradas...`);
    
    let procesadas = 0;
    
    for (const entrada of entradas) {
      // Insertar entrada en Accesos
      const [result] = await connection.execute(
        `INSERT INTO Accesos (
          id_persona,
          id_usuario_registro,
          tipo_acceso,
          fecha_entrada,
          estado,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (?, NULL, 'entrada', ?, 'activo', ?, ?)`,
        [entrada.id_persona, entrada.fecha_hora, entrada.fecha_hora, entrada.fecha_hora]
      );
      
      const accesoId = result.insertId;
      
      // Buscar la siguiente salida para esta persona después de esta entrada
      const [salidas] = await connection.execute(
        `SELECT fecha_hora
         FROM registros_entrada_salida
         WHERE id_persona = ?
           AND tipo = 'SALIDA'
           AND fecha_hora > ?
         ORDER BY fecha_hora ASC
         LIMIT 1`,
        [entrada.id_persona, entrada.fecha_hora]
      );
      
      // Si hay salida, actualizar el acceso
      if (salidas.length > 0) {
        await connection.execute(
          `UPDATE Accesos
           SET fecha_salida = ?,
               estado = 'finalizado',
               fecha_actualizacion = ?
           WHERE id_acceso = ?`,
          [salidas[0].fecha_hora, salidas[0].fecha_hora, accesoId]
        );
      }
      
      procesadas++;
      if (procesadas % 100 === 0) {
        console.log(`  ✅ Procesadas ${procesadas} entradas...`);
      }
    }
    
    // Procesar salidas sin entrada previa
    console.log('📊 Procesando salidas sin entrada previa...');
    const [salidasSinEntrada] = await connection.execute(
      `SELECT id_persona, fecha_hora
       FROM registros_entrada_salida
       WHERE tipo = 'SALIDA'
         AND NOT EXISTS (
           SELECT 1 FROM Accesos a
           WHERE a.id_persona = registros_entrada_salida.id_persona
             AND a.fecha_salida = registros_entrada_salida.fecha_hora
         )`
    );
    
    for (const salida of salidasSinEntrada) {
      await connection.execute(
        `INSERT INTO Accesos (
          id_persona,
          id_usuario_registro,
          tipo_acceso,
          fecha_entrada,
          fecha_salida,
          estado,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (?, NULL, 'salida', ?, ?, 'finalizado', ?, ?)`,
        [salida.id_persona, salida.fecha_hora, salida.fecha_hora, salida.fecha_hora, salida.fecha_hora]
      );
    }
    
    await connection.commit();
    
    console.log(`✅ Sincronización completada: ${procesadas} entradas procesadas, ${salidasSinEntrada.length} salidas sin entrada previa`);
    
    return {
      success: true,
      entradas: procesadas,
      salidasSinEntrada: salidasSinEntrada.length
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al sincronizar tabla Accesos:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verifica que el trigger esté activo
 */
export async function verifyTrigger() {
  try {
    const [triggers] = await pool.execute(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT
       FROM INFORMATION_SCHEMA.TRIGGERS
       WHERE TRIGGER_SCHEMA = DATABASE()
         AND TRIGGER_NAME = 'tr_sync_accesos_entrada'`
    );
    
    if (triggers.length === 0) {
      console.warn('⚠️  El trigger tr_sync_accesos_entrada no está activo');
      return false;
    }
    
    console.log('✅ El trigger tr_sync_accesos_entrada está activo');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar trigger:', error);
    return false;
  }
}

/**
 * Crea o recrea el trigger para sincronizar Accesos
 */
export async function createTrigger() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Creando trigger tr_sync_accesos_entrada...');
    
    // Eliminar trigger si existe - usar query() para DDL
    await connection.query('DROP TRIGGER IF EXISTS tr_sync_accesos_entrada');
    
    // Crear trigger - MySQL2 requiere que el SQL del trigger esté en una sola línea o usar query
    // Sin DELIMITER, el trigger debe estar completo
    const triggerSQL = `CREATE TRIGGER tr_sync_accesos_entrada
AFTER INSERT ON registros_entrada_salida
FOR EACH ROW
BEGIN
  DECLARE v_id_usuario_registro INT DEFAULT NULL;
  
  IF NEW.tipo = 'ENTRADA' THEN
    INSERT INTO Accesos (
      id_persona,
      id_usuario_registro,
      tipo_acceso,
      fecha_entrada,
      estado,
      fecha_creacion,
      fecha_actualizacion
    ) VALUES (
      NEW.id_persona,
      v_id_usuario_registro,
      'entrada',
      NEW.fecha_hora,
      'activo',
      NEW.fecha_hora,
      NEW.fecha_hora
    );
  ELSEIF NEW.tipo = 'SALIDA' THEN
    UPDATE Accesos
    SET fecha_salida = NEW.fecha_hora,
        estado = 'finalizado',
        fecha_actualizacion = NOW()
    WHERE id_acceso = (
      SELECT id_acceso FROM (
        SELECT id_acceso
        FROM Accesos
        WHERE id_persona = NEW.id_persona
          AND estado = 'activo'
          AND fecha_salida IS NULL
        ORDER BY fecha_entrada DESC
        LIMIT 1
      ) AS temp
    );
    
    IF ROW_COUNT() = 0 THEN
      INSERT INTO Accesos (
        id_persona,
        id_usuario_registro,
        tipo_acceso,
        fecha_entrada,
        fecha_salida,
        estado,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES (
        NEW.id_persona,
        v_id_usuario_registro,
        'salida',
        NEW.fecha_hora,
        NEW.fecha_hora,
        'finalizado',
        NEW.fecha_hora,
        NEW.fecha_hora
      );
    END IF;
  END IF;
END`;
    
    // Ejecutar el trigger usando query (no execute) para permitir múltiples líneas
    await connection.query(triggerSQL);
    
    console.log('✅ Trigger tr_sync_accesos_entrada creado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear trigger:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Si se ejecuta directamente, ejecutar sincronización
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await verifyTrigger();
      await syncAccesosTable();
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

