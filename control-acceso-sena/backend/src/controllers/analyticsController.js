// Analytics Controller - Controlador de análisis en tiempo real
import { AnalyticsService } from '../services/AnalyticsService.js';
import { createSecurityLog } from './auditController.js';

/**
 * Ocupación actual por ambiente
 */
export const getCurrentOccupancy = async (req, res) => {
  try {
    const result = await AnalyticsService.getCurrentOccupancy();

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de ocupación actual',
      detalles: {},
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getCurrentOccupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ocupación actual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Estadísticas por ficha
 */
export const getStatsByFicha = async (req, res) => {
  try {
    const { ficha } = req.params;
    const result = await AnalyticsService.getStatsByFicha(ficha);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getStatsByFicha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por ficha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Estadísticas por programa
 */
export const getStatsByPrograma = async (req, res) => {
  try {
    const { programa } = req.params;
    const result = await AnalyticsService.getStatsByPrograma(programa);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getStatsByPrograma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Historial de asistencias de una persona
 */
export const getAttendanceHistory = async (req, res) => {
  try {
    const { documento } = req.params;
    const limit = parseInt(req.query.limit) || 30;

    const result = await AnalyticsService.getAttendanceHistory(documento, limit);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAttendanceHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de asistencias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Estadísticas diarias generales
 */
export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const result = await AnalyticsService.getDailyStats(date);

    res.json(result);
  } catch (error) {
    console.error('Error en getDailyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas diarias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};










