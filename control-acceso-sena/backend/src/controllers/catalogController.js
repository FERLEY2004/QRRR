// Catalog Controller - Controlador de catálogo
import { CatalogService } from '../services/CatalogService.js';
import { createSecurityLog } from './auditController.js';

/**
 * Obtener todos los programas
 */
export const getAllPrograms = async (req, res) => {
  try {
    const filters = {
      nivel: req.query.nivel,
      area: req.query.area,
      estado: req.query.estado,
      search: req.query.search
    };

    const result = await CatalogService.getAllPrograms(filters);

    // Intentar crear log de seguridad, pero no fallar si hay error
    try {
      await createSecurityLog({
        tipo: 'operacion_admin',
        id_usuario: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        accion: 'Consulta de catálogo de programas',
        detalles: { filters },
        exito: true
      });
    } catch (logError) {
      console.warn('Error creando log de seguridad (no crítico):', logError.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAllPrograms:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener programas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        errno: error.errno
      } : undefined
    });
  }
};

/**
 * Crear un nuevo programa de formación
 */
export const createProgram = async (req, res) => {
  try {
    const payload = {
      codigo_programa: typeof req.body.codigo_programa === 'string'
        ? req.body.codigo_programa.trim().toUpperCase()
        : null,
      nombre_programa: req.body.nombre_programa,
      nivel: req.body.nivel,
      area_conocimiento: req.body.area_conocimiento,
      duracion_meses: req.body.duracion_meses,
      descripcion: req.body.descripcion,
      estado: req.body.estado || 'activo'
    };

    const result = await CatalogService.createProgram(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }

    try {
      await createSecurityLog({
        tipo: 'operacion_admin',
        id_usuario: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        accion: 'Creación manual de programa de formación',
        detalles: { payload, programId: result.data.id_programa },
        exito: true
      });
    } catch (logError) {
      console.warn('Error creando log de seguridad (no crítico):', logError.message);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createProgram:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener programa por código
 */
export const getProgramByCode = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await CatalogService.getProgramByCode(codigo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getProgramByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener todas las fichas
 */
export const getAllFichas = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      jornada: req.query.jornada,
      programa: req.query.programa,
      search: req.query.search
    };

    const result = await CatalogService.getAllFichas(filters);

    // Intentar crear log de seguridad, pero no fallar si hay error
    try {
      await createSecurityLog({
        tipo: 'operacion_admin',
        id_usuario: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        accion: 'Consulta de catálogo de fichas',
        detalles: { filters },
        exito: true
      });
    } catch (logError) {
      console.warn('Error creando log de seguridad (no crítico):', logError.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAllFichas:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener fichas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        errno: error.errno
      } : undefined
    });
  }
};

/**
 * Obtener ficha por código
 */
export const getFichaByCode = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await CatalogService.getFichaByCode(codigo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getFichaByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ficha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener aprendices por ficha
 */
export const getStudentsByFicha = async (req, res) => {
  try {
    const { codigo } = req.params;
    const filters = {
      estado: req.query.estado
    };

    const result = await CatalogService.getStudentsByFicha(codigo, filters);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Consulta de aprendices por ficha: ${codigo}`,
      detalles: { codigo, filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getStudentsByFicha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener aprendices por ficha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener todos los ambientes
 */
export const getAllAmbientes = async (req, res) => {
  try {
    const filters = {
      tipo: req.query.tipo,
      bloque: req.query.bloque,
      estado: req.query.estado,
      search: req.query.search
    };

    const result = await CatalogService.getAllAmbientes(filters);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: 'Consulta de catálogo de ambientes',
      detalles: { filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getAllAmbientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ambientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener ambiente por código
 */
export const getAmbienteByCode = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await CatalogService.getAmbienteByCode(codigo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAmbienteByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ambiente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener ambientes por tipo
 */
export const getAmbientesByType = async (req, res) => {
  try {
    const { tipo } = req.params;
    const result = await CatalogService.getAmbientesByType(tipo);

    res.json(result);
  } catch (error) {
    console.error('Error en getAmbientesByType:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ambientes por tipo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener aprendices por programa
 */
export const getStudentsByProgram = async (req, res) => {
  try {
    const { codigo } = req.params;
    const filters = {
      estado: req.query.estado,
      ficha: req.query.ficha
    };

    const result = await CatalogService.getStudentsByProgram(codigo, filters);

    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Consulta de aprendices por programa: ${codigo}`,
      detalles: { codigo, filters },
      exito: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error en getStudentsByProgram:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener aprendices por programa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener ocupación de ambiente
 */
export const getAmbientOccupation = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await CatalogService.getAmbientOccupation(codigo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAmbientOccupation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ocupación del ambiente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener accesos por programa
 */
export const getAccessByProgram = async (req, res) => {
  try {
    const { codigo } = req.params;
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const result = await CatalogService.getAccessByProgram(codigo, filters);

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
 * Obtener accesos por ficha
 */
export const getAccessByFicha = async (req, res) => {
  try {
    const { codigo } = req.params;
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      tipo: req.query.tipo
    };

    const result = await CatalogService.getAccessByFicha(codigo, filters);

    if (!result.success) {
      return res.status(404).json(result);
    }

    try {
      await createSecurityLog({
        tipo: 'generacion_reporte',
        id_usuario: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        accion: `Reporte de accesos por ficha: ${codigo}`,
        detalles: { codigo, filters },
        exito: true
      });
    } catch (logError) {
      console.warn('Error creando log de seguridad (no crítico):', logError.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getAccessByFicha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener accesos por ficha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createFicha = async (req, res) => {
  try {
    const payload = {
      codigo_ficha: req.body.codigo_ficha,
      codigo_programa: req.body.codigo_programa,
      jornada: req.body.jornada,
      fecha_inicio: req.body.fecha_inicio,
      fecha_fin: req.body.fecha_fin,
      estado: req.body.estado,
      numero_aprendices: req.body.numero_aprendices,
      capacidad_maxima: req.body.capacidad_maxima
    };

    const result = await CatalogService.createFicha(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }

    try {
      await createSecurityLog({
        tipo: 'operacion_admin',
        id_usuario: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        accion: 'Creación manual de ficha',
        detalles: { payload, fichaId: result.data.id_ficha },
        exito: true
      });
    } catch (logError) {
      console.warn('Error creando log de seguridad (no crítico):', logError.message);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createFicha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ficha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




