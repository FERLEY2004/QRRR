// Report Controller - Generación de reportes
import pool from '../utils/dbPool.js';
import Access from '../models/Access.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

// Reporte diario de accesos
export const getDailyReport = async (req, res) => {
  try {
    const { fecha } = req.query;
    const targetDate = fecha || new Date().toISOString().split('T')[0];
    const idColumn = await getRegistroIdField();

    // Estadísticas generales del día
    const dailyStats = await Access.getDailyStats(targetDate);

    // Accesos detallados del día
    const [accessRows] = await pool.execute(
      `SELECT 
        r.${idColumn} as id_acceso,
        r.tipo as tipo_acceso,
        r.fecha_hora as fecha_entrada,
        NULL as fecha_salida,
        COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombre) as persona_nombre,
        p.documento,
        COALESCE(role.nombre_rol, 'sin rol') as rol,
        u.nombre as registrado_por
       FROM registros_entrada_salida r
       INNER JOIN Personas p ON r.id_persona = p.id_persona
       LEFT JOIN Roles role ON p.id_rol = role.id_rol
       LEFT JOIN Usuarios u ON r.id_usuario_registro = u.id_usuario
       WHERE DATE(r.fecha_hora) = ?
       ORDER BY r.fecha_hora DESC`,
      [targetDate]
    );

    // Accesos por rol
    const [roleStats] = await pool.execute(
      `SELECT 
        COALESCE(role.nombre_rol, 'sin rol') as rol,
        COUNT(*) as total,
        SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as salidas
       FROM registros_entrada_salida r
       INNER JOIN Personas p ON r.id_persona = p.id_persona
       LEFT JOIN Roles role ON p.id_rol = role.id_rol
       WHERE DATE(r.fecha_hora) = ?
       GROUP BY role.nombre_rol`,
      [targetDate]
    );

    res.json({
      success: true,
      data: {
        fecha: targetDate,
        estadisticas: dailyStats,
        accesos: accessRows,
        porRol: roleStats,
        totalRegistros: accessRows.length
      }
    });
  } catch (error) {
    console.error('❌ Error en getDailyReport:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte diario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Reporte semanal de accesos
export const getWeeklyReport = async (req, res) => {
  try {
    const { semana } = req.query; // Formato: YYYY-WW o fecha de inicio
    
    // Calcular rango de fechas de la semana
    let startDate, endDate;
    if (semana) {
      // Si viene formato YYYY-WW, calcular fechas
      const [year, week] = semana.split('-W');
      const date = new Date(year, 0, 1 + (week - 1) * 7);
      startDate = new Date(date.setDate(date.getDate() - date.getDay()));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      // Semana actual
      const today = new Date();
      startDate = new Date(today.setDate(today.getDate() - today.getDay()));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Estadísticas por día de la semana
    const [dailyStats] = await pool.execute(
      `SELECT 
        DATE(r.fecha_hora) as fecha,
        COUNT(*) as total_accesos,
        SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as salidas
       FROM registros_entrada_salida r
       WHERE DATE(r.fecha_hora) BETWEEN ? AND ?
       GROUP BY DATE(r.fecha_hora)
       ORDER BY fecha ASC`,
      [startDateStr, endDateStr]
    );

    // Estadísticas por rol
    const [roleStats] = await pool.execute(
      `SELECT 
        COALESCE(role.nombre_rol, 'sin rol') as rol,
        COUNT(*) as total,
        SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as salidas
       FROM registros_entrada_salida r
       INNER JOIN Personas p ON r.id_persona = p.id_persona
       LEFT JOIN Roles role ON p.id_rol = role.id_rol
       WHERE DATE(r.fecha_hora) BETWEEN ? AND ?
       GROUP BY role.nombre_rol`,
      [startDateStr, endDateStr]
    );

    // Total de la semana
    const [totalStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_accesos,
        SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as total_entradas,
        SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as total_salidas
       FROM registros_entrada_salida r
       WHERE DATE(r.fecha_hora) BETWEEN ? AND ?`,
      [startDateStr, endDateStr]
    );

    res.json({
      success: true,
      data: {
        semana: semana || 'actual',
        fechaInicio: startDateStr,
        fechaFin: endDateStr,
        totales: totalStats[0],
        porDia: dailyStats,
        porRol: roleStats
      }
    });
  } catch (error) {
    console.error('Error en getWeeklyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte semanal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reporte de visitantes
export const getVisitorsReport = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    
    let query = `
      SELECT 
        v.id_visitante,
        v.fecha_inicio,
        v.fecha_fin,
        v.estado,
        v.motivo_visita,
        v.contacto,
        v.persona_visita,
        COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombre) as persona_nombre,
        p.documento,
        p.tipo_documento
      FROM Visitantes v
      INNER JOIN Personas p ON v.id_persona = p.id_persona
      WHERE 1=1
    `;
    const params = [];

    if (desde) {
      query += ' AND DATE(v.fecha_inicio) >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND DATE(v.fecha_inicio) <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY v.fecha_inicio DESC';

    const [visitors] = await pool.execute(query, params);

    // Estadísticas
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
        SUM(CASE WHEN estado = 'expirado' THEN 1 ELSE 0 END) as expirados
       FROM Visitantes v
       WHERE 1=1
       ${desde ? 'AND DATE(v.fecha_inicio) >= ?' : ''}
       ${hasta ? 'AND DATE(v.fecha_inicio) <= ?' : ''}`,
      params
    );

    res.json({
      success: true,
      data: {
        visitantes: visitors,
        estadisticas: stats[0],
        rango: { desde: desde || 'inicio', hasta: hasta || 'actual' }
      }
    });
  } catch (error) {
    console.error('Error en getVisitorsReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de visitantes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reporte de accesos por rol
export const getRoleReport = async (req, res) => {
  try {
    const { rol, desde, hasta } = req.query;
    const idColumn = await getRegistroIdField();
    
      let query = `
      SELECT 
        r.${idColumn} as id_acceso,
        r.tipo as tipo_acceso,
        r.fecha_hora as fecha_entrada,
        NULL as fecha_salida,
        COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombre) as persona_nombre,
        p.documento,
        COALESCE(role.nombre_rol, 'sin rol') as rol,
        u.nombre as registrado_por
      FROM registros_entrada_salida r
      INNER JOIN Personas p ON r.id_persona = p.id_persona
      LEFT JOIN Roles role ON p.id_rol = role.id_rol
      LEFT JOIN Usuarios u ON r.id_usuario_registro = u.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (rol) {
      query += ' AND role.nombre_rol = ?';
      params.push(rol);
    }

    if (desde) {
      query += ' AND DATE(a.fecha_entrada) >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND DATE(a.fecha_entrada) <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY a.fecha_entrada DESC';

    const [accesses] = await pool.execute(query, params);

    // Estadísticas del rol
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as salidas
       FROM registros_entrada_salida r
       INNER JOIN Personas p ON r.id_persona = p.id_persona
       LEFT JOIN Roles role ON p.id_rol = role.id_rol
       WHERE 1=1
       ${rol ? 'AND role.nombre_rol = ?' : ''}
       ${desde ? 'AND DATE(r.fecha_hora) >= ?' : ''}
       ${hasta ? 'AND DATE(r.fecha_hora) <= ?' : ''}`,
      params
    );

    res.json({
      success: true,
      data: {
        rol: rol || 'todos',
        accesos: accesses,
        estadisticas: stats[0],
        rango: { desde: desde || 'inicio', hasta: hasta || 'actual' }
      }
    });
  } catch (error) {
    console.error('Error en getRoleReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte por rol',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Exportar reporte a CSV (para Excel)
export const exportReportCSV = async (req, res) => {
  try {
    const { tipo, fecha, semana, desde, hasta, rol } = req.body;

    let data = [];
    let filename = 'reporte';
    let headers = [];

    switch (tipo) {
      case 'daily':
        const dailyStats = await Access.getDailyStats(fecha || new Date().toISOString().split('T')[0]);
        const [dailyAccesses] = await pool.execute(
          `SELECT 
            r.fecha_hora,
            r.tipo,
            COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombre) as persona_nombre,
            p.documento,
            COALESCE(role.nombre_rol, 'sin rol') as rol,
            u.nombre as registrado_por
           FROM registros_entrada_salida r
           INNER JOIN Personas p ON r.id_persona = p.id_persona
           LEFT JOIN Roles role ON p.id_rol = role.id_rol
           LEFT JOIN Usuarios u ON r.id_usuario_registro = u.id_usuario
           WHERE DATE(r.fecha_hora) = ?
           ORDER BY r.fecha_hora DESC`,
          [fecha || new Date().toISOString().split('T')[0]]
        );
        data = dailyAccesses;
        headers = ['Fecha', 'Tipo', 'Persona', 'Documento', 'Rol', 'Registrado Por'];
        filename = `reporte_diario_${fecha || new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'weekly':
        const today = new Date();
        const startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const [weeklyData] = await pool.execute(
          `SELECT 
            DATE(r.fecha_hora) as fecha,
            COUNT(*) as total_accesos,
            SUM(CASE WHEN r.tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
            SUM(CASE WHEN r.tipo = 'SALIDA' THEN 1 ELSE 0 END) as salidas
           FROM registros_entrada_salida r
           WHERE DATE(r.fecha_hora) BETWEEN ? AND ?
           GROUP BY DATE(r.fecha_hora)
           ORDER BY fecha ASC`,
          [startDateStr, endDateStr]
        );
        data = weeklyData;
        headers = ['Fecha', 'Total Accesos', 'Entradas', 'Salidas'];
        filename = `reporte_semanal_${startDateStr}_${endDateStr}`;
        break;
        
      case 'visitors':
        let visitorQuery = `
          SELECT 
            v.fecha_inicio,
            v.fecha_fin,
            v.estado,
            v.motivo_visita,
            p.nombre as persona_nombre,
            p.documento
          FROM Visitantes v
          INNER JOIN Personas p ON v.id_persona = p.id_persona
          WHERE 1=1
        `;
        const visitorParams = [];
        
        if (desde) {
          visitorQuery += ' AND DATE(v.fecha_inicio) >= ?';
          visitorParams.push(desde);
        }
        if (hasta) {
          visitorQuery += ' AND DATE(v.fecha_inicio) <= ?';
          visitorParams.push(hasta);
        }
        visitorQuery += ' ORDER BY v.fecha_inicio DESC';
        
        const [visitorData] = await pool.execute(visitorQuery, visitorParams);
        data = visitorData;
        headers = ['Fecha Inicio', 'Fecha Fin', 'Estado', 'Motivo Visita', 'Persona', 'Documento'];
        filename = `reporte_visitantes_${desde || 'inicio'}_${hasta || 'actual'}`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        });
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay datos para exportar'
      });
    }

    // Convertir a CSV
    const csvRows = [
      headers.join(','),
      ...data.map(row => {
        const values = headers.map(header => {
          // Mapear headers a campos de row
          let value = '';
          if (header === 'Fecha' || header === 'Fecha Inicio') {
            value = row.fecha || row.fecha_inicio || '';
          } else if (header === 'Fecha Fin') {
            value = row.fecha_fin || '';
          } else if (header === 'Tipo') {
            value = row.tipo_acceso || '';
          } else if (header === 'Persona') {
            value = row.persona_nombre || '';
          } else if (header === 'Documento') {
            value = row.documento || '';
          } else if (header === 'Rol') {
            value = row.rol || '';
          } else if (header === 'Registrado Por') {
            value = row.registrado_por || 'Sistema';
          } else if (header === 'Total Accesos') {
            value = row.total_accesos || 0;
          } else if (header === 'Entradas') {
            value = row.entradas || 0;
          } else if (header === 'Salidas') {
            value = row.salidas || 0;
          } else if (header === 'Estado') {
            value = row.estado || '';
          } else if (header === 'Motivo Visita') {
            value = row.motivo_visita || '';
          }
          
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        return values.join(',');
      })
    ];

    const csv = csvRows.join('\n');
    const BOM = '\uFEFF'; // Para Excel UTF-8

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(BOM + csv);
  } catch (error) {
    console.error('Error en exportReportCSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

