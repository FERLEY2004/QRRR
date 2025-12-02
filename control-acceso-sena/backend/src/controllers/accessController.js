// Access Controller
import Person from '../models/Person.js';
import Access from '../models/Access.js';
import { IntegrationService } from '../services/IntegrationService.js';
import pool from '../utils/dbPool.js';

// Procesar escaneo de QR
export const scanQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const userId = req.user.id;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Datos QR requeridos'
      });
    }

    // Parsear datos del QR
    let qrInfo;
    try {
      qrInfo = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Formato QR inválido'
      });
    }

    const { type, documento, id, nombre, tipo_documento, email, telefono, foto: qrFoto } = qrInfo;
    const normalizedType = (type || '').toLowerCase();

    // Validar tipo de QR
    if (!type || !documento) {
      return res.status(400).json({
        success: false,
        message: 'QR incompleto o inválido'
      });
    }

    // FLUJO SIMPLIFICADO PARA VISITANTES: Solo validar nombre y documento
    if (normalizedType === 'visitor' || normalizedType === 'visitante') {
      // Validar que tenga nombre y documento
      if (!nombre || !documento) {
        return res.status(400).json({
          success: false,
          message: 'QR de visitante incompleto: se requiere nombre y documento'
        });
      }

      // Verificar expiración del QR (opcional, pero recomendado)
      if (qrInfo.timestamp) {
        const qrDate = new Date(qrInfo.timestamp);
        const now = new Date();
        const hoursDiff = (now - qrDate) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          return res.status(403).json({
            success: false,
            message: 'QR de visitante expirado (más de 24 horas)',
            code: 'QR_EXPIRED',
            person: {
              nombre: nombre,
              documento: documento
            }
          });
        }
      }

      // Buscar o crear persona visitante automáticamente
      let person = await Person.findByDocument(documento);
      
      if (!person) {
        // Crear registro automático del visitante si no existe
        try {
          // Obtener ID de rol visitante
          const [rolRows] = await pool.execute(
            "SELECT id_rol FROM Roles WHERE UPPER(nombre_rol) = 'VISITANTE' LIMIT 1"
          );
          const visitanteRolId = rolRows.length > 0 ? rolRows[0].id_rol : null;

          // Separar nombre en nombres y apellidos
          const partes = nombre.trim().split(' ');
          const apellidos = partes.length > 1 ? partes.slice(-2).join(' ') : '';
          const nombres = partes.length > 2 ? partes.slice(0, -2).join(' ') : partes[0] || nombre;

          // Crear persona visitante (usando nombres y apellidos, no nombre)
          const [result] = await pool.execute(
            `INSERT INTO Personas (nombres, apellidos, documento, tipo_documento, estado, id_rol, fecha_registro)
             VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
            [nombres, apellidos, documento, tipo_documento || 'CC', visitanteRolId]
          );

          // Obtener la persona creada
          person = await Person.findById(result.insertId);
          
          console.log(`✅ Visitante creado automáticamente: ${nombre} (${documento}), id_persona=${result.insertId}`);
          
          // Crear registro en tabla visitantes
          await pool.execute(
            `INSERT INTO visitantes (id_persona, motivo_visita, estado, fecha_inicio)
             VALUES (?, 'Visita general', 'ACTIVO', NOW())`,
            [result.insertId]
          );
          console.log(`✅ Registro en visitantes creado para id_persona=${result.insertId}`);
        } catch (error) {
          console.error('Error al crear visitante automáticamente:', error);
          return res.status(500).json({
            success: false,
            message: 'Error al registrar visitante',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      } else {
        // Si existe, verificar que el visitante pueda entrar
        console.log(`🔍 Visitante existente encontrado: id=${person.id_persona}, estado=${person.estado}`);
        
        const personRoles = `${person.nombre_rol || ''} ${person.rol || ''}`.toLowerCase();
        const isPersonVisitor = personRoles.includes('visitante');
        console.log(`🔍 Roles: "${personRoles}", esVisitante=${isPersonVisitor}`);

        // Verificar estado de la persona
        if (isPersonVisitor && person.estado !== 'ACTIVO') {
          console.log(`🚫 Visitante ${person.documento} tiene estado ${person.estado}, bloqueando entrada`);
          return res.status(403).json({
            success: false,
            message: 'Este QR ya fue utilizado en una visita anterior. Solicita un nuevo QR de visitante',
            code: 'QR_REQUIERE_REGENERACION',
            person: {
              documento: person.documento,
              nombre: person.nombre || `${person.nombres || ''} ${person.apellidos || ''}`.trim()
            }
          });
        }
        
        // Verificar estado en tabla visitantes
        if (isPersonVisitor) {
          const [visitorRows] = await pool.execute(
            `SELECT id_visitante, estado FROM visitantes WHERE id_persona = ? ORDER BY fecha_inicio DESC LIMIT 1`,
            [person.id_persona]
          );
          console.log(`🔍 Registro en visitantes:`, visitorRows[0] || 'NO ENCONTRADO');
          
          if (visitorRows.length > 0 && visitorRows[0].estado !== 'ACTIVO') {
            console.log(`🚫 Registro de visitante ${person.documento} tiene estado ${visitorRows[0].estado}, bloqueando`);
            return res.status(403).json({
              success: false,
              message: 'Este QR ya fue utilizado en una visita anterior. Solicita un nuevo QR de visitante',
              code: 'QR_REQUIERE_REGENERACION',
              person: {
                documento: person.documento,
                nombre: person.nombre || `${person.nombres || ''} ${person.apellidos || ''}`.trim()
              }
            });
          }
        }

      // Actualizar nombres/apellidos si cambió (la tabla usa nombres y apellidos, no nombre)
      const currentNombre = person.nombre || `${person.nombres || ''} ${person.apellidos || ''}`.trim();
      if (currentNombre !== nombre && nombre) {
        try {
          // Separar nombre en nombres y apellidos
          const partes = nombre.trim().split(' ');
          const apellidos = partes.length > 1 ? partes.slice(-2).join(' ') : '';
          const nombres = partes.length > 2 ? partes.slice(0, -2).join(' ') : partes[0] || '';
          
          await pool.execute(
            `UPDATE Personas 
             SET nombres = ?, apellidos = ?
             WHERE id_persona = ?`,
            [nombres || nombre, apellidos, person.id_persona]
          );
          person.nombres = nombres || nombre;
          person.apellidos = apellidos;
        } catch (error) {
          console.error('Error al actualizar nombre del visitante:', error);
        }
      }
      }

      // Verificar si está dentro o fuera y registrar entrada/salida
      const isInside = await Person.isInside(person.id_persona);
      let action;

      if (isInside) {
        // Registrar salida
        const exitSuccess = await Access.registerExit(person.id_persona, userId);
        if (!exitSuccess) {
          return res.status(500).json({
            success: false,
            message: 'Error al registrar salida'
          });
        }
        action = 'salida';
        
        // Actualizar estado del visitante cuando sale
        try {
          await pool.execute(
            `UPDATE visitantes 
             SET fecha_fin = NOW(), estado = 'FINALIZADO'
             WHERE id_persona = ? AND estado = 'ACTIVO'`,
            [person.id_persona]
          );
        } catch (error) {
          console.error('Error al actualizar estado del visitante:', error);
        }
      } else {
        // Registrar entrada
        await Access.registerEntry(person.id_persona, userId, 'ENTRADA');
        action = 'entrada';
        
        // Crear o actualizar registro de visitante
        try {
          const [visitorRows] = await pool.execute(
            `SELECT id_visitante FROM visitantes 
             WHERE id_persona = ? AND estado = 'ACTIVO'`,
            [person.id_persona]
          );
          
          if (visitorRows.length === 0) {
            await pool.execute(
              `INSERT INTO visitantes (id_persona, motivo_visita, estado, fecha_inicio)
               VALUES (?, 'Acceso con QR', 'ACTIVO', NOW())`,
              [person.id_persona]
            );
          }
        } catch (error) {
          console.error('Error al gestionar registro de visitante:', error);
        }
      }

      // Respuesta simplificada para visitantes
      return res.json({
        success: true,
        message: action === 'entrada' ? 'Entrada de visitante registrada exitosamente' : 'Salida de visitante registrada exitosamente',
        action,
        person: {
          id: person.id_persona,
          nombre: person.nombre || nombre,
          documento: person.documento,
          rol: 'visitante',
          tipo_documento: person.tipo_documento || tipo_documento || 'CC'
        },
        timestamp: new Date().toISOString()
      });
    }

    // FLUJO NORMAL PARA NO VISITANTES (aprendices, instructores, etc.)
    // Buscar persona por documento - DEBE estar registrada en la base de datos
    let person = await Person.findByDocument(documento);

    // Si no se encontró como activa, verificar si existe pero está inactiva
    if (!person) {
      // Buscar sin filtrar por estado para verificar si existe pero está inactiva
      const personAnyStatus = await Person.findByDocumentAnyStatus(documento, tipo_documento || 'CC');
      
      if (personAnyStatus && personAnyStatus.estado !== 'activo') {
        // La persona existe pero está inactiva - RECHAZAR ACCESO
        return res.status(403).json({
          success: false,
          message: `Acceso denegado: El usuario está ${personAnyStatus.estado === 'inactivo' ? 'inactivo' : personAnyStatus.estado}`,
          code: 'ACCESS_DENIED_INACTIVE',
          person: {
            nombre: personAnyStatus.nombre,
            documento: personAnyStatus.documento,
            estado: personAnyStatus.estado,
            rol: personAnyStatus.nombre_rol || personAnyStatus.rol || 'aprendiz'
          }
        });
      }
      
      // Si no existe en la base de datos, RECHAZAR ACCESO (incluso con QR válido)
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: La persona no está registrada en el sistema',
        code: 'PERSON_NOT_REGISTERED',
        qrData: {
          documento: documento,
          nombre: nombre || 'No proporcionado',
          tipo: type
        }
      });
    }

    // Validación adicional: Verificar que la persona sigue activa antes de permitir acceso
    if (person.estado !== 'activo' && person.estado !== 'ACTIVO') {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: El usuario está ${person.estado === 'inactivo' || person.estado === 'INACTIVO' ? 'inactivo' : person.estado}`,
        code: 'ACCESS_DENIED_INACTIVE',
        person: {
          nombre: person.nombre,
          documento: person.documento,
          estado: person.estado,
          rol: person.nombre_rol || person.rol || 'aprendiz'
        }
      });
    }

    // Verificar si la persona está dentro o fuera
    const isInside = await Person.isInside(person.id_persona);

    let accessId;
    let action;

    // Detectar si es visitante (antes de los bloques de entrada/salida)
    // Verificar por rol en la base de datos Y por el tipo del QR
    const rolesLower = `${person.nombre_rol || ''} ${person.rol || ''}`.toLowerCase();
    const qrTypeIsVisitor = normalizedType === 'visitor' || normalizedType === 'visitante';
    const roleIsVisitor = rolesLower.includes('visitante');
    const isPersonVisitor = qrTypeIsVisitor || roleIsVisitor;
    
    console.log(`🔍 Verificación visitante: tipo QR="${normalizedType}", rol="${rolesLower}", esVisitante=${isPersonVisitor}`);

    // BLOQUEO PREVIO: Si es visitante y NO está dentro, verificar que su QR siga activo
    if (isPersonVisitor && !isInside) {
      try {
        const [visitorRows] = await pool.execute(
          `SELECT id_visitante, estado 
           FROM visitantes 
           WHERE id_persona = ?
           ORDER BY fecha_inicio DESC
           LIMIT 1`,
          [person.id_persona]
        );
        
        const latest = visitorRows[0];
        if (!latest || latest.estado !== 'ACTIVO') {
          console.log(`🚫 QR de visitante ${person.documento} ya fue usado. Estado: ${latest?.estado || 'sin registro'}`);
          return res.status(403).json({
            success: false,
            message: 'El QR ya fue utilizado para una visita anterior. Solicita un nuevo QR de visitante',
            code: 'QR_REQUIERE_REGENERACION',
            person: {
              documento: person.documento,
              nombre: person.nombre || `${person.nombres || ''} ${person.apellidos || ''}`.trim()
            }
          });
        }
      } catch (error) {
        console.error('Error al validar estado del visitante:', error);
        return res.status(500).json({
          success: false,
          message: 'Error interno verificando el estado del visitante'
        });
      }
    }

    if (isInside) {
      // Registrar salida
      const exitSuccess = await Access.registerExit(person.id_persona, userId);
      if (!exitSuccess) {
        return res.status(500).json({
          success: false,
          message: 'Error al registrar salida'
        });
      }
      action = 'salida';
      
      // Si es visitante, actualizar estado del visitante cuando sale e invalidar QR
      console.log(`🔍 Salida registrada. isPersonVisitor=${isPersonVisitor}, id_persona=${person.id_persona}`);
      if (isPersonVisitor) {
        console.log(`🔄 Desactivando visitante ${person.documento}...`);
        try {
          const [updateVisitante] = await pool.execute(
            `UPDATE visitantes 
             SET fecha_fin = NOW(), estado = 'FINALIZADO'
             WHERE id_persona = ? AND estado = 'ACTIVO'`,
            [person.id_persona]
          );
          console.log(`✅ visitantes actualizado: ${updateVisitante.affectedRows} filas afectadas`);
        } catch (error) {
          console.error('Error al actualizar estado del visitante:', error);
        }
        // Desactivar persona para que el QR no vuelva a funcionar
        try {
          const [updatePersona] = await pool.execute(
            `UPDATE Personas SET estado = 'INACTIVO' WHERE id_persona = ?`,
            [person.id_persona]
          );
          console.log(`✅ Personas actualizado: ${updatePersona.affectedRows} filas afectadas para id_persona=${person.id_persona}`);
        } catch (error) {
          console.error('Error al desactivar persona visitante después de salida:', error.message);
        }
      } else {
        console.log(`ℹ️ No es visitante, no se desactiva`);
      }
    } else {
      // Registrar entrada (el bloqueo de visitante ya se hizo arriba antes del if/else)
      accessId = await Access.registerEntry(person.id_persona, userId, 'ENTRADA');
      action = 'entrada';
    }

    // Preparar respuesta con información de la persona
    const nombreDisplay = person.nombre || `${person.nombres || ''} ${person.apellidos || ''}`.trim() || 'Visitante';
    const rolDisplay = person.nombre_rol || person.rol || 'aprendiz';
    const foto = person.foto || person.foto_url || null;
    const personDocument = person.documento || person.numero_documento || documento;
    const response = {
      success: true,
      message: action === 'entrada' ? 'Entrada registrada exitosamente' : 'Salida registrada exitosamente',
      action,
      person: {
        id: person.id_persona,
        nombre: nombreDisplay,
        documento: personDocument,
        rol: rolDisplay,
        foto,
        tipo_documento: person.tipo_documento || tipo_documento
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error en scanQR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el código QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener personas actualmente dentro
export const getCurrentPeople = async (req, res) => {
  try {
    const people = await Person.getCurrentPeople();
    
    res.json({
      success: true,
      count: people.length,
      people: people.map(p => ({
        id: p.id_persona,
        nombre: p.nombre_completo || p.nombre,
        documento: p.documento,
        rol: p.rol || p.nombre_rol,
        foto: p.foto,
        fecha_entrada: p.fecha_entrada,
        minutos_dentro: p.minutos_dentro,
        zona: p.zona,
        esVisitante: !!p.id_visitante,
        motivo_visita: p.motivo_visita || null
      }))
    });
  } catch (error) {
    console.error('Error en getCurrentPeople:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener personas dentro',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Escaneo completo: Fusiona datos QR con información de BD
export const scanComplete = async (req, res) => {
  try {
    const { qrData } = req.body;
    const userId = req.user.id;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Datos QR requeridos'
      });
    }

    // Validar formato del QR (debe tener documento, nombre_completo, rol)
    const { documento, nombre_completo, rh, rol } = qrData;

    if (!documento || !nombre_completo || !rol) {
      return res.status(400).json({
        success: false,
        message: 'QR incompleto: faltan campos requeridos (documento, nombre_completo, rol)'
      });
    }

    // Fusionar datos QR + BD
    const result = await IntegrationService.scanComplete(qrData, userId);

    if (!result.success) {
      return res.status(result.accesoPermitido === false ? 403 : 404).json(result);
    }

    // Si el acceso está permitido, registrar entrada/salida
    if (result.accesoPermitido) {
      const [personRows] = await pool.execute(
        'SELECT id_persona FROM Personas WHERE documento = ? LIMIT 1',
        [documento]
      );

      if (personRows.length > 0) {
        const personId = personRows[0].id_persona;
        const isInside = await Person.isInside(personId);

        if (isInside) {
          await Access.registerExit(personId, userId);
          result.action = 'salida';
        } else {
          await Access.registerEntry(personId, userId, 'entrada');
          result.action = 'entrada';
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error en scanComplete:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar escaneo completo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas diarias
export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const stats = await Access.getDailyStats(date);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error en getDailyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};
