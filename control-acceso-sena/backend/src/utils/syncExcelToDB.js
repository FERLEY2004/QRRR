// Sistema de Sincronización Excel -> Base de Datos
// Sincroniza datos del Excel con la base de datos según los requerimientos

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../utils/dbPool.js';
import { generateLog, generateReport } from './syncLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const CONFIG = {
  // Archivo de entrada
  inputFile: 'Reporte de Juicios Evaluativos_3066232 (1).xlsx',
  // Directorios
  inputDir: path.join(__dirname, '../../uploads'),
  outputDir: path.join(__dirname, '../../reports'),
  // Mapeo de estados
  estadoMapping: {
    'EN FORMACION': 'activo',
    'EN FORMACIÓN': 'activo',
    'FORMACION': 'activo',
    'FORMACIÓN': 'activo',
    'ACTIVO': 'activo',
    'ACTIVA': 'activo',
    'VIGENTE': 'activo',
    'EN CURSO': 'activo',
    'MATRICULADO': 'activo',
    'REGULAR': 'activo',
    // Cualquier otro estado (cancelado, aplazado, etc.) será inactivo por defecto
  },
  // Columnas esperadas en el Excel
  expectedColumns: {
    tipo_documento: ['Tipo de Documento', 'Tipo Documento', 'Tipo', 'Tipo Doc'],
    documento: ['Número de Documento', 'Documento', 'Número Documento', 'Numero de Documento'],
    nombre: ['Nombre', 'Nombres'],
    apellidos: ['Apellidos', 'Apellido'],
    estado: ['Estado', 'Estado Actual']
  }
};

/**
 * Procesa el archivo Excel y extrae los datos requeridos
 */
async function processExcelFile(filePath) {
  try {
    console.log(`📖 Leyendo archivo Excel: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: ''
    });

    console.log(`✅ Archivo leído: ${rawData.length} filas encontradas`);

    // Detectar columnas automáticamente
    const columnMapping = detectColumns(rawData[0] || {});
    
    if (!columnMapping.documento || !columnMapping.nombre || !columnMapping.apellidos || !columnMapping.estado) {
      throw new Error('No se pudieron detectar todas las columnas requeridas en el Excel');
    }
    
    // Tipo de documento es opcional, si no se encuentra se usa 'CC' por defecto
    if (!columnMapping.tipo_documento) {
      console.warn('⚠️  No se detectó columna "Tipo de Documento", se usará "CC" por defecto');
    }

    console.log('📋 Columnas detectadas:', columnMapping);

    // Procesar y limpiar datos
    const processedData = rawData
      .map((row, index) => {
        try {
          const documento = String(row[columnMapping.documento] || '').trim();
          const tipoDocumento = columnMapping.tipo_documento 
            ? String(row[columnMapping.tipo_documento] || '').trim().toUpperCase() || 'CC'
            : 'CC';
          const nombre = String(row[columnMapping.nombre] || '').trim();
          const apellidos = String(row[columnMapping.apellidos] || '').trim();
          const estadoRaw = String(row[columnMapping.estado] || '').trim().toUpperCase();

          // Validar datos requeridos
          if (!documento || !nombre || !apellidos) {
            return null; // Filtrar filas incompletas
          }
          
          // Validar tipo de documento
          const tiposValidos = ['CC', 'CE', 'TI', 'PA', 'NIT'];
          const tipoDocFinal = tiposValidos.includes(tipoDocumento) ? tipoDocumento : 'CC';

          // Traducir estado
          // Si está en el mapeo de estados activos, usar 'activo'
          // Cualquier otro estado (cancelado, aplazado, etc.) será 'inactivo' por defecto
          let estado = 'inactivo'; // Por defecto inactivo para estados desconocidos
          
          if (CONFIG.estadoMapping[estadoRaw]) {
            estado = CONFIG.estadoMapping[estadoRaw];
            console.log(`✓ Estado "${estadoRaw}" reconocido como activo en fila ${index + 2}`);
          } else if (estadoRaw) {
            // Si hay un estado pero no está en el mapeo, es inactivo por defecto
            estado = 'inactivo';
            console.warn(`⚠️  ADVERTENCIA - Fila ${index + 2}: Estado "${estadoRaw}" no reconocido. Por defecto se establecerá como "inactivo" en el sistema.`);
          } else {
            // Si no hay estado especificado, por defecto es activo
            estado = 'activo';
            console.log(`ℹ️  Fila ${index + 2}: No se especificó estado, se establecerá como "activo" por defecto`);
          }

          return {
            documento,
            tipo_documento: tipoDocFinal,
            nombre: `${nombre} ${apellidos}`.trim(),
            estado: estado === 'activo' ? 'activo' : 'inactivo',
            rowIndex: index + 2 // +2 porque index empieza en 0 y Excel tiene header
          };
        } catch (error) {
          console.error(`Error procesando fila ${index + 2}:`, error.message);
          return null;
        }
      })
      .filter(row => row !== null); // Eliminar filas nulas

    console.log(`✅ Datos procesados: ${processedData.length} registros válidos`);

    // Eliminar duplicados (mantener el más reciente por documento)
    const uniqueData = removeDuplicates(processedData);
    console.log(`✅ Duplicados eliminados: ${processedData.length - uniqueData.length} registros duplicados`);
    console.log(`📊 Total registros únicos: ${uniqueData.length}`);

    return {
      success: true,
      data: uniqueData,
      columnMapping,
      totalRows: rawData.length,
      validRows: processedData.length,
      uniqueRows: uniqueData.length
    };
  } catch (error) {
    console.error('❌ Error procesando Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detecta las columnas del Excel automáticamente
 */
function detectColumns(firstRow) {
  const mapping = {};
  const keys = Object.keys(firstRow);

  // Buscar tipo de documento
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (CONFIG.expectedColumns.tipo_documento.some(col => keyLower.includes(col.toLowerCase()))) {
      mapping.tipo_documento = key;
      break;
    }
  }

  // Buscar documento
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (CONFIG.expectedColumns.documento.some(col => keyLower.includes(col.toLowerCase()))) {
      mapping.documento = key;
      break;
    }
  }

  // Buscar nombre
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (CONFIG.expectedColumns.nombre.some(col => keyLower.includes(col.toLowerCase()))) {
      mapping.nombre = key;
      break;
    }
  }

  // Buscar apellidos
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (CONFIG.expectedColumns.apellidos.some(col => keyLower.includes(col.toLowerCase()))) {
      mapping.apellidos = key;
      break;
    }
  }

  // Buscar estado
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (CONFIG.expectedColumns.estado.some(col => keyLower.includes(col.toLowerCase()))) {
      mapping.estado = key;
      break;
    }
  }

  return mapping;
}

/**
 * Elimina duplicados manteniendo solo el registro más reciente por documento + tipo_documento
 */
function removeDuplicates(data) {
  const documentMap = new Map();

  // Agregar todos los registros al mapa usando documento + tipo_documento como clave
  // El último sobrescribe al anterior (mantiene la primera ocurrencia)
  data.forEach(row => {
    const key = `${row.documento}_${row.tipo_documento || 'CC'}`;
    // Solo agregar si no existe, para mantener la primera ocurrencia
    if (!documentMap.has(key)) {
      documentMap.set(key, row);
    }
  });

  return Array.from(documentMap.values());
}

/**
 * Obtiene el estado actual de una persona en la BD usando documento + tipo_documento
 */
async function getPersonStatus(documento, tipo_documento = 'CC') {
  try {
    const [rows] = await pool.execute(
      `SELECT id_persona, documento, tipo_documento, nombre, estado, rol 
       FROM Personas 
       WHERE documento = ? AND tipo_documento = ?`,
      [documento, tipo_documento]
    );

    if (rows.length === 0) {
      return null; // No existe en BD
    }

    return {
      exists: true,
      id_persona: rows[0].id_persona,
      documento: rows[0].documento,
      tipo_documento: rows[0].tipo_documento,
      nombre: rows[0].nombre,
      estado: rows[0].estado,
      rol: rows[0].rol
    };
  } catch (error) {
    console.error(`Error consultando persona con documento ${documento} y tipo ${tipo_documento}:`, error);
    throw error;
  }
}

/**
 * Sincroniza un registro según los casos definidos
 */
async function syncPerson(excelRow, logEntries) {
  const { documento, tipo_documento = 'CC', nombre, estado: estadoExcel } = excelRow;
  const personInDB = await getPersonStatus(documento, tipo_documento);

  // CASO 1: Usuario ACTIVO en Excel pero NO en BD
  if (estadoExcel === 'activo' && !personInDB) {
    try {
      // Obtener ID del rol "aprendiz"
      const [roleRows] = await pool.execute(
        'SELECT id_rol FROM Roles WHERE nombre_rol = ? LIMIT 1',
        ['aprendiz']
      );
      const idRol = roleRows.length > 0 ? roleRows[0].id_rol : null;

      // Dividir nombre en nombres y apellidos
      const nombreParts = nombre.trim().split(' ');
      const nombresValue = nombreParts[0] || '';
      const apellidosValue = nombreParts.slice(1).join(' ') || '';

      // Insertar nuevo usuario
      await pool.execute(
        `INSERT INTO Personas (nombres, apellidos, documento, tipo_documento, id_rol, estado, fecha_registro)
         VALUES (?, ?, ?, ?, ?, 'ACTIVO', NOW())`,
        [nombresValue, apellidosValue, documento, tipo_documento, idRol]
      );

      logEntries.nuevos.push({
        documento,
        nombre,
        accion: 'INSERTADO',
        estado: 'activo',
        permiso: 'ACCESO PERMITIDO'
      });

      return { case: 1, action: 'inserted', success: true };
    } catch (error) {
      console.error(`Error insertando persona ${documento}:`, error);
      logEntries.errores.push({
        documento,
        nombre,
        accion: 'INSERTAR',
        error: error.message
      });
      return { case: 1, action: 'inserted', success: false, error: error.message };
    }
  }

  // CASO 2: Usuario ACTIVO en Excel y ACTIVO en BD
  if (estadoExcel === 'activo' && personInDB && personInDB.estado === 'activo') {
    logEntries.mantenidos.push({
      documento,
      nombre,
      accion: 'MANTENER',
      estado: 'activo',
      permiso: 'ACCESO PERMITIDO'
    });
    return { case: 2, action: 'maintained', success: true };
  }

  // CASO 3: Usuario INACTIVO en Excel pero ACTIVO en BD
  if (estadoExcel === 'inactivo' && personInDB && personInDB.estado === 'activo') {
    try {
      // Actualizar estado a inactivo
      await pool.execute(
        `UPDATE Personas 
         SET estado = 'inactivo', fecha_actualizacion = NOW()
         WHERE documento = ?`,
        [documento]
      );

      // Cerrar cualquier acceso activo (si existe)
      await pool.execute(
        `UPDATE Accesos 
         SET fecha_salida = NOW(), estado = 'finalizado'
         WHERE id_persona = ? AND fecha_salida IS NULL`,
        [personInDB.id_persona]
      );

      logEntries.inhabilitados.push({
        documento,
        nombre,
        accion: 'INHABILITADO',
        estado_anterior: 'activo',
        estado_nuevo: 'inactivo',
        permiso: 'ACCESO DENEGADO'
      });

      return { case: 3, action: 'deactivated', success: true };
    } catch (error) {
      console.error(`Error inhabilitando persona ${documento}:`, error);
      logEntries.errores.push({
        documento,
        nombre,
        accion: 'INHABILITAR',
        error: error.message
      });
      return { case: 3, action: 'deactivated', success: false, error: error.message };
    }
  }

  // CASO 4: Usuario INACTIVO en Excel e INACTIVO en BD
  if (estadoExcel === 'inactivo' && personInDB && personInDB.estado === 'inactivo') {
    logEntries.mantenidos.push({
      documento,
      nombre,
      accion: 'MANTENER',
      estado: 'inactivo',
      permiso: 'ACCESO DENEGADO'
    });
    return { case: 4, action: 'maintained', success: true };
  }

  // CASO ADICIONAL: Usuario ACTIVO en Excel pero INACTIVO en BD (reactivar)
  if (estadoExcel === 'activo' && personInDB && personInDB.estado === 'inactivo') {
    try {
      // Obtener ID del rol "aprendiz"
      const [roleRows] = await pool.execute(
        'SELECT id_rol FROM Roles WHERE nombre_rol = ? LIMIT 1',
        ['aprendiz']
      );
      const idRol = roleRows.length > 0 ? roleRows[0].id_rol : null;

      // Reactivar usuario
      await pool.execute(
        `UPDATE Personas 
         SET estado = 'activo', nombre = ?, fecha_actualizacion = NOW()
         WHERE documento = ?`,
        [nombre, documento]
      );

      logEntries.reactivados.push({
        documento,
        nombre,
        accion: 'REACTIVADO',
        estado_anterior: 'inactivo',
        estado_nuevo: 'activo',
        permiso: 'ACCESO PERMITIDO'
      });

      return { case: 5, action: 'reactivated', success: true };
    } catch (error) {
      console.error(`Error reactivando persona ${documento}:`, error);
      logEntries.errores.push({
        documento,
        nombre,
        accion: 'REACTIVAR',
        error: error.message
      });
      return { case: 5, action: 'reactivated', success: false, error: error.message };
    }
  }

  // Caso no contemplado
  logEntries.errores.push({
    documento,
    nombre,
    accion: 'CASO_NO_CONTEMPLADO',
    error: `Estado Excel: ${estadoExcel}, Estado BD: ${personInDB?.estado || 'N/A'}`
  });

  return { case: 0, action: 'unknown', success: false };
}

/**
 * Función principal de sincronización
 */
export async function syncExcelToDatabase(inputFilePath = null) {
  const startTime = new Date();
  const timestamp = startTime.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  console.log('\n' + '='.repeat(80));
  console.log('🔄 INICIANDO SINCRONIZACIÓN EXCEL -> BASE DE DATOS');
  console.log('='.repeat(80));
  console.log(`📅 Fecha/Hora: ${startTime.toLocaleString('es-CO')}`);
  console.log('');

  // Inicializar estructura de logs
  const logEntries = {
    nuevos: [],
    reactivados: [],
    inhabilitados: [],
    mantenidos: [],
    errores: []
  };

  try {
    // 1. Determinar ruta del archivo de entrada
    const excelPath = inputFilePath || path.join(CONFIG.inputDir, CONFIG.inputFile);
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`❌ El archivo no existe: ${excelPath}\n💡 Asegúrate de colocar el archivo en: ${CONFIG.inputDir}`);
    }

    // 2. Procesar archivo Excel
    console.log('📊 PASO 1: Procesando archivo Excel...');
    const excelResult = await processExcelFile(excelPath);
    
    if (!excelResult.success) {
      throw new Error(`Error procesando Excel: ${excelResult.error}`);
    }

    const { data: excelData } = excelResult;
    console.log(`✅ ${excelData.length} registros únicos listos para sincronizar\n`);

    // 3. Validar conexión a BD
    console.log('🔌 PASO 2: Validando conexión a base de datos...');
    try {
      await pool.execute('SELECT 1');
      console.log('✅ Conexión a BD exitosa\n');
    } catch (error) {
      throw new Error(`Error de conexión a BD: ${error.message}`);
    }

    // 4. Sincronizar cada registro
    console.log('🔄 PASO 3: Sincronizando registros...');
    console.log('');

    let processed = 0;
    const total = excelData.length;

    for (const excelRow of excelData) {
      processed++;
      const progress = Math.round((processed / total) * 100);
      
      if (processed % 50 === 0 || processed === total) {
        process.stdout.write(`\r   Progreso: ${processed}/${total} (${progress}%)`);
      }

      await syncPerson(excelRow, logEntries);
    }

    console.log('\n');
    console.log('✅ Sincronización completada\n');

    // 5. Generar resumen
    const summary = {
      total: excelData.length,
      nuevos: logEntries.nuevos.length,
      reactivados: logEntries.reactivados.length,
      inhabilitados: logEntries.inhabilitados.length,
      mantenidos: logEntries.mantenidos.length,
      errores: logEntries.errores.length
    };

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log('─'.repeat(80));
    console.log(`   Total registros procesados: ${summary.total}`);
    console.log(`   ✅ Nuevos usuarios agregados: ${summary.nuevos}`);
    console.log(`   🔄 Usuarios reactivados: ${summary.reactivados}`);
    console.log(`   ❌ Usuarios inhabilitados: ${summary.inhabilitados}`);
    console.log(`   ➡️  Usuarios mantenidos: ${summary.mantenidos}`);
    console.log(`   ⚠️  Errores: ${summary.errores}`);
    console.log(`   ⏱️  Duración: ${duration} segundos`);
    console.log('─'.repeat(80));
    console.log('');

    // 6. Crear directorios necesarios si no existen
    if (!fs.existsSync(CONFIG.inputDir)) {
      fs.mkdirSync(CONFIG.inputDir, { recursive: true });
      console.log(`📁 Directorio de entrada creado: ${CONFIG.inputDir}`);
    }
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      console.log(`📁 Directorio de salida creado: ${CONFIG.outputDir}`);
    }

    // 7. Generar archivos de salida
    console.log('📝 PASO 4: Generando archivos de salida...');
    
    // Generar log de texto
    const logFilePath = path.join(CONFIG.outputDir, `Log_Sincronizacion_${timestamp}.txt`);
    await generateLog(logFilePath, startTime, endTime, duration, summary, logEntries);
    console.log(`   ✅ Log generado: ${logFilePath}`);

    // Generar reporte CSV
    const reportFilePath = path.join(CONFIG.outputDir, `Reporte_Cambios_${timestamp}.csv`);
    await generateReport(reportFilePath, logEntries);
    console.log(`   ✅ Reporte CSV generado: ${reportFilePath}`);

    // Generar Excel sincronizado
    const excelOutputPath = path.join(CONFIG.outputDir, `Control_Acceso_Sincronizado_${timestamp}.xlsx`);
    await generateExcelOutput(excelOutputPath, excelData, logEntries);
    console.log(`   ✅ Excel sincronizado generado: ${excelOutputPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(80));

    return {
      success: true,
      summary,
      logFilePath,
      reportFilePath,
      excelOutputPath,
      duration
    };
  } catch (error) {
    console.error('\n❌ ERROR EN SINCRONIZACIÓN:', error.message);
    console.error(error.stack);
    
    // Generar log de error
    const errorLogPath = path.join(CONFIG.outputDir, `Log_Error_${timestamp}.txt`);
    const errorLog = `
ERROR EN SINCRONIZACIÓN
=======================
Fecha/Hora: ${new Date().toLocaleString('es-CO')}
Error: ${error.message}
Stack: ${error.stack}
`;
    fs.writeFileSync(errorLogPath, errorLog, 'utf8');
    console.log(`📝 Log de error guardado en: ${errorLogPath}`);

    return {
      success: false,
      error: error.message,
      errorLogPath
    };
  }
}

/**
 * Genera archivo Excel con los datos sincronizados
 */
async function generateExcelOutput(filePath, excelData, logEntries) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['RESUMEN DE SINCRONIZACIÓN'],
    [''],
    ['Total registros procesados', excelData.length],
    ['Nuevos usuarios agregados', logEntries.nuevos.length],
    ['Usuarios reactivados', logEntries.reactivados.length],
    ['Usuarios inhabilitados', logEntries.inhabilitados.length],
    ['Usuarios mantenidos', logEntries.mantenidos.length],
    ['Errores', logEntries.errores.length]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Nuevos usuarios
  if (logEntries.nuevos.length > 0) {
    const nuevosData = [
      ['Documento', 'Nombre', 'Acción', 'Estado', 'Permiso'],
      ...logEntries.nuevos.map(u => [u.documento, u.nombre, u.accion, u.estado, u.permiso])
    ];
    const nuevosSheet = XLSX.utils.aoa_to_sheet(nuevosData);
    XLSX.utils.book_append_sheet(workbook, nuevosSheet, 'Nuevos Usuarios');
  }

  // Hoja 3: Usuarios inhabilitados
  if (logEntries.inhabilitados.length > 0) {
    const inhabilitadosData = [
      ['Documento', 'Nombre', 'Acción', 'Estado Anterior', 'Estado Nuevo', 'Permiso'],
      ...logEntries.inhabilitados.map(u => [
        u.documento, 
        u.nombre, 
        u.accion, 
        u.estado_anterior, 
        u.estado_nuevo, 
        u.permiso
      ])
    ];
    const inhabilitadosSheet = XLSX.utils.aoa_to_sheet(inhabilitadosData);
    XLSX.utils.book_append_sheet(workbook, inhabilitadosSheet, 'Usuarios Inhabilitados');
  }

  // Hoja 4: Todos los datos sincronizados
  const allData = [
    ['Documento', 'Nombre', 'Estado', 'Acción Realizada'],
    ...excelData.map(row => {
      const nuevo = logEntries.nuevos.find(n => n.documento === row.documento);
      const reactivado = logEntries.reactivados.find(r => r.documento === row.documento);
      const inhabilitado = logEntries.inhabilitados.find(i => i.documento === row.documento);
      const mantenido = logEntries.mantenidos.find(m => m.documento === row.documento);

      let accion = 'MANTENER';
      if (nuevo) accion = 'NUEVO';
      else if (reactivado) accion = 'REACTIVADO';
      else if (inhabilitado) accion = 'INHABILITADO';

      return [row.documento, row.nombre, row.estado, accion];
    })
  ];
  const allSheet = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(workbook, allSheet, 'Datos Sincronizados');

  // Guardar archivo
  XLSX.writeFile(workbook, filePath);
}

// Si se ejecuta directamente desde la línea de comandos
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('syncExcelToDB.js') ||
                     process.argv[1]?.includes('syncExcelToDB.js');

if (isMainModule) {
  const inputFile = process.argv[2] || null;
  syncExcelToDatabase(inputFile)
    .then(result => {
      if (result.success) {
        console.log('\n✅ Sincronización completada exitosamente');
        process.exit(0);
      } else {
        console.error('\n❌ La sincronización falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

