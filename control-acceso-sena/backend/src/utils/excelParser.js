// Excel Parser - Procesador de archivos Excel
import * as XLSX from 'xlsx';

export const parseExcelFile = async (fileBuffer) => {
  try {
    console.log('📖 Iniciando parseo de archivo Excel...');
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellDates: false,
      cellNF: false,
      cellText: false
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El archivo Excel no contiene hojas');
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`No se pudo leer la hoja "${sheetName}"`);
    }
    
    // Convertir a JSON con opciones mejoradas
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Convertir números a texto
      defval: '', // Valor por defecto para celdas vacías
      blankrows: false, // No incluir filas vacías
      header: 1 // Primero obtener como array para verificar estructura
    });
    
    console.log(`📊 Filas encontradas (incluyendo encabezado): ${rawData.length}`);
    
    if (rawData.length === 0) {
      throw new Error('El archivo Excel está vacío');
    }
    
    // Verificar que la primera fila contiene encabezados válidos
    const headers = rawData[0];
    if (!headers || headers.length === 0) {
      throw new Error('No se encontraron encabezados en el archivo Excel');
    }
    
    console.log('📋 Encabezados encontrados:', headers);
    
    // Limpiar y normalizar encabezados
    const cleanHeaders = headers.map((h, idx) => {
      if (!h || h === '') {
        return `Columna_${idx + 1}`;
      }
      // Limpiar espacios y caracteres especiales al inicio/final
      return String(h).trim();
    });
    
    // Convertir a JSON con encabezados limpios
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
      blankrows: false,
      header: cleanHeaders
    });
    
    // Limpiar datos: eliminar filas completamente vacías y normalizar valores
    const cleanedData = data
      .filter(row => {
        // Mantener fila si tiene al menos un valor no vacío
        return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
      })
      .map(row => {
        // Normalizar valores: convertir null/undefined a string vacío, trim strings
        const normalizedRow = {};
        for (const [key, value] of Object.entries(row)) {
          if (value === null || value === undefined) {
            normalizedRow[key] = '';
          } else if (typeof value === 'string') {
            normalizedRow[key] = value.trim();
          } else {
            normalizedRow[key] = String(value).trim();
          }
        }
        return normalizedRow;
      });
    
    console.log(`✅ Archivo parseado exitosamente: ${cleanedData.length} filas de datos válidas`);
    console.log(`📋 Columnas detectadas: ${Object.keys(cleanedData[0] || {}).length}`);
    
    if (cleanedData.length === 0) {
      throw new Error('No se encontraron datos válidos en el archivo Excel');
    }

    return {
      success: true,
      data: cleanedData,
      totalRows: cleanedData.length,
      sheetName
    };
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al procesar el archivo Excel'
    };
  }
};

export const detectColumns = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('⚠️  detectColumns: datos vacíos o inválidos');
    return [];
  }
  
  const firstRow = data[0];
  if (!firstRow || typeof firstRow !== 'object') {
    console.warn('⚠️  detectColumns: primera fila inválida');
    return [];
  }
  
  const columnNames = Object.keys(firstRow);
  console.log('📋 Columnas encontradas en el archivo:', columnNames);
  
  const detectedColumns = columnNames.map(key => {
    const detected = detectFieldType(key, firstRow[key], data);
    console.log(`  - "${key}" → ${detected || 'no detectado'}`);
    return {
      original: key,
      detected: detected
    };
  });
  
  console.log(`✅ Detección completada: ${detectedColumns.filter(c => c.detected).length} de ${detectedColumns.length} columnas detectadas`);
  
  return detectedColumns;
};

const detectFieldType = (columnName, sampleValue, allData = []) => {
  const name = columnName.toLowerCase().trim();
  
  // Normalizar nombre eliminando espacios, guiones, underscores
  const normalizedName = name.replace(/[\s\-_]/g, '');
  
  // Detección por nombre de columna (más exhaustiva)
  
  // Documento / Identificación
  if (normalizedName.includes('documento') || 
      normalizedName.includes('cedula') || 
      normalizedName.includes('identificacion') ||
      normalizedName.includes('identificación') ||
      (normalizedName.includes('numero') && normalizedName.includes('documento')) ||
      normalizedName.includes('numerodocumento') ||
      normalizedName.includes('numdoc') ||
      normalizedName.includes('id') ||
      normalizedName === 'doc' ||
      normalizedName === 'cc' ||
      normalizedName === 'nit' ||
      normalizedName === 'ndoc') {
    return 'documento';
  }
  
  // Tipo de documento
  if ((normalizedName.includes('tipo') && normalizedName.includes('documento')) ||
      normalizedName === 'tipodoc' ||
      normalizedName === 'tipodocumento') {
    return 'tipo_documento';
  }
  
  // Nombres (debe venir antes de apellidos para evitar falsos positivos)
  if ((normalizedName.includes('nombre') && !normalizedName.includes('apellido')) ||
      normalizedName === 'nombres' ||
      normalizedName === 'nombre' ||
      normalizedName === 'primer' ||
      normalizedName === 'primeronombre') {
    return 'nombres';
  }
  
  // Apellidos
  if (normalizedName.includes('apellido') ||
      normalizedName === 'apellidos' ||
      normalizedName === 'apellido' ||
      normalizedName === 'segundo' ||
      normalizedName === 'segundonombre') {
    return 'apellidos';
  }
  
  // Email / Correo
  if (normalizedName.includes('email') || 
      normalizedName.includes('correo') ||
      normalizedName.includes('e-mail') ||
      normalizedName === 'mail') {
    return 'email';
  }
  
  // Teléfono
  if (normalizedName.includes('telefono') ||
      normalizedName.includes('tel') ||
      normalizedName.includes('celular') ||
      normalizedName.includes('movil') ||
      normalizedName.includes('phone')) {
    return 'telefono';
  }
  
  // Programa de formación
  if (normalizedName.includes('programa') || 
      normalizedName.includes('formacion') ||
      normalizedName.includes('programadeformacion') ||
      normalizedName === 'programa') {
    return 'programa_formacion';
  }
  
  // Ficha
  if (normalizedName.includes('ficha') ||
      normalizedName === 'codigoficha') {
    return 'ficha';
  }
  
  // Rol
  if (normalizedName.includes('rol') ||
      normalizedName === 'tipo' ||
      normalizedName === 'tipousuario') {
    return 'rol';
  }
  
  // Estado
  if (normalizedName.includes('estado') || 
      normalizedName.includes('status') ||
      normalizedName === 'activo' ||
      normalizedName === 'inactivo') {
    return 'estado';
  }
  
  // Grupo sanguíneo / RH
  if (normalizedName.includes('rh') ||
      normalizedName.includes('gruposanguineo') ||
      normalizedName.includes('sangre') ||
      normalizedName.includes('blood')) {
    return 'rh';
  }
  
  // Jornada
  if (normalizedName.includes('jornada') ||
      normalizedName === 'turno') {
    return 'jornada';
  }
  
  // Fechas
  if (normalizedName.includes('fechainicio') ||
      normalizedName.includes('fecha_inicio') ||
      normalizedName.includes('inicioformacion')) {
    return 'fecha_inicio_formacion';
  }
  
  if (normalizedName.includes('fechafin') ||
      normalizedName.includes('fecha_fin') ||
      normalizedName.includes('finformacion')) {
    return 'fecha_fin_formacion';
  }
  
  // Ambiente
  if (normalizedName.includes('ambiente') ||
      normalizedName.includes('aula') ||
      normalizedName.includes('salon')) {
    if (normalizedName.includes('asignado') || normalizedName.includes('trabajo')) {
      return normalizedName.includes('trabajo') ? 'ambiente_trabajo' : 'ambiente_asignado';
    }
    return 'ambiente_asignado';
  }
  
  // Cargo (para administrativos)
  if (normalizedName.includes('cargo') ||
      normalizedName.includes('posicion')) {
    return 'cargo';
  }
  
  // Dependencia
  if (normalizedName.includes('dependencia') ||
      normalizedName.includes('departamento') ||
      normalizedName.includes('area')) {
    return 'dependencia';
  }
  
  // Detección por contenido del valor (si el nombre no ayuda)
  if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
    const valueStr = String(sampleValue).toLowerCase().trim();
    
    // Si parece un email
    if (valueStr.includes('@') && valueStr.includes('.')) {
      return 'email';
    }
    
    // Si parece un número de documento (solo números, 7-15 dígitos)
    if (/^\d{7,15}$/.test(valueStr.replace(/[\s\-\.]/g, ''))) {
      if (!normalizedName.includes('telefono') && !normalizedName.includes('tel')) {
        return 'documento';
      }
    }
    
    // Si parece un teléfono
    if (/^[\d\s\-\+\(\)]{7,15}$/.test(valueStr) && normalizedName.includes('tel')) {
      return 'telefono';
    }
  }
  
  return null;
};








