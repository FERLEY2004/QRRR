// Error Handler - Manejo elegante de errores del scanner
class ScannerErrorHandler {
  static handleCameraError(error) {
    const errorMap = {
      'NotAllowedError': {
        type: 'permission_denied',
        message: 'Permisos de cámara denegados',
        solution: 'Por favor permita el acceso a la cámara en configuración',
        severity: 'high',
        recoverable: true
      },
      'NotFoundError': {
        type: 'camera_not_found',
        message: 'No se encontró cámara disponible',
        solution: 'Conecte una cámara o use modo manual',
        severity: 'high',
        recoverable: true
      },
      'NotSupportedError': {
        type: 'browser_not_supported',
        message: 'Navegador no compatible',
        solution: 'Use Chrome, Firefox o Safari actualizado',
        severity: 'high',
        recoverable: false
      },
      'NotReadableError': {
        type: 'camera_in_use',
        message: 'La cámara está siendo usada por otra aplicación',
        solution: 'Cierre otras aplicaciones que usen la cámara',
        severity: 'medium',
        recoverable: true
      },
      'OverconstrainedError': {
        type: 'constraints_not_supported',
        message: 'Configuración de cámara no soportada',
        solution: 'Intente con otra cámara o ajuste la configuración',
        severity: 'medium',
        recoverable: true
      },
      'default': {
        type: 'unknown_error',
        message: 'Error desconocido con la cámara',
        solution: 'Reinicie la aplicación o contacte soporte',
        severity: 'medium',
        recoverable: true
      }
    };

    const errorInfo = errorMap[error.name] || errorMap.default;

    return {
      ...errorInfo,
      originalError: error,
      timestamp: new Date().toISOString(),
      errorCode: error.code,
      errorName: error.name
    };
  }

  static handleQRProcessingError(error) {
    const errorMap = {
      'QR_PARSE_ERROR': {
        type: 'qr_parse_error',
        message: 'Código QR dañado o ilegible',
        solution: 'Intente escanear nuevamente o use modo manual',
        severity: 'low',
        recoverable: true
      },
      'QR_EXPIRED': {
        type: 'qr_expired',
        message: 'Código QR expirado',
        solution: 'Solicite un nuevo código QR',
        severity: 'medium',
        recoverable: true
      },
      'QR_INVALID_FORMAT': {
        type: 'qr_invalid_format',
        message: 'Formato de código QR inválido',
        solution: 'Use un código QR válido del sistema',
        severity: 'medium',
        recoverable: true
      },
      'default': {
        type: 'processing_error',
        message: 'Error al procesar código QR',
        solution: 'Intente nuevamente o contacte soporte',
        severity: 'medium',
        recoverable: true
      }
    };

    const errorInfo = errorMap[error.code] || errorMap.default;

    return {
      ...errorInfo,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  static getRecoverySteps(errorType) {
    const recoverySteps = {
      'permission_denied': [
        'Toque el ícono de cámara en la barra de direcciones',
        'Seleccione "Permitir" para acceso a cámara',
        'Recargue la página después de permitir'
      ],
      'camera_not_found': [
        'Verifique que la cámara esté conectada',
        'Intente con otro dispositivo',
        'Use el modo de entrada manual'
      ],
      'browser_not_supported': [
        'Actualice su navegador a la última versión',
        'Intente con Google Chrome o Mozilla Firefox',
        'Contacte a soporte para asistencia'
      ],
      'camera_in_use': [
        'Cierre otras aplicaciones que usen la cámara',
        'Cierre pestañas que puedan estar usando la cámara',
        'Reinicie el navegador si el problema persiste'
      ],
      'constraints_not_supported': [
        'Intente cambiar de cámara si tiene múltiples disponibles',
        'Use el modo manual como alternativa',
        'Contacte soporte para ajustar configuración'
      ],
      'default': [
        'Intente recargar la página',
        'Reinicie el navegador',
        'Contacte al administrador del sistema'
      ]
    };

    return recoverySteps[errorType] || recoverySteps.default;
  }

  static formatErrorForUser(error) {
    const handledError = this.handleCameraError(error);
    
    return {
      title: handledError.message,
      description: handledError.solution,
      steps: this.getRecoverySteps(handledError.type),
      severity: handledError.severity,
      recoverable: handledError.recoverable
    };
  }
}

export default ScannerErrorHandler;
















