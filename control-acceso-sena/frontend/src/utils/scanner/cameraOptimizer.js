// Camera Optimizer - Selección inteligente de cámara
class CameraOptimizer {
  static async getBestCamera() {
    try {
      // Primero intentar obtener dispositivos
      let devices;
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (error) {
        // Si falla, puede ser que necesitemos permisos primero
        console.warn('Error enumerando dispositivos, puede necesitar permisos:', error);
        throw new Error('No se pueden enumerar dispositivos. Asegúrate de dar permisos de cámara.');
      }
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        // Intentar solicitar permisos primero si no hay dispositivos
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          
          // Intentar de nuevo después de obtener permisos
          devices = await navigator.mediaDevices.enumerateDevices();
          const retryVideoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (retryVideoDevices.length === 0) {
            throw new Error('No se encontraron cámaras disponibles después de obtener permisos');
          }
          
          // Usar los dispositivos encontrados después de obtener permisos
          const backCamera = retryVideoDevices.find(device => 
            device.label && (
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            )
          );
          
          return backCamera || retryVideoDevices[0];
        } catch (permError) {
          throw new Error('No se encontraron cámaras disponibles. Verifica que tengas una cámara conectada y permisos otorgados.');
        }
      }
      
      // Priorizar cámaras traseras en móviles
      const backCamera = videoDevices.find(device => 
        device.label && (
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.includes('1') // Generalmente cámara trasera
        )
      );
      
      // Fallback a cualquier cámara
      return backCamera || videoDevices[0];
    } catch (error) {
      console.error('Error obteniendo mejor cámara:', error);
      throw error;
    }
  }

  static async configureCamera(constraints = {}) {
    const idealConstraints = {
      video: {
        facingMode: { ideal: 'environment' }, // Cámara trasera
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: false,
      ...constraints
    };
    
    try {
      return await navigator.mediaDevices.getUserMedia(idealConstraints);
    } catch (error) {
      console.warn('Error con constraints ideales, intentando fallback:', error);
      
      // Fallback a constraints más permisivos
      const fallbackConstraints = {
        video: {
          facingMode: 'environment'
        },
        audio: false
      };
      
      try {
        return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      } catch (fallbackError) {
        // Último intento con cualquier cámara disponible
        const minimalConstraints = {
          video: true,
          audio: false
        };
        return await navigator.mediaDevices.getUserMedia(minimalConstraints);
      }
    }
  }

  static async getAllCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error obteniendo cámaras:', error);
      return [];
    }
  }

  static async testCamera(cameraId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraId } }
      });
      
      // Limpiar stream inmediatamente después de la prueba
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default CameraOptimizer;

