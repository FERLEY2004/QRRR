// Analytics Service - Servicio de análisis en tiempo real
import pool from '../utils/dbPool.js';

export class AnalyticsService {
  /**
   * Ocupación actual por ambiente
   */
  static async getCurrentOccupancy() {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          a.id_ambiente,
          a.codigo_ambiente,
          a.nombre_ambiente,
          a.bloque,
          a.capacidad,
          COUNT(DISTINCT vd.id_persona) as ocupacion_actual,
          ROUND((COUNT(DISTINCT vd.id_persona) / a.capacidad) * 100, 2) as porcentaje_ocupacion
        FROM Ambientes a
        LEFT JOIN v_personas_dentro vd ON 1=1
        WHERE a.estado = 'activo'
        GROUP BY a.id_ambiente, a.codigo_ambiente, a.nombre_ambiente, a.bloque, a.capacidad
        ORDER BY a.bloque, a.nombre_ambiente`
      );

      return {
        success: true,
        data: rows.map(row => ({
          ambiente: row.nombre_ambiente,
          codigo: row.codigo_ambiente,
          bloque: row.bloque,
          capacidad: row.capacidad,
          ocupacion_actual: row.ocupacion_actual || 0,
          disponibilidad: row.capacidad - (row.ocupacion_actual || 0),
          porcentaje: parseFloat(row.porcentaje_ocupacion) || 0
        }))
      };
    } catch (error) {
      console.error('Error en getCurrentOccupancy:', error);
      throw error;
    }
  }

  /**
   * Estadísticas por ficha
   */
  static async getStatsByFicha(ficha) {
    try {
      const [fichaData] = await pool.execute(
        `SELECT f.*, pf.nombre_programa, COUNT(DISTINCT p.id_persona) as total_aprendices
         FROM Fichas f
         LEFT JOIN Programas_Formacion pf ON f.id_programa = pf.id_programa
         LEFT JOIN Personas p ON p.id_ficha = f.id_ficha AND p.estado = 'activo'
         WHERE f.codigo_ficha = ?
         GROUP BY f.id_ficha`,
        [ficha]
      );

      if (fichaData.length === 0) {
        return {
          success: false,
          error: 'Ficha no encontrada'
        };
      }

      const fichaInfo = fichaData[0];

      // Contar presentes (usando vista v_personas_dentro)
      const [presentes] = await pool.execute(
        `SELECT COUNT(DISTINCT vd.id_persona) as presentes
         FROM v_personas_dentro vd
         INNER JOIN Personas p ON vd.id_persona = p.id_persona
         WHERE p.id_ficha = ? 
           AND (p.estado = 'activo' OR p.estado = 'ACTIVO')`,
        [fichaInfo.id_ficha]
      );

      const presentesCount = presentes[0]?.presentes || 0;
      const ausentesCount = fichaInfo.total_aprendices - presentesCount;

      return {
        success: true,
        data: {
          ficha: fichaInfo.codigo_ficha,
          programa: fichaInfo.nombre_programa || fichaInfo.programa_formacion,
          jornada: fichaInfo.jornada,
          total_aprendices: fichaInfo.total_aprendices,
          presentes: presentesCount,
          ausentes: ausentesCount,
          porcentaje_asistencia: fichaInfo.total_aprendices > 0
            ? Math.round((presentesCount / fichaInfo.total_aprendices) * 100)
            : 0
        }
      };
    } catch (error) {
      console.error('Error en getStatsByFicha:', error);
      throw error;
    }
  }

  /**
   * Estadísticas por programa
   */
  static async getStatsByPrograma(codigoPrograma) {
    try {
      const [programaData] = await pool.execute(
        `SELECT * FROM Programas_Formacion WHERE codigo_programa = ?`,
        [codigoPrograma]
      );

      if (programaData.length === 0) {
        return {
          success: false,
          error: 'Programa no encontrado'
        };
      }

      const programa = programaData[0];

      // Obtener fichas del programa
      const [fichas] = await pool.execute(
        `SELECT f.codigo_ficha, COUNT(DISTINCT p.id_persona) as total_aprendices
         FROM Fichas f
         LEFT JOIN Personas p ON p.id_ficha = f.id_ficha AND p.estado = 'activo'
         WHERE f.id_programa = ?
         GROUP BY f.id_ficha, f.codigo_ficha`,
        [programa.id_programa]
      );

      return {
        success: true,
        data: {
          programa: programa.nombre_programa,
          codigo: programa.codigo_programa,
          nivel: programa.nivel,
          fichas: fichas.map(f => ({
            codigo: f.codigo_ficha,
            total_aprendices: f.total_aprendices
          })),
          total_fichas: fichas.length,
          total_aprendices: fichas.reduce((sum, f) => sum + f.total_aprendices, 0)
        }
      };
    } catch (error) {
      console.error('Error en getStatsByPrograma:', error);
      throw error;
    }
  }

  /**
   * Historial de asistencias de una persona
   */
  static async getAttendanceHistory(documento, limit = 30) {
    try {
      const [personRows] = await pool.execute(
        `SELECT id_persona FROM Personas WHERE documento = ? LIMIT 1`,
        [documento]
      );

      if (personRows.length === 0) {
        return {
          success: false,
          error: 'Persona no encontrada'
        };
      }

      const personId = personRows[0].id_persona;

      // Obtener historial reciente (usando registros_entrada_salida)
      const [historial] = await pool.execute(
        `SELECT 
          fecha_hora as fecha_entrada,
          NULL as fecha_salida,
          tipo as tipo_acceso,
          NULL as duracion_minutos
         FROM registros_entrada_salida
         WHERE id_persona = ?
         ORDER BY fecha_hora DESC
         LIMIT ?`,
        [personId, limit]
      );

      // Calcular estadísticas del mes
      const fechaInicioMes = new Date();
      fechaInicioMes.setDate(1);
      fechaInicioMes.setHours(0, 0, 0, 0);

      const [statsMes] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT DATE(fecha_hora)) as dias_presentes,
          COUNT(*) as total_accesos
         FROM registros_entrada_salida
         WHERE id_persona = ?
           AND fecha_hora >= ?
           AND tipo = 'ENTRADA'`,
        [personId, fechaInicioMes]
      );

      const diasPresentes = statsMes[0]?.dias_presentes || 0;
      const diasLaborables = new Date().getDate(); // Días transcurridos del mes
      const porcentajeAsistencia = diasLaborables > 0
        ? Math.round((diasPresentes / diasLaborables) * 100)
        : 0;

      return {
        success: true,
        data: {
          documento,
          historial_reciente: historial.map(h => ({
            fecha: h.fecha_entrada.toISOString().split('T')[0],
            entrada: h.fecha_entrada.toTimeString().split(' ')[0].substring(0, 5),
            salida: h.fecha_salida ? h.fecha_salida.toTimeString().split(' ')[0].substring(0, 5) : null,
            duracion_minutos: h.duracion_minutos
          })),
          asistencias_mes: {
            presentes: diasPresentes,
            ausentes: diasLaborables - diasPresentes,
            porcentaje_asistencia: porcentajeAsistencia
          }
        }
      };
    } catch (error) {
      console.error('Error en getAttendanceHistory:', error);
      throw error;
    }
  }

  /**
   * Estadísticas diarias generales
   */
  static async getDailyStats(date = null) {
    try {
      const fecha = date || new Date().toISOString().split('T')[0];

      const [stats] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT CASE WHEN tipo = 'ENTRADA' THEN id_persona END) as total_entradas,
          COUNT(DISTINCT CASE WHEN tipo = 'SALIDA' THEN id_persona END) as total_salidas,
          COUNT(DISTINCT id_persona) as personas_unicas,
          COUNT(*) as total_accesos
         FROM registros_entrada_salida
         WHERE DATE(fecha_hora) = ?`,
        [fecha]
      );

      const [ocupacionActual] = await pool.execute(
        `SELECT COUNT(DISTINCT id_persona) as ocupacion_actual
         FROM v_personas_dentro`,
        []
      );

      return {
        success: true,
        data: {
          fecha,
          total_entradas: stats[0]?.total_entradas || 0,
          total_salidas: stats[0]?.total_salidas || 0,
          personas_unicas: stats[0]?.personas_unicas || 0,
          total_accesos: stats[0]?.total_accesos || 0,
          ocupacion_actual: ocupacionActual[0]?.ocupacion_actual || 0
        }
      };
    } catch (error) {
      console.error('Error en getDailyStats:', error);
      throw error;
    }
  }
}







