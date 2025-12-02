// Data Validator - Validador de datos de importación
import pool from '../utils/dbPool.js';

export const validateUserRow = async (row, index, fieldMapping) => {
  const errors = [];
  const warnings = [];
  
  // Mapear campos según el mapeo proporcionado
  const mappedRow = {};
  for (const [systemField, fileField] of Object.entries(fieldMapping)) {
    mappedRow[systemField] = row[fileField] || '';
  }
  
  // Validar documento (obligatorio)
  // Solo validamos que no esté vacío, sin restricciones de formato
  if (!mappedRow.documento || mappedRow.documento.toString().trim() === '') {
    errors.push({
      field: 'documento',
      message: 'Documento es obligatorio',
      row: index + 1
    });
  }
  // NOTA: Ya no validamos el formato del documento para permitir cualquier formato válido
  // NOTA: Ya no marcamos como error si el documento existe, porque ahora actualizamos en lugar de insertar
  
  // Validar tipo de documento
  const validTypes = ['CC', 'CE', 'TI', 'PA', 'NIT'];
  const tipoDoc = mappedRow.tipo_documento?.toUpperCase().trim() || 'CC';
  if (!validTypes.includes(tipoDoc)) {
    warnings.push({
      field: 'tipo_documento',
      message: `Tipo de documento inválido, se usará CC por defecto`,
      row: index + 1
    });
    mappedRow.tipo_documento = 'CC';
  }
  
  // Validar nombres (obligatorio)
  if (!mappedRow.nombres || mappedRow.nombres.toString().trim() === '') {
    errors.push({
      field: 'nombres',
      message: 'Nombres son obligatorios',
      row: index + 1
    });
  }
  
  // Apellidos es opcional - si no está presente, se usará cadena vacía
  if (!mappedRow.apellidos) {
    mappedRow.apellidos = '';
  }
  
  // Validar email (opcional pero debe ser válido si existe)
  if (mappedRow.email && mappedRow.email.toString().trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mappedRow.email.toString().trim())) {
      warnings.push({
        field: 'email',
        message: 'Formato de email cuestionable',
        row: index + 1
      });
    }
  }
  
  // Validar rol
  const validRoles = ['aprendiz', 'instructor', 'administrativo', 'visitante'];
  const rol = mappedRow.rol?.toLowerCase().trim() || 'aprendiz';
  if (!validRoles.includes(rol)) {
    warnings.push({
      field: 'rol',
      message: `Rol inválido, se usará "aprendiz" por defecto`,
      row: index + 1
    });
    mappedRow.rol = 'aprendiz';
  }
  
  // Validar estado (opcional, por defecto 'activo')
  // Solo validar si el campo está en el mapeo
  let estado = 'activo'; // Valor por defecto si no se especifica
  
  if (fieldMapping.estado && mappedRow.estado !== undefined && mappedRow.estado !== null && mappedRow.estado !== '') {
    const estadoRaw = mappedRow.estado.toString().trim().toUpperCase();
    
    // Estados que se consideran ACTIVOS
    const estadosActivos = [
      'EN FORMACION',
      'EN FORMACIÓN',
      'FORMACION',
      'FORMACIÓN',
      'ACTIVO',
      'ACTIVA',
      'VIGENTE',
      'ACTIVO',
      'EN CURSO',
      'MATRICULADO',
      'REGULAR'
    ];
    
    // Estados que se consideran INACTIVOS (aplazado, cancelado, etc.)
    const estadosInactivos = [
      'CANCELADO',
      'CANCELADA',
      'INACTIVO',
      'INACTIVA',
      'APLAZADO',
      'APLAZADA',
      'RETIRADO',
      'RETIRADA',
      'SUSPENDIDO',
      'SUSPENDIDA',
      'EGRESADO',
      'EGRESADA',
      'FINALIZADO',
      'FINALIZADA',
      'NO MATRICULADO',
      'NO MATRICULADA',
      'BAJA',
      'DESERTOR',
      'DESERTORA'
    ];
    
    // Verificar si el estado está en la lista de activos
    if (estadosActivos.includes(estadoRaw)) {
      estado = 'activo';
    } 
    // Verificar si el estado está en la lista de inactivos
    else if (estadosInactivos.includes(estadoRaw)) {
      estado = 'inactivo';
      // Mostrar advertencia informativa para estados inactivos conocidos
      warnings.push({
        field: 'estado',
        message: `Estado "${mappedRow.estado}" reconocido como inactivo. Se establecerá como "inactivo" en el sistema.`,
        row: index + 1
      });
    }
    // Si no coincide con ningún estado conocido, por defecto es INACTIVO
    // (cualquier estado desconocido se considera inactivo)
    else if (estadoRaw) {
      estado = 'inactivo';
      warnings.push({
        field: 'estado',
        message: `⚠️ Estado "${mappedRow.estado}" no reconocido. Por defecto se establecerá como "inactivo" en el sistema.`,
        row: index + 1
      });
    }
  }
  
  mappedRow.estado = estado;

  // Validar campos específicos por rol
  // Nota: 'rol' ya fue declarado arriba, reutilizamos esa variable

  // Validar campos de APRENDICES
  if (rol === 'aprendiz') {
    // Validar ficha si está presente
    if (mappedRow.ficha && mappedRow.ficha.toString().trim() !== '') {
      const ficha = mappedRow.ficha.toString().trim();
      if (!/^[0-9]{6,8}$/.test(ficha)) {
        warnings.push({
          field: 'ficha',
          message: `Formato de ficha cuestionable: ${ficha}`,
          row: index + 1
        });
      }
    }

    // Validar programa_formacion si está presente
    if (mappedRow.programa_formacion && mappedRow.programa_formacion.toString().trim() !== '') {
      // Validación básica: no vacío
    }

    // Validar jornada
    if (mappedRow.jornada) {
      const jornada = mappedRow.jornada.toLowerCase().trim();
      const validJornadas = ['diurna', 'nocturna', 'mixta'];
      if (!validJornadas.includes(jornada)) {
        warnings.push({
          field: 'jornada',
          message: `Jornada inválida: ${mappedRow.jornada}. Se usará "diurna" por defecto`,
          row: index + 1
        });
        mappedRow.jornada = 'diurna';
      }
    }

    // Validar fechas de formación
    if (mappedRow.fecha_inicio_formacion) {
      const fechaInicio = new Date(mappedRow.fecha_inicio_formacion);
      if (isNaN(fechaInicio.getTime())) {
        warnings.push({
          field: 'fecha_inicio_formacion',
          message: `Fecha de inicio inválida: ${mappedRow.fecha_inicio_formacion}`,
          row: index + 1
        });
        mappedRow.fecha_inicio_formacion = null;
      }
    }

    if (mappedRow.fecha_fin_formacion) {
      const fechaFin = new Date(mappedRow.fecha_fin_formacion);
      if (isNaN(fechaFin.getTime())) {
        warnings.push({
          field: 'fecha_fin_formacion',
          message: `Fecha de fin inválida: ${mappedRow.fecha_fin_formacion}`,
          row: index + 1
        });
        mappedRow.fecha_fin_formacion = null;
      }
    }
  }

  // Validar campos de INSTRUCTORES
  if (rol === 'instructor') {
    // Validar tipo_contrato
    if (mappedRow.tipo_contrato) {
      const tipoContrato = mappedRow.tipo_contrato.toLowerCase().trim();
      const validTipos = ['planta', 'contrato', 'catedra'];
      if (!validTipos.includes(tipoContrato)) {
        warnings.push({
          field: 'tipo_contrato',
          message: `Tipo de contrato inválido: ${mappedRow.tipo_contrato}`,
          row: index + 1
        });
      }
    }

    // Validar ambientes_clase (array separado por comas)
    if (mappedRow.ambientes_clase) {
      const ambientes = mappedRow.ambientes_clase.toString().split(',').map(a => a.trim()).filter(a => a);
      if (ambientes.length === 0) {
        warnings.push({
          field: 'ambientes_clase',
          message: 'No se encontraron ambientes válidos',
          row: index + 1
        });
      }
    }

    // Validar fichas_atiende (array separado por comas)
    if (mappedRow.fichas_atiende) {
      const fichas = mappedRow.fichas_atiende.toString().split(',').map(f => f.trim()).filter(f => f);
      if (fichas.length === 0) {
        warnings.push({
          field: 'fichas_atiende',
          message: 'No se encontraron fichas válidas',
          row: index + 1
        });
      }
    }
  }

  // Validar campos de ADMINISTRATIVOS
  if (rol === 'administrativo') {
    // Validar cargo si está presente
    if (mappedRow.cargo && mappedRow.cargo.toString().trim() !== '') {
      // Validación básica: no vacío
    }

    // Validar ambiente_trabajo si está presente
    if (mappedRow.ambiente_trabajo && mappedRow.ambiente_trabajo.toString().trim() !== '') {
      // Validación básica: no vacío
    }

    // Validar dependencia si está presente
    if (mappedRow.dependencia && mappedRow.dependencia.toString().trim() !== '') {
      // Validación básica: no vacío
    }
  }

  // Validar RH (para todos los roles)
  if (mappedRow.rh && mappedRow.rh.toString().trim() !== '') {
    const rh = mappedRow.rh.toString().trim().toUpperCase();
    const validRH = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validRH.includes(rh)) {
      warnings.push({
        field: 'rh',
        message: `Grupo sanguíneo inválido: ${mappedRow.rh}`,
        row: index + 1
      });
    } else {
      mappedRow.rh = rh; // Normalizar a mayúsculas
    }
  }
  
  return {
    row: mappedRow,
    originalRow: row,
    errors,
    warnings,
    isValid: errors.length === 0
  };
};

export const validateBatch = async (rows, fieldMapping, startIndex = 0) => {
  const results = [];
  
  for (let i = 0; i < rows.length; i++) {
    const rowIndex = startIndex + i;
    const validation = await validateUserRow(rows[i], rowIndex, fieldMapping);
    // Agregar el índice de fila al resultado para referencia
    results.push({
      ...validation,
      rowIndex: rowIndex + 1 // +1 porque las filas empiezan en 1 para el usuario
    });
  }
  
  const validRows = results.filter(r => r.isValid).map(r => r.row);
  const invalidRows = results.filter(r => !r.isValid);
  // Corregir: usar rowIndex en lugar de r.row (que es el objeto de usuario)
  const allErrors = results.flatMap(r => r.errors.map(e => ({ 
    ...e, 
    row: e.row || r.rowIndex // Usar el row del error si existe, sino el rowIndex del resultado
  })));
  const allWarnings = results.flatMap(r => r.warnings.map(w => ({ 
    ...w, 
    row: w.row || r.rowIndex // Usar el row del warning si existe, sino el rowIndex del resultado
  })));
  
  return {
    results,
    validRows,
    invalidRows,
    errors: allErrors,
    warnings: allWarnings,
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length
  };
};







