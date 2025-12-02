// Search Controller - Controlador de búsqueda avanzada
import { SearchService } from '../services/SearchService.js';
import { createSecurityLog } from './auditController.js';

/**
 * HU26 - Búsqueda avanzada de usuarios
 */
export const searchUsers = async (req, res) => {
  try {
    const filters = {
      query: req.query.q || req.query.query,
      documento: req.query.documento,
      nombre: req.query.nombre,
      rol: req.query.role || req.query.rol,
      estado: req.query.estado,
      email: req.query.email,
      programa: req.query.programa,
      ficha: req.query.ficha
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await SearchService.searchUsers(filters, pagination);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Búsqueda de usuarios',
      detalles: { filters, pagination },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * HU12 - Búsqueda de accesos por documento y fecha
 */
export const searchAccess = async (req, res) => {
  try {
    const filters = {
      documento: req.query.documento,
      fecha: req.query.fecha,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      rol: req.query.rol,
      tipo_acceso: req.query.tipo_acceso
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await SearchService.searchAccess(filters, pagination);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Búsqueda de accesos',
      detalles: { filters, pagination },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en searchAccess:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar accesos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * HU33 - Búsqueda de visitantes
 */
export const searchVisitors = async (req, res) => {
  try {
    const filters = {
      empresa: req.query.empresa,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      documento: req.query.documento,
      nombre: req.query.nombre
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await SearchService.searchVisitors(filters, pagination);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Búsqueda de visitantes',
      detalles: { filters, pagination },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en searchVisitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar visitantes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener personas con ficha y programa (vista sin redundancias)
 */
export const getPeopleWithFicha = async (req, res) => {
  try {
    const filters = {
      documento: req.query.documento,
      nombre: req.query.nombre,
      rol: req.query.rol,
      ficha: req.query.ficha,
      programa: req.query.programa
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await SearchService.getPeopleWithFicha(filters, pagination);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de personas con ficha y programa',
      detalles: { filters, pagination },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getPeopleWithFicha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener personas con ficha y programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};










