// Search Service - Servicio de búsqueda avanzada
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

export class SearchService {
  /**
   * HU26 - Búsqueda avanzada de usuarios
   */
  static async searchUsers(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.id_persona,
          p.documento,
          p.tipo_documento,
          COALESCE(
            CONCAT(p.nombres, ' ', p.apellidos),
            p.nombres,
            p.apellidos,
            'Sin nombre'
          ) as nombre_completo,
          p.email,
          p.telefono,
          COALESCE(role.nombre_rol, 'sin rol') as nombre_rol,
          p.estado,
          p.fecha_registro,
          f.codigo_ficha as ficha,
          pf.nombre_programa as programa,
          (
            SELECT MAX(r.fecha_hora)
            FROM registros_entrada_salida r
            WHERE r.id_persona = p.id_persona
          ) as ultimo_acceso
        FROM Personas p
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE 1=1
      `;

      const params = [];
      const fullNameExpr = "CONCAT(p.nombres, ' ', p.apellidos)";

      // Búsqueda por texto (query general)
      if (filters.query) {
        query += ` AND (
          p.documento LIKE ? OR
          ${fullNameExpr} LIKE ? OR
          p.email LIKE ?
        )`;
        const searchTerm = `%${filters.query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Filtros específicos
      if (filters.documento) {
        query += ` AND p.documento LIKE ?`;
        params.push(`%${filters.documento}%`);
      }

      if (filters.nombre) {
        query += ` AND ${fullNameExpr} LIKE ?`;
        params.push(`%${filters.nombre}%`);
      }

      if (filters.rol) {
        query += ` AND role.nombre_rol = ?`;
        params.push(filters.rol.toUpperCase());
      }

      if (filters.estado) {
        query += ` AND p.estado = ?`;
        params.push(filters.estado);
      }

      if (filters.email) {
        query += ` AND p.email LIKE ?`;
        params.push(`%${filters.email}%`);
      }

      if (filters.programa) {
        query += ` AND pf.nombre_programa LIKE ?`;
        params.push(`%${filters.programa}%`);
      }
      
      if (filters.ficha) {
        query += ` AND f.codigo_ficha LIKE ?`;
        params.push(`%${filters.ficha}%`);
      }

      // Contar total para paginación (crear consulta COUNT separada sin subconsultas)
      let countQuery = `
        SELECT COUNT(*) as total
        FROM Personas p
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE 1=1
      `;
      const countParams = [];
      
      // Aplicar los mismos filtros al COUNT
      if (filters.query) {
        countQuery += ` AND (
          p.documento LIKE ? OR
          ${fullNameExpr} LIKE ? OR
          p.email LIKE ?
        )`;
        const searchTerm = `%${filters.query}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.documento) {
        countQuery += ` AND p.documento LIKE ?`;
        countParams.push(`%${filters.documento}%`);
      }
      
      if (filters.nombre) {
        countQuery += ` AND ${fullNameExpr} LIKE ?`;
        countParams.push(`%${filters.nombre}%`);
      }
      
      if (filters.rol) {
        countQuery += ` AND role.nombre_rol = ?`;
        countParams.push(filters.rol.toUpperCase());
      }
      
      if (filters.estado) {
        countQuery += ` AND p.estado = ?`;
        countParams.push(filters.estado);
      }
      
      if (filters.email) {
        countQuery += ` AND p.email LIKE ?`;
        countParams.push(`%${filters.email}%`);
      }
      
      if (filters.programa) {
        countQuery += ` AND pf.nombre_programa LIKE ?`;
        countParams.push(`%${filters.programa}%`);
      }
      
      if (filters.ficha) {
        countQuery += ` AND f.codigo_ficha LIKE ?`;
        countParams.push(`%${filters.ficha}%`);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0]?.total || 0;

      // Agregar ordenamiento y paginación (usar interpolación segura ya que limit y offset están validados)
      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);
      query += ` ORDER BY p.fecha_registro DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows.map(row => ({
          id_persona: row.id_persona,
          documento: row.documento,
          tipo_documento: row.tipo_documento,
          nombre_completo: row.nombre_completo,
          email: row.email,
          telefono: row.telefono,
          rol: row.nombre_rol,
          estado: row.estado,
          fecha_registro: row.fecha_registro,
          ultimo_acceso: row.ultimo_acceso,
          ficha: row.ficha || null,
          programa: row.programa || null
        })),
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        },
        filters: filters
      };
    } catch (error) {
      console.error('Error en searchUsers:', error);
      throw error;
    }
  }

  /**
   * HU12 - Búsqueda de accesos por documento y fecha
   */
  static async searchAccess(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;

      const idColumn = await getRegistroIdField();

      let query = `
        SELECT 
          r.${idColumn} as id_acceso,
          p.documento,
          p.tipo_documento,
          COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombre) as nombre_completo,
          COALESCE(role.nombre_rol, 'sin rol') as nombre_rol,
          r.tipo as tipo_acceso,
          r.fecha_hora as fecha_entrada,
          NULL as fecha_salida,
          TIMESTAMPDIFF(MINUTE, r.fecha_hora, NOW()) as duracion_minutos,
          CASE WHEN r.tipo = 'ENTRADA' THEN 'activo' ELSE 'finalizado' END as estado,
          u.nombre as registrado_por
        FROM registros_entrada_salida r
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        LEFT JOIN Usuarios u ON r.id_usuario_registro = u.id_usuario
        WHERE 1=1
      `;

      const params = [];

      if (filters.documento) {
        query += ` AND p.documento = ?`;
        params.push(filters.documento);
      }

      if (filters.fecha) {
        query += ` AND DATE(r.fecha_hora) = ?`;
        params.push(filters.fecha);
      }

      if (filters.fecha_desde) {
        query += ` AND DATE(r.fecha_hora) >= ?`;
        params.push(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        query += ` AND DATE(r.fecha_hora) <= ?`;
        params.push(filters.fecha_hasta);
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
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Agregar ordenamiento y paginación
      query += ` ORDER BY r.fecha_hora DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows.map(row => ({
          id_acceso: row.id_acceso,
          documento: row.documento,
          tipo_documento: row.tipo_documento,
          nombre_completo: row.nombre_completo,
          rol: row.nombre_rol || row.rol,
          tipo_acceso: row.tipo_acceso,
          fecha_entrada: row.fecha_entrada,
          fecha_salida: row.fecha_salida,
          duracion_minutos: row.duracion_minutos,
          estado: row.estado,
          registrado_por: row.registrado_por
        })),
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        },
        filters: filters
      };
    } catch (error) {
      console.error('Error en searchAccess:', error);
      throw error;
    }
  }

  /**
   * Obtener personas junto a su ficha y programa sin tocar el esquema (vista normalizada)
   */
  static async getPeopleWithFicha(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;

      let query = `
        SELECT
          id_persona,
          documento,
          tipo_documento,
          nombre_completo,
          nombres,
          apellidos,
          email,
          telefono,
          rh,
          nombre_rol,
          rol_descripcion,
          id_ficha,
          codigo_ficha,
          codigo_programa,
          nombre_programa,
          jornada,
          cargo,
          tipo_contrato,
          codigo_qr,
          foto,
          estado,
          fecha_registro
        FROM v_personas_completo
        WHERE 1=1
      `;

      const params = [];

      if (filters.documento) {
        query += ` AND documento LIKE ?`;
        params.push(`%${filters.documento}%`);
      }

      if (filters.nombre) {
        query += ` AND (
          nombre_completo LIKE ? OR
          nombres LIKE ? OR
          apellidos LIKE ?
        )`;
        const searchTerm = `%${filters.nombre}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.rol) {
        query += ` AND nombre_rol = ?`;
        params.push(filters.rol.toUpperCase());
      }

      if (filters.ficha) {
        query += ` AND codigo_ficha LIKE ?`;
        params.push(`%${filters.ficha}%`);
      }

      if (filters.programa) {
        query += ` AND (
          nombre_programa LIKE ? OR
          codigo_programa LIKE ?
        )`;
        const searchTerm = `%${filters.programa}%`;
        params.push(searchTerm, searchTerm);
      }

      let countQuery = `
        SELECT COUNT(*) as total
        FROM v_personas_completo
        WHERE 1=1
      `;
      const countParams = [];

      if (filters.documento) {
        countQuery += ` AND documento LIKE ?`;
        countParams.push(`%${filters.documento}%`);
      }

      if (filters.nombre) {
        countQuery += ` AND (
          nombre_completo LIKE ? OR
          nombres LIKE ? OR
          apellidos LIKE ?
        )`;
        const searchTerm = `%${filters.nombre}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.rol) {
        countQuery += ` AND nombre_rol = ?`;
        countParams.push(filters.rol.toUpperCase());
      }

      if (filters.ficha) {
        countQuery += ` AND codigo_ficha LIKE ?`;
        countParams.push(`%${filters.ficha}%`);
      }

      if (filters.programa) {
        countQuery += ` AND (
          nombre_programa LIKE ? OR
          codigo_programa LIKE ?
        )`;
        const searchTerm = `%${filters.programa}%`;
        countParams.push(searchTerm, searchTerm);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0]?.total || 0;

      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);
      query += ` ORDER BY fecha_registro DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows.map(row => ({
          id_persona: row.id_persona,
          documento: row.documento,
          tipo_documento: row.tipo_documento,
          nombre_completo: row.nombre_completo,
          nombres: row.nombres,
          apellidos: row.apellidos,
          email: row.email,
          telefono: row.telefono,
          rh: row.rh,
          rol: row.nombre_rol,
          rol_descripcion: row.rol_descripcion,
          id_ficha: row.id_ficha,
          ficha_persona: row.codigo_ficha,
          programa_formacion_persona: row.codigo_programa,
          nombre_programa: row.nombre_programa,
          jornada: row.jornada,
          cargo: row.cargo,
          tipo_contrato: row.tipo_contrato,
          codigo_qr: row.codigo_qr,
          foto: row.foto,
          estado: row.estado,
          fecha_registro: row.fecha_registro
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        filters
      };
    } catch (error) {
      console.error('Error en getPeopleWithFicha:', error);
      throw error;
    }
  }

  /**
   * HU33 - Búsqueda de visitantes
   */
  static async searchVisitors(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          v.id_visitante,
          p.documento,
          p.tipo_documento,
          p.nombre as nombre_completo,
          v.motivo_visita,
          v.contacto,
          v.persona_visita,
          v.fecha_inicio,
          v.fecha_fin,
          v.estado,
          CASE 
            WHEN v.fecha_fin IS NULL AND v.estado = 'activo' THEN 'Dentro'
            WHEN v.estado = 'finalizado' THEN 'Finalizado'
            WHEN v.estado = 'expirado' THEN 'Expirado'
            ELSE 'Inactivo'
          END as estado_visita
        FROM Visitantes v
        INNER JOIN Personas p ON v.id_persona = p.id_persona
        WHERE 1=1
      `;

      const params = [];

      if (filters.empresa) {
        query += ` AND v.contacto LIKE ?`;
        params.push(`%${filters.empresa}%`);
      }

      if (filters.estado) {
        query += ` AND v.estado = ?`;
        params.push(filters.estado);
      }

      if (filters.fecha_desde) {
        query += ` AND DATE(v.fecha_inicio) >= ?`;
        params.push(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        query += ` AND DATE(v.fecha_inicio) <= ?`;
        params.push(filters.fecha_hasta);
      }

      if (filters.documento) {
        query += ` AND p.documento LIKE ?`;
        params.push(`%${filters.documento}%`);
      }

      if (filters.nombre) {
        query += ` AND p.nombre LIKE ?`;
        params.push(`%${filters.nombre}%`);
      }

      // Contar total para paginación
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Agregar ordenamiento y paginación
      query += ` ORDER BY v.fecha_inicio DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows.map(row => ({
          id_visitante: row.id_visitante,
          documento: row.documento,
          tipo_documento: row.tipo_documento,
          nombre_completo: row.nombre_completo,
          motivo_visita: row.motivo_visita,
          contacto: row.contacto,
          persona_visita: row.persona_visita,
          fecha_inicio: row.fecha_inicio,
          fecha_fin: row.fecha_fin,
          estado: row.estado,
          estado_visita: row.estado_visita
        })),
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        },
        filters: filters
      };
    } catch (error) {
      console.error('Error en searchVisitors:', error);
      throw error;
    }
  }
}




