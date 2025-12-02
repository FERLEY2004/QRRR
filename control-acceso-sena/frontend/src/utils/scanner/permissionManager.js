// Permission Manager - Gestión robusta de permisos de cámara
class PermissionManager {
  static async requestCameraPermission() {
    try {
      // Verificar si ya tenemos permisos
      if (navigator.permissions) {
        try {
          const currentPermission = await navigator.permissions.query({
            name: 'camera'
          });
          
          if (currentPermission.state === 'granted') {
            return { granted: true, method: 'existing' };
          }
        } catch (error) {
          // Algunos navegadores no soportan permissions.query para cámara
          console.warn('No se puede verificar permisos existentes:', error);
        }
      }
      
      // Solicitar permisos de manera user-friendly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      
      // Limpiar stream inmediatamente
      stream.getTracks().forEach(track => track.stop());
      
      return { granted: true, method: 'requested' };
    } catch (error) {
      return { 
        granted: false, 
        error: this.handlePermissionError(error),
        method: 'failed' 
      };
    }
  }

  static handlePermissionError(error) {
    const errorMap = {
      'NotAllowedError': {
        type: 'permission_denied',
        message: 'Permisos de cámara denegados',
        userMessage: 'Por favor permita el acceso a la cámara en configuración'
      },
      'NotFoundError': {
        type: 'camera_not_found',
        message: 'No se encontró cámara disponible',
        userMessage: 'Conecte una cámara o use modo manual'
      },
      'NotSupportedError': {
        type: 'browser_not_supported',
        message: 'Navegador no compatible',
        userMessage: 'Use Chrome, Firefox o Safari actualizado'
      },
      'NotReadableError': {
        type: 'camera_in_use',
        message: 'La cámara está siendo usada por otra aplicación',
        userMessage: 'Cierre otras aplicaciones que usen la cámara'
      },
      'OverconstrainedError': {
        type: 'constraints_not_supported',
        message: 'Configuración de cámara no soportada',
        userMessage: 'Intente con otra cámara o ajuste la configuración'
      },
      'default': {
        type: 'unknown_error',
        message: 'Error desconocido con la cámara',
        userMessage: 'Reinicie la aplicación o contacte soporte'
      }
    };

    const errorInfo = errorMap[error.name] || errorMap.default;
    
    return {
      ...errorInfo,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  static getPermissionHelpSteps() {
    return [
      'Toque "Permitir" cuando el navegador solicite acceso a la cámara',
      'Si no ve la solicitud, revise la barra de direcciones',
      'Para dispositivos iOS: toque el ícono de cámara en la barra de direcciones',
      'Asegúrese de que el sitio tenga permisos de cámara en configuración',
      'En Chrome: Configuración > Privacidad y seguridad > Configuración del sitio > Cámara'
    ];
  }

  static async checkPermissionStatus() {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state; // 'granted', 'denied', 'prompt'
    } catch (error) {
      return 'unknown';
    }
  }

  static getBrowserSpecificInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'Haga clic en el ícono de candado en la barra de direcciones',
          'Seleccione "Permitir" para Cámara',
          'Recargue la página'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Haga clic en el ícono de cámara en la barra de direcciones',
          'Seleccione "Permitir"',
          'Recargue la página'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Safari > Preferencias > Sitios web > Cámara',
          'Seleccione "Permitir" para este sitio',
          'Recargue la página'
        ]
      };
    }
    
    return {
      browser: 'Desconocido',
      steps: this.getPermissionHelpSteps()
    };
  }
}

export default PermissionManager;
















