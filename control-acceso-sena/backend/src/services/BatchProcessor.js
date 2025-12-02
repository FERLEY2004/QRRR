// Batch Processor - Procesador por lotes para importación masiva
import pool from '../utils/dbPool.js';
import { validateBatch } from '../utils/dataValidator.js';
import LogService from './LogService.js';

export class BatchProcessor {
  constructor(batchSize = 50, userId = null) {
    this.batchSize = batchSize;
    this.userId = userId;
    this.processed = 0;
    this.total = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
    this.warnings = [];
    this.progressCallbacks = [];
  }

  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }

  emitProgress() {
    const progress = {
      processed: this.processed,
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      percentage: Math.round((this.processed / this.total) * 100)
    };
    
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  async processFile(rows, fieldMapping) {
    this.total = rows.length;
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
    this.warnings = [];

    for (let i = 0; i < rows.length; i += this.batchSize) {
      const batch = rows.slice(i, i + this.batchSize);
      const result = await this.processBatch(batch, fieldMapping, i);
      
      this.processed += batch.length;
      this.successful += result.successful;
      this.failed += result.failed;
      this.errors.push(...result.errors);
      this.warnings.push(...result.warnings);
      
      this.emitProgress();
    }

    // Registrar importación en auditoría
    try {
      await LogService.auditoria(
        'Personas',
        null,
        'INSERT',
        null,
        {
          tipo: 'importacion_masiva',
          total_filas: this.total,
          exitosos: this.successful,
          fallidos: this.failed,
          errores_count: this.errors.length
        },
        this.userId || null,
        null
      );

      // Registrar en logs de seguridad
      await LogService.logSeguridad(
        'acceso_sistema',
        this.userId || null,
        `Importación masiva completada: ${this.successful} exitosos, ${this.failed} fallidos de ${this.total} registros`,
        {
          total: this.total,
          exitosos: this.successful,
          fallidos: this.failed,
          tabla: 'Personas'
        },
        null
      );
    } catch (logError) {
      console.error('Error registrando importación en auditoría:', logError.message);
    }

    return {
      total: this.total,
      processed: this.processed,
      successful: this.successful,
      failed: this.failed,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  async processBatch(batch, fieldMapping, startIndex) {
    // Validar lote
    const validationResults = await validateBatch(batch, fieldMapping, startIndex);
    
    let successful = 0;
    let failed = validationResults.invalidCount;
    const errors = [...validationResults.errors];
    const warnings = [...validationResults.warnings];

    // Procesar filas válidas
    if (validationResults.validRows.length > 0) {
      try {
        const insertResult = await this.insertBatch(validationResults.validRows, startIndex);
        successful = insertResult.successful;
        failed += insertResult.failed;
        errors.push(...insertResult.errors);
      } catch (error) {
        console.error('Error insertando lote:', error);
        failed += validationResults.validRows.length;
        errors.push({
          row: startIndex + 1,
          message: `Error al insertar lote: ${error.message}`,
          field: 'batch',
          batch: true
        });
      }
    }

    return {
      successful,
      failed,
      errors,
      warnings
    };
  }

  async insertBatch(rows, startIndex = 0) {
    if (rows.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    // Obtener IDs de roles por defecto
    const [roles] = await pool.execute('SELECT id_rol, nombre_rol FROM Roles');
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.nombre_rol.toLowerCase()] = r.id_rol;
    });

    // Insertar una por una para manejar errores individuales
    const insertedIds = [];
    const errors = [];
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = startIndex + i;
      
      try {
        const rol = row.rol?.toLowerCase() || 'aprendiz';
        const idRol = roleMap[rol] || roleMap['aprendiz'];
        const nombreCompleto = `${row.nombres?.toString().trim() || ''} ${row.apellidos?.toString().trim() || ''}`.trim();
        const nameParts = nombreCompleto.split(' ').filter(Boolean);
        const nombresValue = row.nombres?.toString().trim() || nameParts.slice(0, -1).join(' ') || nombreCompleto;
        const apellidosValue = row.apellidos?.toString().trim() || (nameParts.length > 1 ? nameParts.slice(-1).join(' ') : '');
        
        if (!nombreCompleto) {
          throw new Error('Nombre completo no puede estar vacío');
        }
        
        const documento = row.documento?.toString().trim() || '';
        const tipoDocumento = (row.tipo_documento?.toUpperCase() || 'CC').trim();
        
        // VERIFICAR SI LA PERSONA YA EXISTE antes de insertar
        const [existing] = await pool.execute(
          `SELECT id_persona, estado FROM Personas 
           WHERE documento = ? AND tipo_documento = ?`,
          [documento, tipoDocumento]
        );
        
        // Preparar campos adicionales
        const estado = row.estado?.toLowerCase().trim() || 'activo';
        const validEstados = ['activo', 'inactivo', 'suspendido'];
        const estadoFinal = validEstados.includes(estado) ? estado : 'activo';
        
        // Campos nuevos
        const rh = row.rh?.toString().trim().toUpperCase() || null;
        
        // Procesar fechas: convertir cadenas vacías a null y validar fechas
        // También maneja números seriales de Excel (ej: 45367 = fecha en Excel)
        const procesarFecha = (fecha) => {
          if (!fecha) return null;
          
          const fechaStr = fecha.toString().trim();
          if (fechaStr === '' || fechaStr === 'null' || fechaStr === 'NULL') return null;
          
          // Detectar si es un número serial de Excel (números entre 1 y 100000)
          // Los números seriales de Excel son enteros o decimales sin formato de fecha
          const numFecha = parseFloat(fechaStr);
          const isNumeric = !isNaN(numFecha) && isFinite(numFecha) && fechaStr.match(/^\d+(\.\d+)?$/);
          
          if (isNumeric && numFecha >= 1 && numFecha <= 100000) {
            // Es un número serial de Excel
            // Convertir serial de Excel a fecha JavaScript
            // Excel cuenta desde 1900-01-01 como día 1
            // Fórmula: fecha = 1900-01-01 + (serial - 1) días
            // Pero Excel tiene un bug: trata 1900 como año bisiesto (no lo es)
            // Para números >= 60 (después de 29 de febrero de 1900), restamos 1 día
            const excelEpoch = new Date(1900, 0, 1); // 1 de enero de 1900
            const daysToAdd = numFecha >= 60 ? numFecha - 2 : numFecha - 1; // Compensar bug de Excel
            const fechaDate = new Date(excelEpoch.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            
            // Validar que sea una fecha razonable (entre 1900 y 2100)
            const year = fechaDate.getFullYear();
            if (year >= 1900 && year <= 2100) {
              const month = String(fechaDate.getMonth() + 1).padStart(2, '0');
              const day = String(fechaDate.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } else {
              console.warn(`Año fuera de rango (${year}) para serial Excel ${numFecha}, se usará null`);
              return null;
            }
          }
          
          // Intentar parsear como fecha normal (texto con formato de fecha)
          const fechaDate = new Date(fechaStr);
          
          // Verificar que sea una fecha válida
          if (isNaN(fechaDate.getTime())) {
            console.warn(`Fecha inválida: "${fechaStr}", se usará null`);
            return null;
          }
          
          // Validar que sea una fecha razonable
          const year = fechaDate.getFullYear();
          if (year < 1900 || year > 2100) {
            console.warn(`Año fuera de rango (${year}) para fecha "${fechaStr}", se usará null`);
            return null;
          }
          
          // Retornar en formato YYYY-MM-DD para MySQL
          const month = String(fechaDate.getMonth() + 1).padStart(2, '0');
          const day = String(fechaDate.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const fechaInicioFormacion = procesarFecha(row.fecha_inicio_formacion);
        const fechaFinFormacion = procesarFecha(row.fecha_fin_formacion);
        const cargo = row.cargo?.toString().trim() || null;
        const tipoContrato = row.tipo_contrato?.toLowerCase().trim() || null;
        
        // Preparar campos de ficha y programa
        const codigoFicha = row.ficha?.toString().trim() || null;
        const codigoPrograma = row.codigo_programa?.toString().trim() || row.programa_formacion?.toString().trim() || null;
        const nombrePrograma = row.nombre_programa?.toString().trim() || codigoPrograma;
        const nivelPrograma = this.normalizeNivel(row.nivel?.toString().trim() || row.nivel_programa?.toString().trim());
        const jornadaFicha = this.normalizeJornada(row.jornada?.toString().trim());
        const estadoFicha = this.normalizeFichaEstado(row.estado_ficha || row.estado);
        const numeroAprendices = Number(row.numero_aprendices) || null;
        const capacidadMaxima = Number(row.capacidad_maxima) || null;
        const estadoFichaFinal = estadoFicha || 'activa';

        const idPrograma = await this.ensureProgramRecord(codigoPrograma, nombrePrograma, nivelPrograma);
        let idFicha = null;
        if (rol === 'aprendiz' && codigoFicha && idPrograma) {
          idFicha = await this.ensureFichaRecord({
            codigoFicha,
            idPrograma,
            jornada: jornadaFicha,
            fechaInicio: fechaInicioFormacion,
            fechaFin: fechaFinFormacion,
            estado: estadoFichaFinal,
            numeroAprendices,
            capacidadMaxima
          });
        }
        
        // Usar fechas de la ficha si están disponibles, sino usar las del Excel
        if (existing.length > 0) {
          // La persona ya existe, actualizar en lugar de insertar
          const personaExistente = existing[0];
          
          await pool.execute(
            `UPDATE Personas 
             SET nombres = ?, apellidos = ?, estado = ?, id_rol = ?, 
                 email = COALESCE(?, email), telefono = COALESCE(?, telefono),
                 rh = COALESCE(?, rh),
                 id_ficha = COALESCE(?, id_ficha),
                 cargo = COALESCE(?, cargo),
                 tipo_contrato = COALESCE(?, tipo_contrato)
             WHERE documento = ? AND tipo_documento = ?`,
            [
              nombresValue,
              apellidosValue,
              estadoFinal,
              idRol || null,
              row.email?.toString().trim() || null,
              row.telefono?.toString().trim() || null,
              rh,
              idFicha,
              cargo,
              tipoContrato,
              documento,
              tipoDocumento
            ]
          );
          
          await this.processRoleSpecificData(personaExistente.id_persona, row, rol);
          insertedIds.push(personaExistente.id_persona);
          successful++;
        } else {
          // La persona NO existe, insertar nueva
          const [result] = await pool.execute(
            `INSERT INTO Personas 
             (id_rol, tipo_documento, documento, nombres, apellidos, estado, email, telefono, foto, 
              rh, id_ficha, cargo, tipo_contrato, fecha_registro)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              idRol || null,
              tipoDocumento,
              documento,
              nombresValue,
              apellidosValue,
              estadoFinal,
              row.email?.toString().trim() || null,
              row.telefono?.toString().trim() || null,
              null,  // foto
              rh,
              idFicha,
              cargo,
              tipoContrato
            ]
          );

          await this.processRoleSpecificData(result.insertId, row, rol);
          insertedIds.push(result.insertId);
          successful++;
        }
      } catch (error) {
        console.error(`Error insertando fila ${rowIndex + 1} con documento ${row.documento}:`, error);
        failed++;
        errors.push({
          row: rowIndex + 1,
          field: 'database',
          message: `Error al insertar: ${error.message}`,
          documento: row.documento
        });
      }
    }

    return {
      successful,
      failed,
      errors
    };
  }

  /**
   * Procesar datos específicos por rol (asignaciones, ambientes, etc.)
   */
  async processRoleSpecificData(personId, row, rol) {
    try {
      // Para APRENDICES: Asignar ambiente
      if (rol === 'aprendiz' && row.ambiente_asignado) {
        const nombreAmbiente = row.ambiente_asignado.toString().trim();
        
        // Buscar ambiente por nombre
        const [ambientes] = await pool.execute(
          'SELECT id_ambiente FROM Ambientes WHERE nombre_ambiente LIKE ? OR codigo_ambiente = ? LIMIT 1',
          [`%${nombreAmbiente}%`, nombreAmbiente]
        );
        
        if (ambientes.length > 0) {
          const idAmbiente = ambientes[0].id_ambiente;
          
          // Verificar si ya existe la asignación
          const [asignaciones] = await pool.execute(
            'SELECT id_asignacion FROM Asignaciones_Ambientes WHERE id_persona = ? AND id_ambiente = ?',
            [personId, idAmbiente]
          );
          
          if (asignaciones.length === 0) {
            await pool.execute(
              `INSERT INTO Asignaciones_Ambientes (id_persona, id_ambiente, tipo_asignacion, activa)
               VALUES (?, ?, 'aprendiz', TRUE)`,
              [personId, idAmbiente]
            );
          }
        }
      }

      // Para INSTRUCTORES: Asignar múltiples ambientes
      if (rol === 'instructor' && row.ambientes_clase) {
        const ambientesList = row.ambientes_clase.toString().split(',').map(a => a.trim()).filter(a => a);
        const horarios = row.horarios_clase?.toString().trim() || null;
        
        for (const nombreAmbiente of ambientesList) {
          const [ambientes] = await pool.execute(
            'SELECT id_ambiente FROM Ambientes WHERE nombre_ambiente LIKE ? OR codigo_ambiente = ? LIMIT 1',
            [`%${nombreAmbiente}%`, nombreAmbiente]
          );
          
          if (ambientes.length > 0) {
            const idAmbiente = ambientes[0].id_ambiente;
            
            // Verificar si ya existe la asignación
            const [asignaciones] = await pool.execute(
              'SELECT id_asignacion FROM Asignaciones_Ambientes WHERE id_persona = ? AND id_ambiente = ?',
              [personId, idAmbiente]
            );
            
            if (asignaciones.length === 0) {
              await pool.execute(
                `INSERT INTO Asignaciones_Ambientes (id_persona, id_ambiente, tipo_asignacion, horario_asignado, activa)
                 VALUES (?, ?, 'instructor', ?, TRUE)`,
                [personId, idAmbiente, horarios]
              );
            }
          }
        }
      }

      // Para ADMINISTRATIVOS: Asignar ambiente de trabajo
      if (rol === 'administrativo' && row.ambiente_trabajo) {
        const nombreAmbiente = row.ambiente_trabajo.toString().trim();
        
        const [ambientes] = await pool.execute(
          'SELECT id_ambiente FROM Ambientes WHERE nombre_ambiente LIKE ? OR codigo_ambiente = ? LIMIT 1',
          [`%${nombreAmbiente}%`, nombreAmbiente]
        );
        
        if (ambientes.length > 0) {
          const idAmbiente = ambientes[0].id_ambiente;
          const horarioOficina = row.horario_oficina?.toString().trim() || null;
          
          const [asignaciones] = await pool.execute(
            'SELECT id_asignacion FROM Asignaciones_Ambientes WHERE id_persona = ? AND id_ambiente = ?',
            [personId, idAmbiente]
          );
          
          if (asignaciones.length === 0) {
            await pool.execute(
              `INSERT INTO Asignaciones_Ambientes (id_persona, id_ambiente, tipo_asignacion, horario_asignado, activa)
               VALUES (?, ?, 'administrativo', ?, TRUE)`,
              [personId, idAmbiente, horarioOficina]
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error procesando datos específicos de rol para persona ${personId}:`, error);
      // No fallar la importación completa por esto
    }
  }

  normalizeNivel(value) {
    if (!value) return 'Técnico';
    const normalized = value.trim();
    const allowed = ['Técnico', 'Tecnológico', 'Especialización', 'Complementaria'];
    if (allowed.includes(normalized)) {
      return normalized;
    }
    const lower = normalized.toLowerCase();
    if (lower.includes('tecnol')) return 'Tecnológico';
    if (lower.includes('especializ')) return 'Especialización';
    if (lower.includes('complement')) return 'Complementaria';
    return 'Técnico';
  }

  normalizeJornada(value) {
    const jornada = (value || 'diurna').toString().toLowerCase().trim();
    if (['diurna', 'nocturna', 'mixta'].includes(jornada)) {
      return jornada;
    }
    if (jornada.includes('noci')) return 'nocturna';
    if (jornada.includes('mix')) return 'mixta';
    return 'diurna';
  }

  normalizeFichaEstado(value) {
    const estado = (value || 'activa').toString().toLowerCase().trim();
    const allowed = ['activa', 'finalizada', 'cancelada'];
    return allowed.includes(estado) ? estado : 'activa';
  }

  async ensureProgramRecord(codigoPrograma, nombrePrograma, nivelPrograma) {
    if (!codigoPrograma) {
      return null;
    }
    const code = codigoPrograma.trim();
    const [existing] = await pool.execute(
      'SELECT id_programa FROM programas_formacion WHERE codigo_programa = ? LIMIT 1',
      [code]
    );
    if (existing.length > 0) {
      return existing[0].id_programa;
    }

    const [result] = await pool.execute(
      `INSERT INTO programas_formacion (codigo_programa, nombre_programa, nivel, estado)
       VALUES (?, ?, ?, 'activo')`,
      [code, nombrePrograma || code, nivelPrograma || 'Técnico']
    );
    return result.insertId;
  }

  async ensureFichaRecord({
    codigoFicha,
    idPrograma,
    jornada,
    fechaInicio,
    fechaFin,
    estado,
    numeroAprendices,
    capacidadMaxima
  }) {
    if (!codigoFicha || !idPrograma) {
      return null;
    }
    const [existing] = await pool.execute(
      'SELECT id_ficha FROM fichas WHERE codigo_ficha = ? LIMIT 1',
      [codigoFicha]
    );
    if (existing.length > 0) {
      await pool.execute(
        `UPDATE fichas
         SET id_programa = ?, jornada = ?, fecha_inicio = COALESCE(?, fecha_inicio),
             fecha_fin = COALESCE(?, fecha_fin), estado = ?, numero_aprendices = COALESCE(?, numero_aprendices),
             capacidad_maxima = COALESCE(?, capacidad_maxima)
         WHERE id_ficha = ?`,
        [idPrograma, jornada, fechaInicio, fechaFin, estado, numeroAprendices, capacidadMaxima, existing[0].id_ficha]
      );
      return existing[0].id_ficha;
    }

    const [result] = await pool.execute(
      `INSERT INTO fichas 
       (codigo_ficha, id_programa, jornada, fecha_inicio, fecha_fin, estado, numero_aprendices, capacidad_maxima)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoFicha,
        idPrograma,
        jornada,
        fechaInicio,
        fechaFin,
        estado,
        numeroAprendices ?? 0,
        capacidadMaxima ?? null
      ]
    );

    return result.insertId;
  }
}

