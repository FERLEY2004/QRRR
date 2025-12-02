// QR Worker - Web Worker para procesamiento de QR en segundo plano
// Este worker procesa los códigos QR sin bloquear la UI

self.addEventListener('message', function(e) {
  const { qrData, action } = e.data;

  switch (action) {
    case 'process':
      const result = processQRData(qrData);
      self.postMessage({ 
        action: 'process', 
        result 
      });
      break;

    case 'validate':
      const validation = validateQRFormat(qrData);
      self.postMessage({ 
        action: 'validate', 
        validation 
      });
      break;

    case 'decode':
      const decoded = decodeQRContent(qrData);
      self.postMessage({ 
        action: 'decode', 
        decoded 
      });
      break;

    default:
      self.postMessage({ 
        action: 'error', 
        error: 'Acción desconocida' 
      });
  }
});

function processQRData(qrData) {
  const startTime = performance.now();

  try {
    // Parsear JSON
    const parsedData = JSON.parse(qrData);
    
    // Validar estructura
    const isValid = validateQRStructure(parsedData);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Estructura de QR inválida',
        errorCode: 'QR_INVALID_FORMAT',
        processingTime: performance.now() - startTime
      };
    }

    // Verificar expiración si existe
    if (parsedData.expiration) {
      const expirationDate = new Date(parsedData.expiration);
      if (expirationDate < new Date()) {
        return {
          success: false,
          error: 'QR expirado',
          errorCode: 'QR_EXPIRED',
          processingTime: performance.now() - startTime
        };
      }
    }

    return {
      success: true,
      data: parsedData,
      processingTime: performance.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error al procesar QR',
      errorCode: 'QR_PARSE_ERROR',
      processingTime: performance.now() - startTime
    };
  }
}

function validateQRFormat(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    return {
      valid: validateQRStructure(parsed),
      data: parsed
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

function decodeQRContent(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    return {
      success: true,
      decoded: parsed
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function validateQRStructure(data) {
  if (!data || typeof data !== 'object') return false;
  
  // Validar campos mínimos requeridos
  const requiredFields = ['type'];
  
  // Verificar que tenga al menos documento o id
  const hasIdentifier = data.documento || data.id || data.personId;
  
  return requiredFields.every(field => data.hasOwnProperty(field)) && hasIdentifier;
}
















