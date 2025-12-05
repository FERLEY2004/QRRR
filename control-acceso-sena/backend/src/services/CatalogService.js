// Catalog Service - Servicio de catálogo de programas y ambientes
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

export class CatalogService {
  /**
   * Obtener todos los programas de formación
   */
  static async getAllPrograms(filters = {}) {
    try {
      // Verificar si la tabla existe
      try {
        const [tableCheck] = await pool.execute(`
          SELECT COUNT(*) as exists_table
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Programas_Formacion'
        `);
        
        if (!tableCheck || tableCheck.length === 0 || tableCheck[0].exists_table === 0) {
          console.warn('⚠️  Tabla Programas_Formacion no existe');
          return {
            success: true,
            data: [],
            total: 0,
            message: 'La tabla Programas_Formacion no existe en la base de datos'
          };
        }
      } catch (checkError) {
        console.warn('⚠️  Error verificando existencia de tabla Programas_Formacion:', checkError.message);
      }

      let query = `
        SELECT 
          id_programa,
          codigo_programa,
          nombre_programa,
          nivel,
          duracion_meses,
          area_conocimiento,
          descripcion,
          estado,
          fecha_creacion
        FROM Programas_Formacion
        WHERE 1=1
      `;

      const params = [];

      if (filters.nivel && filters.nivel.trim() !== '') {
        query += ` AND nivel = ?`;
        params.push(filters.nivel);
      }

      if (filters.area && filters.area.trim() !== '') {
        // Búsqueda case-insensitive para área también
        query += ` AND LOWER(area_conocimiento) LIKE LOWER(?)`;
        params.push(`%${filters.area.trim()}%`);
      }

      if (filters.estado && filters.estado.trim() !== '') {
        query += ` AND estado = ?`;
        params.push(filters.estado);
      }

      if (filters.search && filters.search.trim() !== '') {
        // Búsqueda case-insensitive y flexible con acentos
        // Usar LOWER() y COLLATE para hacer la búsqueda más flexible
        // Esto permite encontrar "Analisis" cuando se busca "Análisis" y viceversa
        query += ` AND (
          LOWER(nombre_programa) COLLATE utf8mb4_unicode_ci LIKE LOWER(?) COLLATE utf8mb4_unicode_ci OR 
          codigo_programa LIKE ?
        )`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ` ORDER BY nivel, area_conocimiento, nombre_programa`;

      console.log('📝 Ejecutando consulta getAllPrograms:', query);
      console.log('📊 Parámetros:', params);
      
      const [rows] = await pool.execute(query, params);

      console.log(`✅ getAllPrograms: ${rows.length} programas encontrados`);

      return {
        success: true,
        data: rows || [],
        total: rows?.length || 0
      };
    } catch (error) {
      console.error('❌ Error en getAllPrograms:', error);
      console.error('❌ Código:', error.code);
      console.error('❌ SQL State:', error.sqlState);
      console.error('❌ Stack:', error.stack);
      
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 1146) {
        console.warn('⚠️  Tabla Programas_Formacion no existe, retornando array vacío');
        return {
          success: true,
          data: [],
          total: 0,
          message: 'La tabla Programas_Formacion no existe en la base de datos'
        };
      }
      
      throw error;
    }
  }

  /**
   * Obtener programa por código
   */
  static async getProgramByCode(codigo) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM Programas_Formacion WHERE codigo_programa = ?`,
        [codigo]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Programa no encontrado'
        };
      }

      return {
        success: true,
        data: rows[0]
      };
    } catch (error) {
      console.error('Error en getProgramByCode:', error);
      throw error;
    }
  }

  static async createProgram(data) {
    try {
      const {
        codigo_programa,
        nombre_programa,
        nivel = 'Técnico',
        area_conocimiento = null,
        duracion_meses = 12,
        descripcion = null,
        estado = 'activo'
      } = data;

      if (!codigo_programa || !nombre_programa) {
        return {
          success: false,
          message: 'Código y nombre del programa son obligatorios'
        };
      }

      const [result] = await pool.execute(
        `INSERT INTO programas_formacion 
         (codigo_programa, nombre_programa, nivel, duracion_meses, area_conocimiento, descripcion, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          codigo_programa,
          nombre_programa,
          nivel,
          duracion_meses,
          area_conocimiento,
          descripcion,
          estado
        ]
      );

      const [inserted] = await pool.execute(
        `SELECT * FROM programas_formacion WHERE id_programa = ?`,
        [result.insertId]
      );

      return {
        success: true,
        data: inserted[0]
      };
    } catch (error) {
      console.error('Error en createProgram:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          message: 'Ya existe un programa con ese código'
        };
      }
      throw error;
    }
  }

  /**
   * Obtener todas las fichas
   */
  static async getAllFichas(filters = {}) {
    try {
      console.log('🔍 [getAllFichas] Iniciando consulta con filtros:', filters);
      
      // Verificar si la tabla existe (case-insensitive)
      try {
        const [tableCheck] = await pool.execute(`
          SELECT COUNT(*) as exists_table
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) = 'fichas'
        `);
        
        if (!tableCheck || tableCheck.length === 0 || tableCheck[0].exists_table === 0) {
          console.warn('⚠️  [getAllFichas] Tabla fichas no existe');
          return {
            success: true,
            data: [],
            total: 0,
            message: 'La tabla fichas no existe en la base de datos'
          };
        }
        console.log('✅ [getAllFichas] Tabla fichas existe');
      } catch (checkError) {
        console.warn('⚠️  [getAllFichas] Error verificando existencia de tabla fichas:', checkError.message);
      }

      // Verificar si hay fichas en la tabla (usar backticks para manejar case)
      try {
        const [countCheck] = await pool.execute('SELECT COUNT(*) as total FROM `fichas`');
        const totalFichas = parseInt(countCheck[0]?.total) || 0;
        console.log(`📊 [getAllFichas] Total de fichas en la tabla: ${totalFichas}`);
        
        if (totalFichas === 0) {
          console.warn('⚠️  [getAllFichas] No hay fichas en la tabla');
          return {
            success: true,
            data: [],
            total: 0,
            message: 'No hay fichas registradas en la base de datos'
          };
        }
      } catch (countError) {
        console.warn('⚠️  [getAllFichas] Error contando fichas:', countError.message);
        // Continuar con la consulta principal aunque falle el conteo
      }

      let query = `
        SELECT 
          f.id_ficha,
          f.codigo_ficha,
          f.id_programa,
          f.jornada,
          f.fecha_inicio,
          f.fecha_fin,
          f.estado,
          f.numero_aprendices,
          f.capacidad_maxima,
          pf.codigo_programa,
          pf.nombre_programa,
          pf.nivel,
          pf.area_conocimiento,
          COALESCE((
            SELECT COUNT(*)
            FROM Personas p
            WHERE p.id_ficha = f.id_ficha
            AND (p.estado = 'activo' OR p.estado = 'ACTIVO' OR p.estado IS NULL)
          ), 0) as aprendices_activos
        FROM fichas f
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE 1=1
      `;

      const params = [];

      // Normalizar estado a minúsculas para comparación
      if (filters.estado && filters.estado.trim() !== '') {
        const estadoNormalizado = filters.estado.trim().toLowerCase();
        query += ` AND LOWER(f.estado) = ?`;
        params.push(estadoNormalizado);
        console.log(`📋 [getAllFichas] Filtro estado aplicado: ${estadoNormalizado}`);
      }

      if (filters.jornada && filters.jornada.trim() !== '') {
        const jornadaNormalizada = filters.jornada.trim().toLowerCase();
        query += ` AND LOWER(f.jornada) = ?`;
        params.push(jornadaNormalizada);
        console.log(`📋 [getAllFichas] Filtro jornada aplicado: ${jornadaNormalizada}`);
      }

      if (filters.programa && filters.programa.trim() !== '') {
        query += ` AND pf.nombre_programa LIKE ?`;
        const searchTerm = `%${filters.programa.trim()}%`;
        params.push(searchTerm);
        console.log(`📋 [getAllFichas] Filtro programa aplicado: ${searchTerm}`);
      }

      if (filters.search && filters.search.trim() !== '') {
        query += ` AND (f.codigo_ficha LIKE ? OR pf.nombre_programa LIKE ?)`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm);
        console.log(`📋 [getAllFichas] Filtro búsqueda aplicado: ${searchTerm}`);
      }

      query += ` ORDER BY f.fecha_inicio DESC, f.codigo_ficha`;

      console.log('📝 [getAllFichas] Consulta SQL:', query);
      console.log('📊 [getAllFichas] Parámetros:', params);
      
      const [rows] = await pool.execute(query, params);

      console.log(`✅ [getAllFichas] Consulta exitosa: ${rows.length} fichas encontradas`);
      
      if (rows.length > 0) {
        console.log('📋 [getAllFichas] Primera ficha:', JSON.stringify(rows[0], null, 2));
      }

      return {
        success: true,
        data: rows || [],
        total: rows?.length || 0
      };
    } catch (error) {
      console.error('❌ [getAllFichas] Error:', error);
      console.error('❌ [getAllFichas] Código:', error.code);
      console.error('❌ [getAllFichas] SQL State:', error.sqlState);
      console.error('❌ [getAllFichas] Mensaje:', error.message);
      console.error('❌ [getAllFichas] Stack:', error.stack);
      
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 1146) {
        console.warn('⚠️  [getAllFichas] Tabla Fichas no existe, retornando array vacío');
        return {
          success: true,
          data: [],
          total: 0,
          message: 'La tabla Fichas no existe en la base de datos'
        };
      }
      
      throw error;
    }
  }

  /**
   * Obtener ficha por código
   */
  static async getFichaByCode(codigo) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          f.*,
          pf.codigo_programa,
          pf.nombre_programa,
          pf.nivel,
          pf.area_conocimiento,
          a.codigo_ambiente,
          a.nombre_ambiente,
          a.bloque,
          (
            SELECT COUNT(*)
            FROM Personas p
            WHERE p.id_ficha = f.id_ficha
            AND p.rol = 'aprendiz'
            AND p.estado = 'activo'
          ) as aprendices_activos
         FROM \`fichas\` f
         LEFT JOIN \`Programas_Formacion\` pf ON f.id_programa = pf.id_programa
         LEFT JOIN \`Ambientes\` a ON f.id_ambiente_principal = a.id_ambiente
         WHERE f.codigo_ficha = ?`,
        [codigo]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Ficha no encontrada'
        };
      }

      return {
        success: true,
        data: rows[0]
      };
    } catch (error) {
      console.error('Error en getFichaByCode:', error);
      throw error;
    }
  }

  static async createFicha(data) {
    try {
      const {
        codigo_ficha,
        codigo_programa,
        jornada = 'diurna',
        fecha_inicio = null,
        fecha_fin = null,
        estado = 'activa',
        numero_aprendices = 0,
        capacidad_maxima = null
      } = data;

      if (!codigo_ficha || !codigo_programa) {
        return {
          success: false,
          message: 'Código de ficha y de programa son obligatorios'
        };
      }

      const [programRows] = await pool.execute(
        `SELECT id_programa FROM programas_formacion WHERE codigo_programa = ?`,
        [codigo_programa]
      );

      if (programRows.length === 0) {
        return {
          success: false,
          message: 'Programa no encontrado para el código proporcionado'
        };
      }

      const id_programa = programRows[0].id_programa;

      const [result] = await pool.execute(
        `INSERT INTO fichas (codigo_ficha, id_programa, jornada, fecha_inicio, fecha_fin, estado, numero_aprendices, capacidad_maxima)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigo_ficha,
          id_programa,
          jornada,
          fecha_inicio || null,
          fecha_fin || null,
          estado,
          numero_aprendices,
          capacidad_maxima
        ]
      );

      const [inserted] = await pool.execute(
        `SELECT * FROM fichas WHERE id_ficha = ?`,
        [result.insertId]
      );

      return {
        success: true,
        data: inserted[0]
      };
    } catch (error) {
      console.error('Error en createFicha:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'Ya existe una ficha con ese código' };
      }
      throw error;
    }
  }

  /**
   * Obtener aprendices por ficha
   */
  static async getStudentsByFicha(codigoFicha, filters = {}) {
    try {
      let query = `
        SELECT 
          p.id_persona,
          p.documento,
          p.tipo_documento,
          p.nombre,
          p.email,
          p.telefono,
          p.ficha,
          p.estado,
          f.codigo_ficha,
          f.programa_formacion,
          f.jornada,
          (
            SELECT MAX(a.fecha_entrada)
            FROM Accesos a
            WHERE a.id_persona = p.id_persona
          ) as ultimo_acceso,
          (
            SELECT COUNT(*)
            FROM Accesos a
            WHERE a.id_persona = p.id_persona
            AND DATE(a.fecha_entrada) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ) as accesos_mes
        FROM Personas p
        INNER JOIN Fichas f ON p.id_ficha = f.id_ficha
        WHERE f.codigo_ficha = ?
          AND p.rol = 'aprendiz'
      `;

      const params = [codigoFicha];

      if (filters.estado) {
        query += ` AND p.estado = ?`;
        params.push(filters.estado);
      }

      query += ` ORDER BY p.nombre`;

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows,
        total: rows.length,
        ficha: rows[0] ? {
          codigo: rows[0].codigo_ficha,
          programa: rows[0].programa_formacion,
          jornada: rows[0].jornada
        } : null
      };
    } catch (error) {
      console.error('Error en getStudentsByFicha:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los ambientes
   */
  static async getAllAmbientes(filters = {}) {
    try {
      let query = `
        SELECT 
          id_ambiente,
          codigo_ambiente,
          nombre_ambiente,
          tipo_ambiente,
          capacidad,
          bloque,
          piso,
          equipamiento,
          estado,
          fecha_creacion
        FROM Ambientes
        WHERE 1=1
      `;

      const params = [];

      if (filters.tipo) {
        query += ` AND tipo_ambiente = ?`;
        params.push(filters.tipo);
      }

      if (filters.bloque) {
        query += ` AND bloque LIKE ?`;
        params.push(`%${filters.bloque}%`);
      }

      if (filters.estado) {
        query += ` AND estado = ?`;
        params.push(filters.estado);
      }

      if (filters.search) {
        query += ` AND (nombre_ambiente LIKE ? OR codigo_ambiente LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ` ORDER BY bloque, piso, codigo_ambiente`;

      const [rows] = await pool.execute(query, params);

      // Parsear equipamiento JSON
      const parsedRows = rows.map(row => ({
        ...row,
        equipamiento: row.equipamiento ? JSON.parse(row.equipamiento) : []
      }));

      return {
        success: true,
        data: parsedRows,
        total: parsedRows.length
      };
    } catch (error) {
      console.error('Error en getAllAmbientes:', error);
      throw error;
    }
  }

  /**
   * Obtener ambiente por código
   */
  static async getAmbienteByCode(codigo) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM Ambientes WHERE codigo_ambiente = ?`,
        [codigo]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Ambiente no encontrado'
        };
      }

      const ambiente = {
        ...rows[0],
        equipamiento: rows[0].equipamiento ? JSON.parse(rows[0].equipamiento) : []
      };

      return {
        success: true,
        data: ambiente
      };
    } catch (error) {
      console.error('Error en getAmbienteByCode:', error);
      throw error;
    }
  }

  /**
   * Obtener ambientes por tipo
   */
  static async getAmbientesByType(tipo) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM Ambientes WHERE tipo_ambiente = ? AND estado = 'activo' ORDER BY bloque, piso`,
        [tipo]
      );

      const parsedRows = rows.map(row => ({
        ...row,
        equipamiento: row.equipamiento ? JSON.parse(row.equipamiento) : []
      }));

      return {
        success: true,
        data: parsedRows,
        total: parsedRows.length
      };
    } catch (error) {
      console.error('Error en getAmbientesByType:', error);
      throw error;
    }
  }

  /**
   * Obtener aprendices por programa
   */
  static async getStudentsByProgram(codigoPrograma, filters = {}) {
    try {
      // Primero obtener información del programa
      const [programas] = await pool.execute(
        'SELECT id_programa, codigo_programa, nombre_programa, nivel, area_conocimiento FROM Programas_Formacion WHERE codigo_programa = ?',
        [codigoPrograma]
      );

      if (programas.length === 0) {
        return {
          success: false,
          message: 'Programa no encontrado',
          data: [],
          total: 0,
          programa: null
        };
      }

      const programa = programas[0];

      // Consulta mejorada: busca por id_programa O por nombre del programa
      // Esto permite encontrar aprendices que fueron importados antes de asignar id_programa
      let query = `
        SELECT DISTINCT
          p.id_persona,
          p.documento,
          p.tipo_documento,
          p.nombre,
          p.email,
          p.telefono,
          p.ficha,
          p.estado,
          COALESCE(pf.codigo_programa, ?) as codigo_programa,
          COALESCE(pf.nombre_programa, p.programa) as nombre_programa,
          COALESCE(pf.nivel, 'N/A') as nivel,
          COALESCE(pf.area_conocimiento, 'N/A') as area_conocimiento,
          (
            SELECT MAX(a.fecha_entrada)
            FROM Accesos a
            WHERE a.id_persona = p.id_persona
          ) as ultimo_acceso,
          (
            SELECT COUNT(*)
            FROM Accesos a
            WHERE a.id_persona = p.id_persona
            AND DATE(a.fecha_entrada) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ) as accesos_mes
        FROM Personas p
        LEFT JOIN Programas_Formacion pf ON p.id_programa = pf.id_programa
        WHERE p.rol = 'aprendiz'
          AND (
            (p.id_programa = ? AND pf.codigo_programa = ?)
            OR 
            (p.id_programa IS NULL AND p.programa = ?)
            OR
            (p.id_programa IS NULL AND p.programa LIKE ?)
          )
      `;

      const params = [
        programa.codigo_programa,
        programa.id_programa,
        codigoPrograma,
        programa.nombre_programa,
        `%${programa.nombre_programa}%`
      ];

      if (filters.estado) {
        query += ` AND p.estado = ?`;
        params.push(filters.estado);
      }

      if (filters.ficha) {
        query += ` AND p.ficha LIKE ?`;
        params.push(`%${filters.ficha}%`);
      }

      query += ` ORDER BY p.ficha, p.nombre`;

      const [rows] = await pool.execute(query, params);

      return {
        success: true,
        data: rows,
        total: rows.length,
        programa: {
          codigo: programa.codigo_programa,
          nombre: programa.nombre_programa,
          nivel: programa.nivel,
          area: programa.area_conocimiento
        }
      };
    } catch (error) {
      console.error('Error en getStudentsByProgram:', error);
      throw error;
    }
  }

  /**
   * Obtener ocupación actual de un ambiente
   */
  static async getAmbientOccupation(codigoAmbiente) {
    try {
      // Primero obtener el ambiente
      const ambienteResult = await this.getAmbienteByCode(codigoAmbiente);
      if (!ambienteResult.success) {
        return ambienteResult;
      }

      const ambiente = ambienteResult.data;

      // Buscar personas actualmente dentro (usando zona si existe)
      // Por ahora usamos una aproximación basada en accesos activos
      const [ocupacionRows] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT a.id_persona) as ocupacion_actual,
          GROUP_CONCAT(DISTINCT CONCAT(p.nombre, ' (', p.documento, ')') SEPARATOR ', ') as personas_presentes
        FROM Accesos a
        INNER JOIN Personas p ON a.id_persona = p.id_persona
        WHERE a.fecha_salida IS NULL
          AND a.estado = 'activo'
          AND DATE(a.fecha_entrada) = CURDATE()
        LIMIT 50
        `,
        []
      );

      const ocupacion = ocupacionRows[0]?.ocupacion_actual || 0;
      const disponibilidad = ambiente.capacidad - ocupacion;
      const porcentaje = ambiente.capacidad > 0 
        ? Math.round((ocupacion / ambiente.capacidad) * 100) 
        : 0;

      return {
        success: true,
        data: {
          ambiente: {
            codigo: ambiente.codigo_ambiente,
            nombre: ambiente.nombre_ambiente,
            tipo: ambiente.tipo_ambiente,
            bloque: ambiente.bloque,
            piso: ambiente.piso,
            capacidad: ambiente.capacidad
          },
          ocupacion: {
            actual: ocupacion,
            capacidad: ambiente.capacidad,
            disponibilidad: disponibilidad,
            porcentaje: porcentaje
          },
          personas_presentes: ocupacionRows[0]?.personas_presentes || 'Ninguna'
        }
      };
    } catch (error) {
      console.error('Error en getAmbientOccupation:', error);
      throw error;
    }
  }

  /**
   * Obtener accesos por ficha
   */
  static async getAccessByFicha(codigoFicha, filters = {}) {
    try {
      const fechaDesde = filters.fecha_desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fechaHasta = filters.fecha_hasta || new Date().toISOString().split('T')[0];
      const idColumn = await getRegistroIdField();

      // Primero obtener información de la ficha
      const [fichaRows] = await pool.execute(
        `SELECT f.id_ficha, f.codigo_ficha, f.jornada, pf.codigo_programa, pf.nombre_programa, pf.nivel
         FROM fichas f
         LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
         WHERE f.codigo_ficha = ?`,
        [codigoFicha]
      );

      if (fichaRows.length === 0) {
        return {
          success: false,
          message: 'Ficha no encontrada',
          data: [],
          estadisticas: null,
          ficha: null
        };
      }

      const fichaInfo = fichaRows[0];

      let query = `
        SELECT
          r.${idColumn} AS id_acceso,
          p.documento,
          p.tipo_documento,
          CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, '')) AS nombre_completo,
          f.codigo_ficha AS ficha,
          pf.codigo_programa,
          pf.nombre_programa,
          r.tipo AS tipo_acceso,
          r.fecha_hora,
          CASE WHEN r.tipo = 'ENTRADA' THEN r.fecha_hora ELSE (
            SELECT r2.fecha_hora
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'ENTRADA'
              AND r2.fecha_hora < r.fecha_hora
            ORDER BY r2.fecha_hora DESC
            LIMIT 1
          ) END AS fecha_entrada,
          CASE WHEN r.tipo = 'ENTRADA' THEN (
            SELECT r2.fecha_hora
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'SALIDA'
              AND r2.fecha_hora > r.fecha_hora
            ORDER BY r2.fecha_hora ASC
            LIMIT 1
          ) ELSE r.fecha_hora END AS fecha_salida,
          CASE WHEN r.tipo = 'ENTRADA' THEN (
            SELECT TIMESTAMPDIFF(MINUTE, r.fecha_hora, r2.fecha_hora)
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'SALIDA'
              AND r2.fecha_hora > r.fecha_hora
            ORDER BY r2.fecha_hora ASC
            LIMIT 1
          ) ELSE (
            SELECT TIMESTAMPDIFF(MINUTE, r2.fecha_hora, r.fecha_hora)
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'ENTRADA'
              AND r2.fecha_hora < r.fecha_hora
            ORDER BY r2.fecha_hora DESC
            LIMIT 1
          ) END AS duracion_minutos,
          CASE
            WHEN r.tipo = 'ENTRADA' AND EXISTS (
              SELECT 1
              FROM registros_entrada_salida r2
              WHERE r2.id_persona = r.id_persona
                AND r2.tipo = 'SALIDA'
                AND r2.fecha_hora > r.fecha_hora
            ) THEN 'completado'
            WHEN r.tipo = 'ENTRADA' THEN 'en curso'
            ELSE 'completado'
          END AS estado
        FROM registros_entrada_salida r
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        INNER JOIN fichas f ON p.id_ficha = f.id_ficha
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE f.codigo_ficha = ?
          AND DATE(r.fecha_hora) BETWEEN ? AND ?
      `;

      const params = [codigoFicha, fechaDesde, fechaHasta];

      if (filters.tipo) {
        query += ` AND r.tipo = ?`;
        params.push(filters.tipo.toUpperCase());
      }

      query += ` ORDER BY r.fecha_hora DESC LIMIT 1000`;

      const [rows] = await pool.execute(query, params);

      const estadisticas = {
        total_accesos: rows.length,
        entradas: rows.filter(r => r.tipo_acceso === 'ENTRADA').length,
        salidas: rows.filter(r => r.tipo_acceso === 'SALIDA').length,
        aprendices_unicos: new Set(rows.map(r => r.documento)).size,
        tiempo_promedio: rows.length > 0
          ? Math.round(rows.reduce((sum, r) => sum + (r.duracion_minutos || 0), 0) / rows.filter(r => r.duracion_minutos).length) || 0
          : 0
      };

      return {
        success: true,
        data: rows.map(row => ({
          ...row,
          tipo_acceso: row.tipo_acceso?.toLowerCase(),
          duracion_minutos: row.duracion_minutos !== null ? parseInt(row.duracion_minutos, 10) : null,
          fecha_entrada: row.fecha_entrada || null,
          fecha_salida: row.fecha_salida || null
        })),
        estadisticas,
        ficha: {
          codigo: fichaInfo.codigo_ficha,
          jornada: fichaInfo.jornada,
          programa: fichaInfo.nombre_programa,
          codigo_programa: fichaInfo.codigo_programa,
          nivel: fichaInfo.nivel
        },
        periodo: {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta
        }
      };
    } catch (error) {
      console.error('Error en getAccessByFicha:', error);
      throw error;
    }
  }

  /**
   * Obtener accesos por programa de formación (circuito abierto)
   */
  static async getAccessByProgram(codigoPrograma, filters = {}) {
    try {
      const fechaDesde = filters.fecha_desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fechaHasta = filters.fecha_hasta || new Date().toISOString().split('T')[0];
      const idColumn = await getRegistroIdField();

      let query = `
        SELECT 
          r.${idColumn} AS id_acceso,
          p.documento,
          p.tipo_documento,
          CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo,
          f.codigo_ficha AS ficha,
          pf.codigo_programa,
          pf.nombre_programa,
          pf.nivel,
          r.tipo AS tipo_acceso,
          CASE WHEN r.tipo = 'ENTRADA' THEN r.fecha_hora ELSE (
            SELECT r2.fecha_hora
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'ENTRADA'
              AND r2.fecha_hora < r.fecha_hora
            ORDER BY r2.fecha_hora DESC
            LIMIT 1
          ) END AS fecha_entrada,
          CASE WHEN r.tipo = 'ENTRADA' THEN (
            SELECT r2.fecha_hora
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'SALIDA'
              AND r2.fecha_hora > r.fecha_hora
            ORDER BY r2.fecha_hora ASC
            LIMIT 1
          ) ELSE r.fecha_hora END AS fecha_salida,
          CASE WHEN r.tipo = 'ENTRADA' THEN (
            SELECT TIMESTAMPDIFF(MINUTE, r.fecha_hora, r2.fecha_hora)
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'SALIDA'
              AND r2.fecha_hora > r.fecha_hora
            ORDER BY r2.fecha_hora ASC
            LIMIT 1
          ) ELSE (
            SELECT TIMESTAMPDIFF(MINUTE, r2.fecha_hora, r.fecha_hora)
            FROM registros_entrada_salida r2
            WHERE r2.id_persona = r.id_persona
              AND r2.tipo = 'ENTRADA'
              AND r2.fecha_hora < r.fecha_hora
            ORDER BY r2.fecha_hora DESC
            LIMIT 1
          ) END AS duracion_minutos,
          CASE
            WHEN r.tipo = 'ENTRADA' AND EXISTS (
              SELECT 1
              FROM registros_entrada_salida r2
              WHERE r2.id_persona = r.id_persona
                AND r2.tipo = 'SALIDA'
                AND r2.fecha_hora > r.fecha_hora
            ) THEN 'completado'
            WHEN r.tipo = 'ENTRADA' THEN 'en curso'
            ELSE 'completado'
          END AS estado
        FROM registros_entrada_salida r
        LEFT JOIN Personas p ON r.id_persona = p.id_persona
        LEFT JOIN Roles role ON p.id_rol = role.id_rol
        LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
        LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
        WHERE pf.codigo_programa = ?
          AND DATE(r.fecha_hora) BETWEEN ? AND ?
      `;

      const params = [codigoPrograma, fechaDesde, fechaHasta];

      if (filters.rol) {
        query += ` AND role.nombre_rol = ?`;
        params.push(filters.rol);
      }

      query += ` ORDER BY r.fecha_hora DESC LIMIT 1000`;

      const [rows] = await pool.execute(query, params);

      const estadisticas = {
        total_accesos: rows.length,
        entradas: rows.filter(r => r.tipo_acceso === 'ENTRADA').length,
        salidas: rows.filter(r => r.tipo_acceso === 'SALIDA').length,
        aprendices_unicos: new Set(rows.map(r => r.documento)).size,
        tiempo_promedio: rows.length > 0
          ? Math.round(rows.reduce((sum, r) => sum + (r.duracion_minutos || 0), 0) / rows.length)
          : 0
      };

      return {
        success: true,
        data: rows.map(row => ({
          ...row,
          tipo_acceso: row.tipo_acceso?.toLowerCase(),
          duracion_minutos: row.duracion_minutos !== null ? parseInt(row.duracion_minutos, 10) : null,
          fecha_entrada: row.fecha_entrada || null,
          fecha_salida: row.fecha_salida || null
        })),
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
}




