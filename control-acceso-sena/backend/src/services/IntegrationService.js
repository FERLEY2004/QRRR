// Integration Service - Servicio de integración QR + BD
import pool from '../utils/dbPool.js';
import Person from '../models/Person.js';
import Access from '../models/Access.js';

export class IntegrationService {
  /**
   * Escaneo completo: Fusiona datos QR con información de BD
   * @param {Object} qrData - Datos del QR: { documento, nombre_completo, rh, rol }
   * @param {Number} userId - ID del usuario que realiza el escaneo
   */
  static async scanComplete(qrData, userId) {
    try {
      // Validar datos QR requeridos
      const { documento, nombre_completo, rh, rol } = qrData;

      if (!documento || !nombre_completo || !rol) {
        return {
          success: false,
          error: 'QR incompleto: faltan campos requeridos (documento, nombre_completo, rol)'
        };
      }

      // Buscar persona en BD por documento
      const [personRows] = await pool.execute(
        `SELECT p.*, r.nombre_rol, pf.nombre_programa, pf.codigo_programa, f.codigo_ficha, f.jornada
         FROM Personas p
         LEFT JOIN Roles r ON p.id_rol = r.id_rol
         LEFT JOIN Programas_Formacion pf ON p.id_programa = pf.id_programa
         LEFT JOIN Fichas f ON p.id_ficha = f.id_ficha
         WHERE p.documento = ? AND p.tipo_documento = COALESCE(?, 'CC')
         LIMIT 1`,
        [documento, qrData.tipo_documento || 'CC']
      );

      if (personRows.length === 0) {
        return {
          success: false,
          error: 'Acceso denegado: La persona no está registrada en el sistema',
          accesoPermitido: false,
          motivo_bloqueo: 'La persona debe estar registrada en la base de datos para tener acceso',
          datosQR: qrData,
          datosBD: null
        };
      }

      const person = personRows[0];

      // Verificar estado
      if (person.estado !== 'activo') {
        return {
          success: false,
          error: `Usuario ${person.estado}`,
          accesoPermitido: false,
          motivo_bloqueo: `El usuario está ${person.estado}`,
          datosQR: qrData,
          datosBD: {
            estado: person.estado,
            documento: person.documento,
            nombre: person.nombre
          }
        };
      }

      // Obtener información institucional según el rol
      let datosInstitucionales = {};

      if (rol === 'aprendiz') {
        datosInstitucionales = await this.getDatosAprendiz(person);
      } else if (rol === 'instructor') {
        datosInstitucionales = await this.getDatosInstructor(person);
      } else if (rol === 'administrativo') {
        datosInstitucionales = await this.getDatosAdministrativo(person);
      }

      // Verificar reglas de acceso
      const accesoPermitido = await this.verificarAcceso(person, datosInstitucionales);

      // Preparar respuesta
      const response = {
        success: true,
        accesoPermitido: accesoPermitido.permitido,
        mensaje: accesoPermitido.mensaje,
        datosQR: {
          documento,
          nombre_completo,
          rh: rh || null,
          rol
        },
        datosBD: {
          ...datosInstitucionales,
          estado: person.estado,
          email: person.email,
          telefono: person.telefono
        },
        motivo_bloqueo: accesoPermitido.motivo_bloqueo || null
      };

      return response;
    } catch (error) {
      console.error('Error en scanComplete:', error);
      throw error;
    }
  }

  /**
   * Obtener datos institucionales de un aprendiz
   */
  static async getDatosAprendiz(person) {
    const [asignaciones] = await pool.execute(
      `SELECT a.id_ambiente, amb.nombre_ambiente, amb.codigo_ambiente, amb.bloque, amb.piso
       FROM Asignaciones_Ambientes aa
       INNER JOIN Ambientes amb ON aa.id_ambiente = amb.id_ambiente
       WHERE aa.id_persona = ? AND aa.tipo_asignacion = 'aprendiz' AND aa.activa = TRUE
       LIMIT 1`,
      [person.id_persona]
    );

    return {
      ficha: person.codigo_ficha || person.ficha || null,
      programa_formacion: person.nombre_programa || person.programa || null,
      codigo_programa: person.codigo_programa || null,
      ambiente_asignado: asignaciones[0] 
        ? `${asignaciones[0].bloque} - ${asignaciones[0].nombre_ambiente}`
        : null,
      ambiente_codigo: asignaciones[0]?.codigo_ambiente || null,
      jornada: person.jornada || null,
      estado: person.estado
    };
  }

  /**
   * Obtener datos institucionales de un instructor
   */
  static async getDatosInstructor(person) {
    const [asignaciones] = await pool.execute(
      `SELECT amb.nombre_ambiente, amb.codigo_ambiente, amb.bloque, aa.horario_asignado
       FROM Asignaciones_Ambientes aa
       INNER JOIN Ambientes amb ON aa.id_ambiente = amb.id_ambiente
       WHERE aa.id_persona = ? AND aa.tipo_asignacion = 'instructor' AND aa.activa = TRUE`,
      [person.id_persona]
    );

    // Obtener fichas que atiende
    const [fichas] = await pool.execute(
      `SELECT DISTINCT f.codigo_ficha, f.programa_formacion
       FROM Fichas f
       INNER JOIN Personas p ON p.id_ficha = f.id_ficha
       INNER JOIN Asignaciones_Ambientes aa ON aa.id_ambiente = f.id_ambiente_principal
       WHERE aa.id_persona = ? AND aa.tipo_asignacion = 'instructor' AND aa.activa = TRUE`,
      [person.id_persona]
    );

    const ambientes = asignaciones.map(a => ({
      nombre: a.nombre_ambiente,
      codigo: a.codigo_ambiente,
      bloque: a.bloque,
      horario: a.horario_asignado ? JSON.parse(a.horario_asignado) : null
    }));

    return {
      ambientes_clase: ambientes,
      fichas_atiende: fichas.map(f => f.codigo_ficha),
      areas_formacion: [...new Set(fichas.map(f => f.programa_formacion))],
      horarios: this.formatHorarios(asignaciones)
    };
  }

  /**
   * Obtener datos institucionales de un administrativo
   */
  static async getDatosAdministrativo(person) {
    const [asignaciones] = await pool.execute(
      `SELECT amb.nombre_ambiente, amb.codigo_ambiente, amb.bloque, aa.horario_asignado
       FROM Asignaciones_Ambientes aa
       INNER JOIN Ambientes amb ON aa.id_ambiente = amb.id_ambiente
       WHERE aa.id_persona = ? AND aa.tipo_asignacion = 'administrativo' AND aa.activa = TRUE
       LIMIT 1`,
      [person.id_persona]
    );

    return {
      ambiente_trabajo: asignaciones[0] 
        ? `${asignaciones[0].bloque} - ${asignaciones[0].nombre_ambiente}`
        : null,
      dependencia: asignaciones[0]?.nombre_ambiente || null,
      horario_oficina: asignaciones[0]?.horario_asignado 
        ? this.formatHorarioOficina(JSON.parse(asignaciones[0].horario_asignado))
        : null
    };
  }

  /**
   * Verificar reglas de acceso
   */
  static async verificarAcceso(person, datosInstitucionales) {
    const ahora = new Date();
    const hora = ahora.getHours();
    const diaSemana = ahora.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Reglas para aprendices
    if (person.rol === 'aprendiz') {
      // Verificar estado
      if (person.estado !== 'activo') {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Usuario inactivo',
          motivo_bloqueo: `Estado: ${person.estado}`
        };
      }

      // Verificar horario de jornada
      if (datosInstitucionales.jornada) {
        const horarioValido = this.verificarHorarioJornada(datosInstitucionales.jornada, hora);
        if (!horarioValido) {
          return {
            permitido: false,
            mensaje: 'Acceso denegado: Fuera del horario de jornada',
            motivo_bloqueo: `Jornada ${datosInstitucionales.jornada} - Fuera de horario`
          };
        }
      }

      // Verificar capacidad del ambiente (si está asignado)
      if (datosInstitucionales.ambiente_codigo) {
        const capacidadOk = await this.verificarCapacidadAmbiente(datosInstitucionales.ambiente_codigo);
        if (!capacidadOk.permitido) {
          return {
            permitido: false,
            mensaje: 'Acceso denegado: Ambiente lleno',
            motivo_bloqueo: capacidadOk.mensaje
          };
        }
      }

      return { permitido: true, mensaje: 'Acceso permitido' };
    }

    // Reglas para instructores
    if (person.rol === 'instructor') {
      if (person.estado !== 'activo') {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Usuario inactivo',
          motivo_bloqueo: `Estado: ${person.estado}`
        };
      }

      // Verificar si tiene asignación en algún ambiente
      if (!datosInstitucionales.ambientes_clase || datosInstitucionales.ambientes_clase.length === 0) {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Sin asignación de ambiente',
          motivo_bloqueo: 'No tiene ambientes asignados'
        };
      }

      return { permitido: true, mensaje: 'Acceso permitido' };
    }

    // Reglas para administrativos
    if (person.rol === 'administrativo') {
      if (person.estado !== 'activo') {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Usuario inactivo',
          motivo_bloqueo: `Estado: ${person.estado}`
        };
      }

      // Verificar horario laboral (Lunes-Viernes 8:00-17:00)
      if (diaSemana === 0 || diaSemana === 6) {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Fuera del horario laboral',
          motivo_bloqueo: 'Fin de semana'
        };
      }

      if (hora < 8 || hora >= 17) {
        return {
          permitido: false,
          mensaje: 'Acceso denegado: Fuera del horario laboral',
          motivo_bloqueo: `Horario: ${hora}:00 (Fuera de 8:00-17:00)`
        };
      }

      return { permitido: true, mensaje: 'Acceso permitido' };
    }

    // Por defecto, permitir acceso
    return { permitido: true, mensaje: 'Acceso permitido' };
  }

  /**
   * Verificar horario de jornada
   */
  static verificarHorarioJornada(jornada, hora) {
    if (jornada === 'diurna') {
      return hora >= 6 && hora < 18; // 6 AM - 6 PM
    } else if (jornada === 'nocturna') {
      return hora >= 18 || hora < 6; // 6 PM - 6 AM
    } else if (jornada === 'mixta') {
      return true; // Siempre permitido
    }
    return true; // Por defecto permitir
  }

  /**
   * Verificar capacidad del ambiente
   */
  static async verificarCapacidadAmbiente(codigoAmbiente) {
    try {
      const [ambientes] = await pool.execute(
        `SELECT capacidad FROM Ambientes WHERE codigo_ambiente = ?`,
        [codigoAmbiente]
      );

      if (ambientes.length === 0) {
        return { permitido: true, mensaje: 'Ambiente no encontrado' };
      }

      const capacidad = ambientes[0].capacidad;

      // Contar personas actualmente dentro (aproximación)
      const [ocupacion] = await pool.execute(
        `SELECT COUNT(DISTINCT a.id_persona) as ocupacion_actual
         FROM Accesos a
         WHERE a.fecha_salida IS NULL 
           AND a.estado = 'activo'
           AND DATE(a.fecha_entrada) = CURDATE()`
      );

      const ocupacionActual = ocupacion[0]?.ocupacion_actual || 0;
      const porcentaje = capacidad > 0 ? (ocupacionActual / capacidad) * 100 : 0;

      if (porcentaje >= 90) {
        return {
          permitido: false,
          mensaje: `Ambiente al ${Math.round(porcentaje)}% de capacidad`
        };
      }

      return { permitido: true, mensaje: 'Capacidad disponible' };
    } catch (error) {
      console.error('Error verificando capacidad:', error);
      return { permitido: true, mensaje: 'Error verificando capacidad' };
    }
  }

  /**
   * Formatear horarios
   */
  static formatHorarios(asignaciones) {
    const horarios = [];
    asignaciones.forEach(a => {
      if (a.horario_asignado) {
        try {
          const horario = JSON.parse(a.horario_asignado);
          Object.entries(horario).forEach(([dia, horas]) => {
            horarios.push(`${dia}: ${horas}`);
          });
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
    });
    return horarios;
  }

  /**
   * Formatear horario de oficina
   */
  static formatHorarioOficina(horario) {
    if (!horario) return null;
    if (typeof horario === 'string') return horario;
    return Object.entries(horario)
      .map(([dia, horas]) => `${dia}: ${horas}`)
      .join(', ');
  }
}



