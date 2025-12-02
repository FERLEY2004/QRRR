// useCameraManager.js - Hook optimizado para manejo de cámara
import { useState, useCallback } from 'react';

const useCameraManager = () => {
  const [cameraStatus, setCameraStatus] = useState({
    state: 'idle', // 'idle', 'checking', 'ready', 'error'
    error: null,
    availableCameras: []
  });

  const checkCameraSupport = useCallback(() => {
    const supports = {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      enumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
      permissionsAPI: !!navigator.permissions?.query
    };
    return {
      ...supports,
      fullySupported: Object.values(supports).every(Boolean)
    };
  }, []);

  const getAvailableCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error('API de dispositivos no soportada');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(camera => ({
          deviceId: camera.deviceId,
          label: camera.label || `Cámara ${camera.deviceId.slice(0, 8)}`,
          groupId: camera.groupId
        }));

      return cameras;
    } catch (error) {
      console.error('Error enumerando cámaras:', error);
      return [];
    }
  }, []);

  const checkCameraPermissions = useCallback(async () => {
    try {
      if (!navigator.permissions?.query) {
        // Fallback: intentar acceso directo
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return 'granted';
        } catch (e) {
          return 'prompt';
        }
      }

      const permission = await navigator.permissions.query({ name: 'camera' });
      return permission.state;
    } catch (error) {
      return 'prompt';
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      setCameraStatus(prev => ({ ...prev, state: 'checking', error: null }));

      // 1. Verificar soporte del navegador
      const support = checkCameraSupport();
      if (!support.fullySupported && !support.getUserMedia) {
        throw new Error('NAVEGADOR_NO_COMPATIBLE');
      }

      // 2. Verificar permisos
      const permission = await checkCameraPermissions();
      if (permission === 'denied') {
        throw new Error('PERMISOS_DENEGADOS');
      }

      // 3. Obtener cámaras disponibles
      const cameras = await getAvailableCameras();
      if (cameras.length === 0) {
        throw new Error('NO_HAY_CAMARAS');
      }

      setCameraStatus({
        state: 'ready',
        error: null,
        availableCameras: cameras
      });

      return { success: true, cameras };
    } catch (error) {
      const errorMap = {
        'NAVEGADOR_NO_COMPATIBLE': {
          type: 'browser_not_supported',
          message: 'Tu navegador no soporta acceso a cámara'
        },
        'PERMISOS_DENEGADOS': {
          type: 'permission_denied', 
          message: 'Permisos de cámara denegados'
        },
        'NO_HAY_CAMARAS': {
          type: 'no_cameras',
          message: 'No se encontraron cámaras disponibles'
        }
      };

      const errorInfo = errorMap[error.message] || {
        type: 'unknown',
        message: 'Error desconocido al acceder a la cámara'
      };

      setCameraStatus({
        state: 'error',
        error: errorInfo,
        availableCameras: []
      });

      return { success: false, error: errorInfo };
    }
  }, [checkCameraSupport, checkCameraPermissions, getAvailableCameras]);

  const requestCameraAccess = useCallback(async () => {
    try {
      // Solicitar acceso directo a cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      
      // Limpiar inmediatamente después de obtener permisos
      stream.getTracks().forEach(track => track.stop());
      
      // Reintentar inicialización
      return await initializeCamera();
      
    } catch (error) {
      setCameraStatus(prev => ({
        ...prev,
        state: 'error',
        error: {
          type: 'access_denied',
          message: 'No se pudo acceder a la cámara'
        }
      }));
      return { success: false, error: error.message };
    }
  }, [initializeCamera]);

  return {
    cameraStatus,
    initializeCamera,
    requestCameraAccess,
    checkCameraSupport
  };
};

export default useCameraManager;
















