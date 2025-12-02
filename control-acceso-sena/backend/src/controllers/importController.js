// Import Controller - Controlador de importación masiva
import multer from 'multer';
import { ImportService } from '../services/ImportService.js';
import { createAuditLog, createSecurityLog } from '../controllers/auditController.js';

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no soportado. Use Excel o CSV'));
    }
  }
});

// Subir archivo y previsualizar
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const result = await ImportService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log de seguridad
    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Subida de archivo para importación: ${req.file.originalname}`,
      detalles: {
        fileName: req.file.originalname,
        totalRows: result.totalRows,
        fileSize: req.file.size
      },
      exito: true
    });

    res.json({
      success: true,
      data: {
        fileId: result.fileId,
        preview: result.preview,
        totalRows: result.totalRows,
        columns: result.columns,
        fileName: result.fileName
      }
    });
  } catch (error) {
    console.error('Error en uploadFile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar archivo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validar datos del archivo
export const validateData = async (req, res) => {
  try {
    const { data, fileId, fieldMapping } = req.body;

    // Aceptar data (array) o fileId (string)
    const dataOrFileId = fileId || data;

    if (!dataOrFileId) {
      return res.status(400).json({
        success: false,
        message: 'Datos o fileId requerido'
      });
    }

    if (!fieldMapping || typeof fieldMapping !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Mapeo de campos requerido'
      });
    }

    // Validar que fieldMapping no esté vacío
    if (Object.keys(fieldMapping).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mapeo de campos no puede estar vacío. Por favor, mapee al menos los campos obligatorios.'
      });
    }

    // Validar que los campos obligatorios estén mapeados
    const requiredFields = ['documento', 'nombres'];
    const missingFields = requiredFields.filter(field => !fieldMapping[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obligatorios no mapeados: ${missingFields.join(', ')}`
      });
    }

    // Validar que data sea un array si se proporciona directamente
    if (data && !Array.isArray(data) && !fileId) {
      return res.status(400).json({
        success: false,
        message: 'Los datos deben ser un array o se debe proporcionar un fileId válido'
      });
    }

    const validationResult = await ImportService.validateData(dataOrFileId, fieldMapping);

    if (!validationResult.success) {
      return res.status(400).json(validationResult);
    }

    res.json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    console.error('Error en validateData:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al validar datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Ejecutar importación
export const executeImport = async (req, res) => {
  try {
    const { data, fileId, fieldMapping } = req.body;

    // Aceptar data (array) o fileId (string)
    const dataOrFileId = fileId || data;

    if (!dataOrFileId) {
      return res.status(400).json({
        success: false,
        message: 'Datos o fileId requerido'
      });
    }

    if (!fieldMapping || typeof fieldMapping !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Mapeo de campos requerido'
      });
    }

    // Ejecutar importación en segundo plano
    const result = await ImportService.executeImport(
      dataOrFileId,
      fieldMapping,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log de auditoría
    await createAuditLog({
      tabla_afectada: 'Personas',
      accion: 'INSERT',
      datos_nuevos: {
        totalRows: Array.isArray(dataOrFileId) ? dataOrFileId.length : 'unknown',
        fieldMapping
      },
      id_usuario: req.user.id,
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        jobId: result.jobId,
        message: 'Importación iniciada. Use el jobId para seguir el progreso.'
      }
    });
  } catch (error) {
    console.error('Error en executeImport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar importación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener progreso de importación
export const getImportProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = ImportService.getJobProgress(jobId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getImportProgress:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener progreso',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener resultados de importación
export const getImportResults = async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = ImportService.getJobResults(jobId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getImportResults:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resultados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { upload };

