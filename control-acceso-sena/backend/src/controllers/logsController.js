// Logs Controller - Controlador para logs de seguridad y auditoría
import LogService from '../services/LogService.js';

export const getLogsSeguridad = async (req, res) => {
  try {
    const { tipo, id_usuario, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (tipo) filters.tipo = tipo;
    if (id_usuario) filters.id_usuario = parseInt(id_usuario, 10);
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;

    const result = await LogService.getLogsSeguridad(filters, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo logs de seguridad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de seguridad'
    });
  }
};

export const getAuditoria = async (req, res) => {
  try {
    const { tabla, accion, id_usuario, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (tabla) filters.tabla = tabla;
    if (accion) filters.accion = accion;
    if (id_usuario) filters.id_usuario = parseInt(id_usuario, 10);
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;

    const result = await LogService.getAuditoria(filters, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de auditoría'
    });
  }
};

export const getLogStats = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    
    // Estadísticas de logs de seguridad
    const logsResult = await LogService.getLogsSeguridad(
      { fecha_desde, fecha_hasta },
      { page: 1, limit: 1000 }
    );

    const logs = logsResult.data || [];
    
    // Contar por tipo
    const porTipo = logs.reduce((acc, log) => {
      acc[log.tipo] = (acc[log.tipo] || 0) + 1;
      return acc;
    }, {});

    // Logins exitosos vs fallidos
    const loginsExitosos = porTipo['login_exitoso'] || 0;
    const loginsFallidos = porTipo['login_fallido'] || 0;

    // Auditoría
    const auditoriaResult = await LogService.getAuditoria(
      { fecha_desde, fecha_hasta },
      { page: 1, limit: 1000 }
    );

    const auditoria = auditoriaResult.data || [];
    
    // Contar por acción
    const porAccion = auditoria.reduce((acc, item) => {
      acc[item.accion] = (acc[item.accion] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalLogs: logsResult.pagination?.total || logs.length,
        totalAuditoria: auditoriaResult.pagination?.total || auditoria.length,
        loginsExitosos,
        loginsFallidos,
        porTipo: Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad })),
        porAccion: Object.entries(porAccion).map(([accion, cantidad]) => ({ accion, cantidad }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};


