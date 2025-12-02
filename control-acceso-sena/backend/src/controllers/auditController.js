// Audit Controller - Controlador de auditoría
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

// Crear log de auditoría
export const createAuditLog = async (logData) => {
  const {
    tabla_afectada,
    id_registro,
    accion,
    datos_anteriores = null,
    datos_nuevos = null,
    id_usuario = null,
    ip_address = null
  } = logData;

  try {
    await pool.execute(
      `INSERT INTO Auditoria 
       (tabla_afectada, id_registro, accion, datos_anteriores, datos_nuevos, id_usuario, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tabla_afectada,
        id_registro,
        accion,
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos ? JSON.stringify(datos_nuevos) : null,
        id_usuario,
        ip_address
      ]
    );
  } catch (error) {
    console.error('Error creando log de auditoría:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

// Crear log de seguridad
export const createSecurityLog = async (logData) => {
  const {
    tipo,
    id_usuario = null,
    ip_address = null,
    user_agent = null,
    accion,
    detalles = null,
    exito = true
  } = logData;

  try {
    await pool.execute(
      `INSERT INTO Logs_Seguridad 
       (tipo, id_usuario, ip_address, user_agent, accion, detalles, exito)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo,
        id_usuario,
        ip_address,
        user_agent,
        accion,
        detalles ? JSON.stringify(detalles) : null,
        exito
      ]
    );
  } catch (error) {
    console.error('Error creando log de seguridad:', error);
  }
};

// Obtener logs de auditoría
export const getAuditLogs = async (req, res) => {
  try {
    const {
      tabla_afectada = null,
      accion = null,
      id_usuario = null,
      desde = null,
      hasta = null,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        a.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM Auditoria a
      LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (tabla_afectada) {
      query += ' AND a.tabla_afectada = ?';
      params.push(tabla_afectada);
    }

    if (accion) {
      query += ' AND a.accion = ?';
      params.push(accion);
    }

    if (id_usuario) {
      query += ' AND a.id_usuario = ?';
      params.push(id_usuario);
    }

    if (desde) {
      query += ' AND a.fecha >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND a.fecha <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY a.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);

    const logs = rows.map(row => ({
      ...row,
      datos_anteriores: row.datos_anteriores ? JSON.parse(row.datos_anteriores) : null,
      datos_nuevos: row.datos_nuevos ? JSON.parse(row.datos_nuevos) : null
    }));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error en getAuditLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener logs de seguridad
export const getSecurityLogs = async (req, res) => {
  try {
    const {
      tipo = null,
      id_usuario = null,
      ip_address = null,
      exito = null,
      desde = null,
      hasta = null,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        ls.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM Logs_Seguridad ls
      LEFT JOIN Usuarios u ON ls.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      query += ' AND ls.tipo = ?';
      params.push(tipo);
    }

    if (id_usuario) {
      query += ' AND ls.id_usuario = ?';
      params.push(id_usuario);
    }

    if (ip_address) {
      query += ' AND ls.ip_address = ?';
      params.push(ip_address);
    }

    if (exito !== null) {
      query += ' AND ls.exito = ?';
      params.push(exito === 'true');
    }

    if (desde) {
      query += ' AND ls.fecha >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND ls.fecha <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY ls.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);

    const logs = rows.map(row => ({
      ...row,
      detalles: row.detalles ? JSON.parse(row.detalles) : null
    }));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error en getSecurityLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de seguridad',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener historial completo de accesos
export const getAccessHistory = async (req, res) => {
  try {
    const {
      id_persona = null,
      desde = null,
      hasta = null,
      tipo_acceso = null,
      limit = 100,
      offset = 0
    } = req.query;

    const idColumn = await getRegistroIdField();
    const fullNameExpr = "CONCAT(p.nombres, ' ', p.apellidos)";
    let query = `
      SELECT 
        r.${idColumn},
        r.tipo,
        r.fecha_hora,
        r.id_persona,
        NULL as id_usuario,
        COALESCE(
          CONCAT(p.nombres, ' ', p.apellidos),
          p.nombres,
          p.apellidos,
          'Sin nombre'
        ) as persona_nombre,
        p.documento,
        COALESCE(p.rol, 'sin rol') as rol,
        'Sistema' as usuario_registro_nombre
      FROM registros_entrada_salida r
      INNER JOIN Personas p ON r.id_persona = p.id_persona
      WHERE 1=1
    `;
    const params = [];

    if (id_persona) {
      query += ' AND r.id_persona = ?';
      params.push(id_persona);
    }

    if (desde) {
      query += ' AND DATE(r.fecha_hora) >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND DATE(r.fecha_hora) <= ?';
      params.push(hasta);
    }

    if (tipo_acceso) {
      query += ' AND r.tipo = ?';
      params.push(tipo_acceso);
    }

    query += ' ORDER BY r.fecha_hora DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en getAccessHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de accesos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};














