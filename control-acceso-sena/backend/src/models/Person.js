// Person Model
import pool from '../utils/dbPool.js';

export default class Person {
  // Buscar persona por documento
  static async findByDocument(documento) {
    const [rows] = await pool.execute(
      `SELECT 
         p.*, 
         r.nombre_rol,
         f.codigo_ficha AS ficha_persona,
         pf.codigo_programa AS programa_formacion_persona
       FROM personas p
       LEFT JOIN roles r ON p.id_rol = r.id_rol
       LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
       LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
       WHERE p.documento = ? AND p.estado = 'ACTIVO'`,
      [documento]
    );
    return rows[0];
  }

  // Buscar persona por ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
         p.*, 
         r.nombre_rol,
         f.codigo_ficha AS ficha_persona,
         pf.codigo_programa AS programa_formacion_persona
       FROM personas p
       LEFT JOIN roles r ON p.id_rol = r.id_rol
       LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
       LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
       WHERE p.id_persona = ?`,
      [id]
    );
    return rows[0];
  }

  // Obtener todas las personas activas dentro del centro (circuito abierto)
  static async getCurrentPeople() {
    try {
      // Usar la vista v_personas_dentro que implementa la lógica de circuito abierto
      const [rows] = await pool.execute(
        `SELECT * FROM v_personas_dentro
         ORDER BY fecha_entrada DESC`
      );
      return rows || [];
    } catch (error) {
      // Si la vista no existe, calcular manualmente usando la lógica de circuito abierto
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
        console.warn('⚠️  Vista v_personas_dentro no existe, calculando manualmente...');
        try {
          const [rows] = await pool.execute(
            `SELECT 
              p.id_persona,
              CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
              p.documento,
              rol_tabla.nombre_rol,
              p.foto,
              r.fecha_hora as fecha_entrada,
              TIMESTAMPDIFF(MINUTE, r.fecha_hora, NOW()) as minutos_dentro,
              f.codigo_ficha AS ficha_persona,
              pf.codigo_programa AS programa_formacion_persona,
              pf.nombre_programa AS programa_formacion_nombre
            FROM personas p
            INNER JOIN registros_entrada_salida r ON p.id_persona = r.id_persona
            LEFT JOIN roles rol_tabla ON p.id_rol = rol_tabla.id_rol
            LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
            LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
            WHERE r.tipo = 'ENTRADA'
              AND r.fecha_hora = (
                SELECT MAX(fecha_hora) 
                FROM registros_entrada_salida 
                WHERE id_persona = p.id_persona
              )
              AND NOT EXISTS (
                SELECT 1 
                FROM registros_entrada_salida r2 
                WHERE r2.id_persona = p.id_persona 
                  AND r2.tipo = 'SALIDA' 
                  AND r2.fecha_hora > r.fecha_hora
              )
              AND p.estado = 'ACTIVO'
            ORDER BY r.fecha_hora DESC`
          );
          return rows || [];
        } catch (fallbackError) {
          console.error('❌ Error calculando personas dentro manualmente:', fallbackError.message);
          return [];
        }
      }
      console.error('❌ Error obteniendo personas dentro:', error.message);
      return [];
    }
  }

  // Verificar si una persona está dentro (circuito abierto)
  static async isInside(personId) {
    // Verificar si la última acción fue ENTRADA sin SALIDA posterior
    const [rows] = await pool.execute(
      `SELECT tipo, fecha_hora
       FROM registros_entrada_salida
       WHERE id_persona = ?
       ORDER BY fecha_hora DESC
       LIMIT 1`,
      [personId]
    );
    
    if (rows.length === 0) {
      return false;
    }
    
    const ultimoRegistro = rows[0];
    
    // Si el último registro es ENTRADA, está dentro
    if (ultimoRegistro.tipo === 'ENTRADA') {
      // Verificar que no haya una SALIDA posterior
      const [salidaRows] = await pool.execute(
        `SELECT 1 FROM registros_entrada_salida
         WHERE id_persona = ? AND tipo = 'SALIDA' AND fecha_hora > ?
         LIMIT 1`,
        [personId, ultimoRegistro.fecha_hora]
      );
      return salidaRows.length === 0;
    }
    
    return false;
  }

  // Buscar persona por documento sin filtrar por estado
  static async findByDocumentAnyStatus(documento, tipo_documento = 'CC') {
    const [rows] = await pool.execute(
      `SELECT 
         p.*, 
         r.nombre_rol,
         f.codigo_ficha AS ficha_persona,
         pf.codigo_programa AS programa_formacion_persona
       FROM personas p
       LEFT JOIN roles r ON p.id_rol = r.id_rol
       LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
       LEFT JOIN programas_formacion pf ON f.id_programa = pf.id_programa
       WHERE p.documento = ? AND p.tipo_documento = ?`,
      [documento, tipo_documento.toUpperCase()]
    );
    return rows[0];
  }

  // Crear una nueva persona automáticamente
  static async create(personData) {
    try {
      const {
        nombre,
        nombres,
        apellidos,
        documento,
        tipo_documento = 'CC',
        rol = 'aprendiz',
        email = null,
        telefono = null,
        foto = null
      } = personData;

      const nameParts = (nombre || '').trim().split(' ').filter(Boolean);
      const nombresValue = nombres?.trim() || (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nombre?.trim() || 'Visitante');
      const apellidosValue = apellidos?.trim() || (nameParts.length > 1 ? nameParts.slice(-1).join(' ') : 'Visitante');

      // Validar datos requeridos
      const hasName = !!(nombres?.trim() || apellidos?.trim() || nombre?.trim());
      if (!documento || !hasName) {
        throw new Error('Nombre y documento son requeridos');
      }

      // Verificar si ya existe (incluso si está inactivo)
      const existingPerson = await this.findByDocumentAnyStatus(documento, tipo_documento);
      
      if (existingPerson) {
        // Si existe pero está inactivo, reactivarlo y actualizar información
        if (existingPerson.estado !== 'activo') {
          // Obtener el ID del rol
          const [roleRows] = await pool.execute(
            'SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1',
            [rol.toUpperCase()]
          );
          const idRol = roleRows.length > 0 ? roleRows[0].id_rol : null;

          // Reactivar y actualizar información
          await pool.execute(
            `UPDATE personas 
             SET nombres = ?, apellidos = ?, id_rol = ?, estado = 'ACTIVO', 
                 email = COALESCE(?, email), telefono = COALESCE(?, telefono), 
                 foto = COALESCE(?, foto), fecha_actualizacion = NOW()
             WHERE id_persona = ?`,
            [nombresValue, apellidosValue, idRol, email, telefono, foto, existingPerson.id_persona]
          );

          // Obtener la persona actualizada
          const updatedPerson = await this.findById(existingPerson.id_persona);
          return updatedPerson;
        } else {
          // Ya existe y está activo, retornar la persona existente
          return existingPerson;
        }
      }

      // Obtener el ID del rol
      const [roleRows] = await pool.execute(
        'SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1',
        [rol.toUpperCase()]
      );
      const idRol = roleRows.length > 0 ? roleRows[0].id_rol : null;

      // Insertar la nueva persona
      const [result] = await pool.execute(
        `INSERT INTO personas (nombres, apellidos, documento, tipo_documento, id_rol, estado, email, telefono, foto, fecha_registro)
         VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?, ?, ?, NOW())`,
        [nombresValue, apellidosValue, documento, tipo_documento.toUpperCase(), idRol, email, telefono, foto]
      );

      // Obtener la persona creada con su rol
      const createdPerson = await this.findById(result.insertId);
      return createdPerson;
    } catch (error) {
      console.error('Error creando persona:', error);
      throw error;
    }
  }
}
