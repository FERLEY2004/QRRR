// Reports Controller - Controlador de reportes
import { ReportService } from '../services/ReportService.js';
import { CatalogService } from '../services/CatalogService.js';
import { createSecurityLog } from './auditController.js';

/**
 * HU9 - Obtener personas actualmente dentro
 */
export const getCurrentPeople = async (req, res) => {
  try {
    const filters = {
      rol: req.query.rol,
      zona: req.query.zona
    };

    const result = await ReportService.getCurrentPeople(filters);

    // Log de seguridad
    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de personas actualmente dentro',
      detalles: { filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getCurrentPeople:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener personas dentro',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * HU7 - Flujos predictivos
 */
export const getPredictiveFlows = async (req, res) => {
  try {
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      dias: parseInt(req.query.dias) || 7
    };

    const result = await ReportService.getPredictiveFlows(filters);

    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de flujos predictivos',
      detalles: { filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getPredictiveFlows:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener flujos predictivos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Accesos por programa específico
 */
export const getAccessByProgram = async (req, res) => {
  try {
    const { codigo } = req.params;
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const result = await ReportService.getAccessByProgram(codigo, filters);

    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Reporte de accesos por programa: ${codigo}`,
      detalles: { codigo, filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getAccessByProgram:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener accesos por programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Historial de accesos con filtros avanzados
 */
export const getAccessHistory = async (req, res) => {
  try {
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      documento: req.query.documento,
      rol: req.query.rol,
      tipo_acceso: req.query.tipo_acceso
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await ReportService.getAccessHistory(filters, pagination);

    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de historial de accesos',
      detalles: { filters, pagination },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getAccessHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de accesos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

