// CSV Parser - Procesador de archivos CSV
import { parse } from 'csv-parse/sync';

export const parseCSVFile = async (fileBuffer, delimiter = ',') => {
  try {
    console.log('📖 Iniciando parseo de archivo CSV...');
    const content = fileBuffer.toString('utf-8');
    
    if (!content || content.trim().length === 0) {
      throw new Error('El archivo CSV está vacío');
    }
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('El archivo CSV no contiene datos');
    }
    
    console.log(`📊 Líneas encontradas: ${lines.length}`);
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      delimiter: delimiter,
      trim: true,
      bom: true,
      relax_column_count: true, // Permitir diferentes números de columnas
      relax_quotes: true // Manejar comillas de manera más flexible
    });
    
    console.log(`📋 Registros parseados: ${records.length}`);
    
    if (records.length === 0) {
      throw new Error('No se pudieron leer datos del archivo CSV');
    }
    
    // Verificar que tenemos encabezados válidos
    const firstRecord = records[0];
    if (!firstRecord || Object.keys(firstRecord).length === 0) {
      throw new Error('No se encontraron encabezados válidos en el archivo CSV');
    }
    
    console.log('📋 Encabezados encontrados:', Object.keys(firstRecord));
    
    // Limpiar datos: normalizar valores y eliminar filas completamente vacías
    const cleanedRecords = records
      .filter(record => {
        // Mantener registro si tiene al menos un valor no vacío
        return Object.values(record).some(val => val !== null && val !== undefined && String(val).trim() !== '');
      })
      .map(record => {
        // Normalizar valores
        const normalizedRecord = {};
        for (const [key, value] of Object.entries(record)) {
          // Limpiar nombre de columna
          const cleanKey = String(key).trim();
          if (value === null || value === undefined) {
            normalizedRecord[cleanKey] = '';
          } else if (typeof value === 'string') {
            normalizedRecord[cleanKey] = value.trim();
          } else {
            normalizedRecord[cleanKey] = String(value).trim();
          }
        }
        return normalizedRecord;
      });
    
    console.log(`✅ Archivo CSV parseado exitosamente: ${cleanedRecords.length} registros válidos`);
    
    if (cleanedRecords.length === 0) {
      throw new Error('No se encontraron datos válidos en el archivo CSV');
    }

    return {
      success: true,
      data: cleanedRecords,
      totalRows: cleanedRecords.length
    };
  } catch (error) {
    console.error('❌ Error parsing CSV file:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al procesar el archivo CSV'
    };
  }
};

export const detectDelimiter = (fileBuffer) => {
  const content = fileBuffer.toString('utf-8');
  const firstLine = content.split('\n')[0];
  
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detectedDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }
  
  return detectedDelimiter;
};

export const detectColumns = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('⚠️  detectColumns CSV: datos vacíos o inválidos');
    return [];
  }
  
  const firstRow = data[0];
  if (!firstRow || typeof firstRow !== 'object') {
    console.warn('⚠️  detectColumns CSV: primera fila inválida');
    return [];
  }
  
  const columnNames = Object.keys(firstRow);
  console.log('📋 Columnas CSV encontradas:', columnNames);
  
  const detectedColumns = columnNames.map(key => {
    const detected = detectFieldType(key, firstRow[key], data);
    console.log(`  - "${key}" → ${detected || 'no detectado'}`);
    return {
      original: key,
      detected: detected
    };
  });
  
  console.log(`✅ Detección CSV completada: ${detectedColumns.filter(c => c.detected).length} de ${detectedColumns.length} columnas detectadas`);
  
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
  
  // Nombres
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
  
  // Cargo
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
  
  // Detección por contenido del valor
  if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
    const valueStr = String(sampleValue).toLowerCase().trim();
    
    // Si parece un email
    if (valueStr.includes('@') && valueStr.includes('.')) {
      return 'email';
    }
    
    // Si parece un número de documento
    if (/^\d{7,15}$/.test(valueStr.replace(/[\s\-\.]/g, ''))) {
      if (!normalizedName.includes('telefono') && !normalizedName.includes('tel')) {
        return 'documento';
      }
    }
  }
  
  return null;
};








