// Report Service - Servicio de reportes y consultas
import pool from '../utils/dbPool.js';
import { CatalogService } from './CatalogService.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

export class ReportService {
  /**
   * HU9 - Personas actualmente dentro del establecimiento
   * Usa la vista v_personas_dentro que implementa la lógica de circuito abierto
   */
  static async getCurrentPeople(filters = {}) {
    try {
      let query = `
        SELECT 
          vd.id_persona,
          vd.documento,
          vd.nombre_completo,
          COALESCE(vd.nombre_rol, role.nombre_rol, 'sin rol') as rol,
          vd.foto,
          vd.fecha_entrada,
          vd.minutos_dentro,
          vd.zona,
          CONCAT(
            LPAD(FLOOR(vd.minutos_dentro / 60), 2, '0'), ':',
            LPAD(vd.minutos_dentro % 60, 2, '0')
          ) as tiempo_dentro,
          TIMESTAMPDIFF(SECOND, vd.fecha_entrada, NOW()) as tiempo_segundos,
          p.tipo_documento,
          p.email,
          p.telefono
        FROM v_personas_dentro vd
        INNER JOIN Personas p ON vd.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        WHERE 1=1
      `;

      const params = [];

      // Filtros opcionales
      if (filters.rol) {
        query += ` AND vd.nombre_rol = ?`;
        params.push(filters.rol);
      }

      if (filters.zona) {
        query += ` AND vd.zona LIKE ?`;
        params.push(`%${filters.zona}%`);
      }

      query += ` ORDER BY vd.fecha_entrada DESC`;

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows.map(row => ({
          id: row.id_persona,
          documento: row.documento,
          tipo_documento: row.tipo_documento,
          nombre_completo: row.nombre_completo,
          rol: row.rol,
          zona: row.zona || 'Bloque Principal',
          fecha_entrada: row.fecha_entrada,
          tiempo_dentro: row.tiempo_dentro,
          tiempo_segundos: row.tiempo_segundos,
          minutos_dentro: row.minutos_dentro,
          foto: row.foto,
          email: row.email,
          telefono: row.telefono,
          esVisitante: false,
          motivo_visita: null
        })),
        total: rows.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en getCurrentPeople:', error);
      throw error;
    }
  }

  /**
   * HU7 - Flujos predictivos (análisis de patrones)
   */
  static async getPredictiveFlows(filters = {}) {
    try {
      const dias = filters.dias || 7;
      const fechaFin = filters.fecha_hasta || new Date().toISOString().split('T')[0];
      const fechaInicio = filters.fecha_desde || new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const query = `
        SELECT 
          HOUR(r.fecha_hora) as hora,
          DAYNAME(r.fecha_hora) as dia_semana,
          COUNT(*) as frecuencia,
          AVG(TIMESTAMPDIFF(MINUTE, r.fecha_hora, COALESCE(r2.fecha_hora, NOW()))) as tiempo_promedio_minutos,
          COALESCE(role.nombre_rol, 'sin rol') as nombre_rol
        FROM registros_entrada_salida r
        LEFT JOIN registros_entrada_salida r2 
          ON r2.id_persona = r.id_persona 
          AND r2.tipo = 'SALIDA'
          AND r2.fecha_hora > r.fecha_hora
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        WHERE DATE(r.fecha_hora) BETWEEN ? AND ?
          AND (p.estado = 'activo' OR p.estado = 'ACTIVO')
        GROUP BY HOUR(r.fecha_hora), DAYNAME(r.fecha_hora), role.nombre_rol
        ORDER BY frecuencia DESC
        LIMIT 100
      `;

      const [rows] = await pool.execute(query, [fechaInicio, fechaFin]);

      return {
        success: true,
        data: rows.map(row => ({
          hora: row.hora,
          dia_semana: row.dia_semana,
          frecuencia: parseInt(row.frecuencia) || 0,
          tiempo_promedio_minutos: Math.round(row.tiempo_promedio_minutos || 0),
        rol: row.nombre_rol
        })),
        periodo: {
          fecha_desde: fechaInicio,
          fecha_hasta: fechaFin,
          dias: dias
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en getPredictiveFlows:', error);
      throw error;
    }
  }

  /**
   * Reporte de accesos por programa específico
   */
  static async getAccessByProgram(codigoPrograma, filters = {}) {
    try {
      const fechaDesde = filters.fecha_desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fechaHasta = filters.fecha_hasta || new Date().toISOString().split('T')[0];

      const idColumn = await getRegistroIdField();
      const query = `
        SELECT 
          r.${idColumn} as id_acceso,
          p.documento,
          p.tipo_documento,
          COALESCE(
            CONCAT(p.nombres, ' ', p.apellidos),
            p.nombres,
            p.apellidos,
            'Sin nombre'
          ) as nombre_completo,
          f.codigo_ficha,
          pf.codigo_programa,
          pf.nombre_programa,
          pf.nivel,
          r.tipo as tipo_acceso,
          r.fecha_hora as fecha_entrada,
          NULL as fecha_salida,
          TIMESTAMPDIFF(MINUTE, r.fecha_hora, NOW()) as duracion_minutos,
          CASE 
            WHEN r.tipo = 'ENTRADA' THEN 'activo'
            ELSE 'finalizado'
          END as estado
        FROM registros_entrada_salida r
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE pf.codigo_programa = ?
          AND DATE(r.fecha_hora) BETWEEN ? AND ?
          AND (p.estado = 'activo' OR p.estado = 'ACTIVO')
        ORDER BY r.fecha_hora DESC
      `;

      const [rows] = await pool.execute(query, [codigoPrograma, fechaDesde, fechaHasta]);

      const estadisticas = {
        total_accesos: rows.length,
        entradas: rows.filter(r => r.tipo_acceso === 'entrada').length,
        salidas: rows.filter(r => r.tipo_acceso === 'salida').length,
        aprendices_unicos: new Set(rows.map(r => r.documento)).size,
        tiempo_promedio_minutos: rows.length > 0
          ? Math.round(rows.reduce((sum, r) => sum + (r.duracion_minutos || 0), 0) / rows.length)
          : 0
      };

      return {
        success: true,
        data: rows,
        estadisticas,
        programa: rows[0] ? {
          codigo: rows[0].codigo_programa,
          nombre: rows[0].nombre_programa,
          nivel: rows[0].nivel
        } : null,
        periodo: {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta
        }
      };
    } catch (error) {
      console.error('Error en getAccessByProgram:', error);
      throw error;
    }
  }


  /**
   * Historial de accesos con filtros avanzados
   * Usa registros_entrada_salida (circuito abierto)
   * Calcula fecha_salida y duracion_minutos emparejando ENTRADAS con SALIDAS
   */
  static async getAccessHistory(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;
      const idColumn = await getRegistroIdField();

      console.log('🔍 [ReportService] Obteniendo historial de accesos con filtros:', filters);

      // Consulta mejorada que calcula fecha_salida y duracion_minutos emparejando ENTRADAS con SALIDAS
      // Para ENTRADAS: fecha_entrada = r.fecha_hora, fecha_salida = siguiente SALIDA
      // Para SALIDAS: fecha_entrada = anterior ENTRADA, fecha_salida = r.fecha_hora
      let query = `
        SELECT 
          r.${idColumn} as id_acceso,
          p.documento,
          p.tipo_documento,
          COALESCE(
            CONCAT(p.nombres, ' ', p.apellidos),
            p.nombres,
            p.apellidos,
            'Sin nombre'
          ) as nombre_completo,
          COALESCE(role.nombre_rol, 'sin rol') as rol,
          r.tipo as tipo_acceso,
          CASE 
            WHEN r.tipo = 'ENTRADA' THEN r.fecha_hora
            WHEN r.tipo = 'SALIDA' THEN (
              SELECT r2.fecha_hora 
              FROM registros_entrada_salida r2 
              WHERE r2.id_persona = r.id_persona 
                AND r2.tipo = 'ENTRADA' 
                AND r2.fecha_hora < r.fecha_hora
              ORDER BY r2.fecha_hora DESC
              LIMIT 1
            )
            ELSE r.fecha_hora
          END as fecha_entrada,
          CASE 
            WHEN r.tipo = 'ENTRADA' THEN (
              SELECT r2.fecha_hora 
              FROM registros_entrada_salida r2 
              WHERE r2.id_persona = r.id_persona 
                AND r2.tipo = 'SALIDA' 
                AND r2.fecha_hora > r.fecha_hora
              ORDER BY r2.fecha_hora ASC
              LIMIT 1
            )
            WHEN r.tipo = 'SALIDA' THEN r.fecha_hora
            ELSE NULL
          END as fecha_salida,
          CASE 
            WHEN r.tipo = 'ENTRADA' THEN (
              SELECT TIMESTAMPDIFF(MINUTE, r.fecha_hora, r2.fecha_hora)
              FROM registros_entrada_salida r2 
              WHERE r2.id_persona = r.id_persona 
                AND r2.tipo = 'SALIDA' 
                AND r2.fecha_hora > r.fecha_hora
              ORDER BY r2.fecha_hora ASC
              LIMIT 1
            )
            WHEN r.tipo = 'SALIDA' THEN (
              SELECT TIMESTAMPDIFF(MINUTE, r2.fecha_hora, r.fecha_hora)
              FROM registros_entrada_salida r2 
              WHERE r2.id_persona = r.id_persona 
                AND r2.tipo = 'ENTRADA' 
                AND r2.fecha_hora < r.fecha_hora
              ORDER BY r2.fecha_hora DESC
              LIMIT 1
            )
            ELSE NULL
          END as duracion_minutos,
          CASE 
            WHEN r.tipo = 'ENTRADA' AND EXISTS (
              SELECT 1 
              FROM registros_entrada_salida r2 
              WHERE r2.id_persona = r.id_persona 
                AND r2.tipo = 'SALIDA' 
                AND r2.fecha_hora > r.fecha_hora
            ) THEN 'finalizado'
            WHEN r.tipo = 'ENTRADA' THEN 'activo'
            WHEN r.tipo = 'SALIDA' THEN 'finalizado'
            ELSE 'activo'
          END as estado,
          'Sistema' as registrado_por
        FROM registros_entrada_salida r
        LEFT JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        WHERE 1=1
      `;

      const params = [];

      if (filters.fecha_desde) {
        query += ` AND DATE(r.fecha_hora) >= ?`;
        params.push(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        query += ` AND DATE(r.fecha_hora) <= ?`;
        params.push(filters.fecha_hasta);
      }

      if (filters.documento) {
        query += ` AND p.documento LIKE ?`;
        params.push(`%${filters.documento}%`);
      }

      if (filters.rol) {
        query += ` AND role.nombre_rol = ?`;
        params.push(filters.rol);
      }

      if (filters.tipo_acceso) {
        query += ` AND r.tipo = ?`;
        params.push(filters.tipo_acceso);
      }

      // Contar total para paginación
      let countQuery = `
        SELECT COUNT(*) as total
        FROM registros_entrada_salida r
        LEFT JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        WHERE 1=1
      `;
      const countParams = [];
      
      // Aplicar los mismos filtros al COUNT
      if (filters.fecha_desde) {
        countQuery += ` AND DATE(r.fecha_hora) >= ?`;
        countParams.push(filters.fecha_desde);
      }
      
      if (filters.fecha_hasta) {
        countQuery += ` AND DATE(r.fecha_hora) <= ?`;
        countParams.push(filters.fecha_hasta);
      }
      
      if (filters.documento) {
        countQuery += ` AND p.documento LIKE ?`;
        countParams.push(`%${filters.documento}%`);
      }
      
      if (filters.rol) {
        countQuery += ` AND role.nombre_rol = ?`;
        countParams.push(filters.rol);
      }
      
      if (filters.tipo_acceso) {
        countQuery += ` AND r.tipo = ?`;
        countParams.push(filters.tipo_acceso);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0]?.total || 0;

      // Agregar ordenamiento y paginación
      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);
      query += ` ORDER BY r.fecha_hora DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      console.log('📝 [ReportService] Ejecutando consulta SQL para historial de accesos...');
      const [rows] = await pool.execute(query, params);
      
      console.log(`✅ [ReportService] Consulta exitosa: ${rows.length} registros obtenidos`);

      // Procesar datos para asegurar formato correcto
      const processedRows = rows.map((row, index) => {
        try {
          const processed = {
            id_acceso: row.id_acceso,
            documento: row.documento || 'N/A',
            tipo_documento: row.tipo_documento || null,
            nombre_completo: row.nombre_completo || 'Sin nombre',
            rol: row.rol || 'sin rol',
            tipo_acceso: row.tipo_acceso,
            fecha_entrada: row.fecha_entrada ? new Date(row.fecha_entrada).toISOString() : null,
            fecha_salida: row.fecha_salida ? new Date(row.fecha_salida).toISOString() : null,
            duracion_minutos: row.duracion_minutos !== null && row.duracion_minutos !== undefined 
              ? parseInt(row.duracion_minutos) 
              : null,
            estado: row.estado || 'activo',
            registrado_por: row.registrado_por || 'Sistema'
          };
          
          if (index === 0) {
            console.log(`📋 [ReportService] Primer registro procesado:`, JSON.stringify(processed, null, 2));
          }
          
          return processed;
        } catch (error) {
          console.error(`❌ [ReportService] Error procesando registro ${index + 1}:`, error.message);
          return null;
        }
      }).filter(row => row !== null);
      
      const withFechaSalida = processedRows.filter(r => r.fecha_salida).length;
      const withDuracion = processedRows.filter(r => r.duracion_minutos !== null).length;
      
      console.log(`📊 [ReportService] Estadísticas de procesamiento:`);
      console.log(`   - Registros procesados: ${processedRows.length}`);
      console.log(`   - Con fecha_salida: ${withFechaSalida}`);
      console.log(`   - Con duracion_minutos: ${withDuracion}`);

      return {
        success: true,
        data: processedRows,
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        },
        filters: filters,
        metadata: {
          registros_con_fecha_salida: withFechaSalida,
          registros_con_duracion: withDuracion
        }
      };
    } catch (error) {
      console.error('Error en getAccessHistory:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error SQL:', error.sql);
      throw error;
    }
  }
}

