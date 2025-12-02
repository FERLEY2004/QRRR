// Import Service - Servicio principal de importación
import { parseExcelFile, detectColumns as detectExcelColumns } from '../utils/excelParser.js';
import { parseCSVFile, detectDelimiter, detectColumns as detectCSVColumns } from '../utils/csvParser.js';
import { BatchProcessor } from './BatchProcessor.js';
import { validateBatch } from '../utils/dataValidator.js';
import pool from '../utils/dbPool.js';

// Almacenar trabajos de importación en memoria (en producción usar Redis o BD)
const importJobs = new Map();
// Almacenar datos de archivos temporalmente (en producción usar almacenamiento persistente)
const fileDataCache = new Map();

export class ImportService {
  static async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      let parseResult;
      let columns;

      if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
          fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parseResult = await parseExcelFile(fileBuffer);
        if (parseResult.success) {
          columns = detectExcelColumns(parseResult.data);
        }
      } else if (mimeType.includes('csv') || fileName.endsWith('.csv')) {
        const delimiter = detectDelimiter(fileBuffer);
        parseResult = await parseCSVFile(fileBuffer, delimiter);
        if (parseResult.success) {
          columns = detectCSVColumns(parseResult.data);
        }
      } else {
        return {
          success: false,
          error: 'Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)'
        };
      }

      if (!parseResult.success) {
        return parseResult;
      }

      // Previsualizar primeras 5 filas
      const preview = parseResult.data.slice(0, 5);

      // Almacenar todos los datos temporalmente con un ID único
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      fileDataCache.set(fileId, {
        data: parseResult.data,
        fileName,
        timestamp: new Date()
      });

      // Limpiar archivos antiguos (más de 1 hora)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [id, file] of fileDataCache.entries()) {
        if (file.timestamp.getTime() < oneHourAgo) {
          fileDataCache.delete(id);
        }
      }

      return {
        success: true,
        fileId, // ID para recuperar los datos completos después
        preview,
        totalRows: parseResult.totalRows,
        columns,
        fileName
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async validateData(dataOrFileId, fieldMapping) {
    // Si es un fileId, recuperar los datos del caché
    let data;
    if (typeof dataOrFileId === 'string' && dataOrFileId.startsWith('file_')) {
      const cachedFile = fileDataCache.get(dataOrFileId);
      if (!cachedFile) {
        return {
          success: false,
          error: 'Archivo no encontrado. Por favor, vuelva a subirlo.'
        };
      }
      data = cachedFile.data;
    } else {
      data = Array.isArray(dataOrFileId) ? dataOrFileId : [];
    }
    
    // Validar en lotes pequeños para mejor rendimiento
    const batchSize = 100;
    const allErrors = [];
    const allWarnings = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const result = await validateBatch(batch, fieldMapping, i);
      
      validCount += result.validCount;
      invalidCount += result.invalidCount;
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      success: true,
      totalRows: data.length,
      validCount,
      invalidCount,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  static async executeImport(dataOrFileId, fieldMapping, userId) {
    const jobId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Si es un fileId, recuperar los datos del caché
    let data;
    if (typeof dataOrFileId === 'string' && dataOrFileId.startsWith('file_')) {
      const cachedFile = fileDataCache.get(dataOrFileId);
      if (!cachedFile) {
        return {
          success: false,
          error: 'Archivo no encontrado. Por favor, vuelva a subirlo.'
        };
      }
      data = cachedFile.data;
      // Limpiar del caché después de usar
      fileDataCache.delete(dataOrFileId);
    } else {
      data = dataOrFileId;
    }
    
    // Validar que tenemos datos
    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'No hay datos para importar'
      };
    }
    
    const processor = new BatchProcessor(50, userId);
    const job = {
      id: jobId,
      status: 'processing',
      progress: {
        processed: 0,
        total: data.length,
        successful: 0,
        failed: 0,
        percentage: 0
      },
      errors: [],
      warnings: [],
      startTime: new Date(),
      userId
    };

    importJobs.set(jobId, job);

    // Procesar en segundo plano
    processor.onProgress((progress) => {
      job.progress = progress;
      importJobs.set(jobId, job);
      console.log(`[Import ${jobId}] Progreso: ${progress.percentage}% (${progress.processed}/${progress.total})`);
    });

    // Ejecutar procesamiento de forma asíncrona para no bloquear la respuesta
    (async () => {
      try {
        console.log(`[Import ${jobId}] Iniciando procesamiento de ${data.length} filas`);
        const result = await processor.processFile(data, fieldMapping);
        
        console.log(`[Import ${jobId}] Procesamiento completado: ${result.successful} exitosos, ${result.failed} fallidos`);
        
        job.status = 'completed';
        job.progress = {
          processed: result.processed,
          total: result.total,
          successful: result.successful,
          failed: result.failed,
          percentage: 100
        };
        job.errors = result.errors || [];
        job.warnings = result.warnings || [];
        job.endTime = new Date();
        job.duration = Math.round((job.endTime - job.startTime) / 1000);

        importJobs.set(jobId, job);
        console.log(`[Import ${jobId}] Estado actualizado a 'completed'`);
      } catch (error) {
        console.error(`[Import ${jobId}] Error en procesamiento:`, error);
        job.status = 'failed';
        job.error = error.message;
        job.errors = job.errors || [];
        job.errors.push({
          row: 0,
          field: 'system',
          message: `Error fatal: ${error.message}`
        });
        job.endTime = new Date();
        job.duration = Math.round((job.endTime - job.startTime) / 1000);
        importJobs.set(jobId, job);
        console.log(`[Import ${jobId}] Estado actualizado a 'failed'`);
      }
    })();
    
    // Retornar inmediatamente con el jobId
    return {
      success: true,
      jobId,
      message: 'Importación iniciada. Use el jobId para seguir el progreso.'
    };
  }

  static getJobProgress(jobId) {
    const job = importJobs.get(jobId);
    if (!job) {
      return {
        success: false,
        error: 'Trabajo de importación no encontrado'
      };
    }

    return {
      success: true,
      job
    };
  }

  static getJobResults(jobId) {
    return this.getJobProgress(jobId);
  }
}

