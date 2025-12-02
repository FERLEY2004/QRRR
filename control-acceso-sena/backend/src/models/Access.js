// Access Model - Sistema de Circuito Abierto
import pool from '../utils/dbPool.js';

export default class Access {
  // Registrar entrada (circuito abierto)
  static async registerEntry(personId, userId = null, tipoAcceso = 'ENTRADA') {
    const [result] = await pool.execute(
      `INSERT INTO registros_entrada_salida (id_persona, tipo, fecha_hora)
       VALUES (?, ?, NOW())`,
      [personId, 'ENTRADA']
    );
    return result.insertId;
  }

  // Registrar salida (circuito abierto)
  static async registerExit(personId, userId = null) {
    // En circuito abierto, simplemente insertamos un registro de SALIDA
    const [result] = await pool.execute(
      `INSERT INTO registros_entrada_salida (id_persona, tipo, fecha_hora)
       VALUES (?, ?, NOW())`,
      [personId, 'SALIDA']
    );
    // Retornar true para compatibilidad con código existente que espera booleano
    return result.insertId > 0;
  }

  // Obtener historial de accesos de una persona
  static async getHistoryByPerson(personId, limit = 10) {
    const [rows] = await pool.execute(
      `SELECT r.*, p.nombre, p.documento
       FROM registros_entrada_salida r
       INNER JOIN Personas p ON r.id_persona = p.id_persona
       WHERE r.id_persona = ?
       ORDER BY r.fecha_hora DESC
       LIMIT ?`,
      [personId, limit]
    );
    return rows;
  }

  // Obtener estadísticas del día
  static async getDailyStats(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Estadísticas usando registros_entrada_salida (circuito abierto)
    let accessRows;
    try {
      [accessRows] = await pool.execute(
        `SELECT 
          COUNT(*) as total_registros,
          COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as entradas,
          COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END) as salidas
         FROM registros_entrada_salida
         WHERE DATE(fecha_hora) = ?`,
        [targetDate]
      );
    } catch (error) {
      console.warn('⚠️  Error obteniendo estadísticas del día, usando valores por defecto:', error.message);
      accessRows = [{ total_registros: 0, entradas: 0, salidas: 0 }];
    }
    
    // Personas actualmente dentro (usando vista) - con manejo de errores
    let personasDentro = 0;
    try {
      const [insideRows] = await pool.execute(
        `SELECT COUNT(*) as personas_dentro
         FROM v_personas_dentro`
      );
      personasDentro = insideRows[0]?.personas_dentro || 0;
    } catch (error) {
      // Si la vista no existe, calcular manualmente
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
        console.warn('⚠️  Vista v_personas_dentro no existe, calculando manualmente...');
        try {
          const [insideRows] = await pool.execute(
            `SELECT COUNT(DISTINCT p.id_persona) as personas_dentro
             FROM Personas p
             INNER JOIN registros_entrada_salida r ON p.id_persona = r.id_persona
             WHERE r.tipo = 'ENTRADA'
               AND r.fecha_hora = (
                 SELECT MAX(fecha_hora) 
                 FROM registros_entrada_salida 
                 WHERE id_persona = p.id_persona
               )
               AND NOT EXISTS (
                 SELECT 1 
                 FROM registros_entrada_salida r2 
                 WHERE r2.id_persona = p.id_persona 
                   AND r2.tipo = 'SALIDA' 
                   AND r2.fecha_hora > r.fecha_hora
               )
               AND (p.estado = 'ACTIVO' OR p.estado = 'activo')`
          );
          personasDentro = insideRows[0]?.personas_dentro || 0;
        } catch (fallbackError) {
          console.warn('⚠️  Error calculando personas dentro manualmente, usando 0:', fallbackError.message);
          personasDentro = 0;
        }
      } else {
        console.warn('⚠️  Error obteniendo personas dentro, usando 0:', error.message);
        personasDentro = 0;
      }
    }
    
    // Estadísticas de visitantes del día - probar ambos nombres de tabla
    let visitorsCount = 0;
    try {
      try {
        // Intentar con Visitantes (mayúscula) primero
        const [visitorRows] = await pool.execute(
          `SELECT COUNT(*) as visitantes
           FROM Visitantes
           WHERE DATE(fecha_inicio) = ?`,
          [targetDate]
        );
        visitorsCount = visitorRows[0]?.visitantes || 0;
      } catch (error) {
        // Si falla, intentar con visitantes (minúscula)
        if (error.code === 'ER_NO_SUCH_TABLE') {
          const [visitorRows] = await pool.execute(
            `SELECT COUNT(*) as visitantes
             FROM visitantes
             WHERE DATE(fecha_inicio) = ?`,
            [targetDate]
          );
          visitorsCount = visitorRows[0]?.visitantes || 0;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.warn('⚠️  Error obteniendo estadísticas de visitantes, usando 0:', error.message);
      visitorsCount = 0;
    }
    
    return {
      total_registros: accessRows[0]?.total_registros || 0,
      personas_dentro: personasDentro,
      entradas: accessRows[0]?.entradas || 0,
      salidas: accessRows[0]?.salidas || 0,
      visitantes: visitorsCount
    };
  }
}
