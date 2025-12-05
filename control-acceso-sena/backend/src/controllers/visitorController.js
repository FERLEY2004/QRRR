// Visitor Controller
import pool from '../utils/dbPool.js';
import { generateQRCode } from '../utils/qrGenerator.js';
import Access from '../models/Access.js';
import Person from '../models/Person.js';

export const createVisitor = async (req, res) => {
  try {
    const { nombre, documento, tipo_documento, motivo_visita, zona_destino, contacto, persona_visita } = req.body;
    const userId = req.user.id;

    if (!nombre || !documento || !motivo_visita) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, documento y motivo de visita son requeridos'
      });
    }

    const nombreCompleto = nombre.trim();
    const nameParts = nombreCompleto.split(' ').filter(Boolean);
    const nombresValue = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nombreCompleto || 'Visitante';
    const apellidosValue = nameParts.length > 1 ? nameParts.slice(-1).join(' ') : 'Visitante';

    const [rolRows] = await pool.execute(
      "SELECT id_rol FROM roles WHERE nombre_rol = 'VISITANTE' LIMIT 1"
    );
    const visitanteRolId = rolRows.length > 0 ? rolRows[0].id_rol : null;
    if (!visitanteRolId) {
      return res.status(500).json({
        success: false,
        message: 'No se encontró el rol de visitante en la base de datos'
      });
    }

    // Verificar si la persona ya existe
    const [existingPerson] = await pool.execute(
      'SELECT id_persona FROM personas WHERE documento = ? AND tipo_documento = ?',
      [documento, tipo_documento || 'CC']
    );

    let personId;
    
    if (existingPerson.length > 0) {
      personId = existingPerson[0].id_persona;
      // Actualizar estado
      await pool.execute(
        `UPDATE personas SET estado = 'ACTIVO', nombres = ?, apellidos = ?, id_rol = ? WHERE id_persona = ?`,
        [nombresValue, apellidosValue, visitanteRolId, personId]
      );
    } else {
      // Crear nuevo registro de visitante en la tabla Personas
      const [result] = await pool.execute(
        `INSERT INTO personas (nombres, apellidos, documento, tipo_documento, id_rol, estado, fecha_registro)
         VALUES (?, ?, ?, ?, ?, 'ACTIVO', NOW())`,
        [nombresValue, apellidosValue, documento, tipo_documento || 'CC', visitanteRolId]
      );
      personId = result.insertId;
    }

    // Crear registro en tabla Visitantes
    const [visitorResult] = await pool.execute(
      `INSERT INTO visitantes (id_persona, motivo_visita, zona_destino, contacto, persona_visita, estado, fecha_inicio)
       VALUES (?, ?, ?, ?, ?, 'ACTIVO', NOW())`,
      [personId, motivo_visita, zona_destino || null, contacto || null, persona_visita || null]
    );

    const visitorId = visitorResult.insertId;

    // Generar QR temporal (válido por 24 horas)
    const qrData = {
      type: 'visitor',
      id: personId,
      documento,
      nombre,
      rol: 'visitante',
      timestamp: new Date().toISOString()
    };

    const qrCode = await generateQRCode(JSON.stringify(qrData));

    // Registrar entrada automática del visitante al generar el QR
    // Solo si no está ya dentro del centro
    const isInside = await Person.isInside(personId);
    if (!isInside) {
      try {
        await Access.registerEntry(personId, userId);
        console.log(`✅ Entrada automática registrada para visitante ${documento} (${nombre})`);
      } catch (error) {
        console.error('Error al registrar entrada automática del visitante:', error);
        // No fallar la creación del visitante si hay error al registrar entrada
      }
    }

    res.status(201).json({
      success: true,
      message: 'Visitante registrado exitosamente',
      visitor: {
        id: personId,
        visitor_id: visitorId,
        nombre,
        documento,
        tipo_documento: tipo_documento || 'CC',
        motivo_visita,
        zona_destino,
        contacto,
        persona_visita
      },
      qrCode,
      qrData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      entradaRegistrada: !isInside
    });
  } catch (error) {
    console.error('Error en createVisitor:', error);
    
    // Manejar error de documento duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una persona con este documento'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar visitante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getVisitors = async (req, res) => {
  try {
    const { estado, search } = req.query;
    
    let query = `SELECT p.*, COALESCE(role.nombre_rol, 'sin rol') as nombre_rol
                 FROM personas p
                 LEFT JOIN roles role ON p.id_rol = role.id_rol
                 WHERE role.nombre_rol = 'VISITANTE'`;
    
    const params = [];

    if (estado) {
      query += ' AND p.estado = ?';
      params.push(estado);
    }

    if (search) {
      query += ' AND (CONCAT(p.nombres, \' \', p.apellidos) LIKE ? OR p.documento LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.fecha_registro DESC LIMIT 100';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      count: rows.length,
      visitors: rows
    });
  } catch (error) {
    console.error('Error en getVisitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener visitantes'
    });
  }
};

export const generateVisitorQR = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT * FROM personas WHERE id_persona = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }

    const visitor = rows[0];
    const nombreCompleto = `${visitor.nombres || ''} ${visitor.apellidos || ''}`.trim() || 'Visitante';

    const qrData = {
      type: 'visitor',
      id: visitor.id_persona,
      documento: visitor.documento,
      nombre: nombreCompleto,
      rol: 'visitante',
      timestamp: new Date().toISOString()
    };

    const qrCode = await generateQRCode(JSON.stringify(qrData));

    // Registrar entrada automática si el visitante no está dentro
    const isInside = await Person.isInside(visitor.id_persona);
    let entradaRegistrada = false;
    if (!isInside) {
      try {
        await Access.registerEntry(visitor.id_persona, userId);
        entradaRegistrada = true;
        console.log(`✅ Entrada automática registrada para visitante ${visitor.documento} al regenerar QR`);
      } catch (error) {
        console.error('Error al registrar entrada automática del visitante:', error);
      }
    }

    res.json({
      success: true,
      qrCode,
      qrData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      entradaRegistrada,
      yaDentro: isInside
    });
  } catch (error) {
    console.error('Error en generateVisitorQR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar QR'
    });
  }
};
