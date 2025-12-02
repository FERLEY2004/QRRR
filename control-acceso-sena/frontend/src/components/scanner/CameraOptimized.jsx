// CameraOptimized.jsx - Versión Corregida y Robusta
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import CameraErrorRecovery from './CameraErrorRecovery';

const CameraOptimized = ({ 
  scannerId = 'qr-reader',
  onScanSuccess, 
  onScanFailure,
  onCameraError,
  isActive,
  config = {}
}) => {
  const [cameraState, setCameraState] = useState('idle'); // 'idle', 'checking', 'ready', 'error'
  const [errorDetails, setErrorDetails] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const isActiveRef = useRef(isActive); // Ref para verificar isActive durante operaciones asíncronas

  const defaultConfig = {
    fps: 30, // Aumentado de 10 a 30 para mejor rendimiento
    qrbox: { width: 300, height: 300 }, // Aumentado de 250x250 para mejor detección
    aspectRatio: 1.0,
    videoConstraints: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    ...config
  };

  // Actualizar ref cuando isActive cambia
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    // Solo inicializar si isActive es true y estamos en estado idle o error
    if (isActive && (cameraState === 'idle' || cameraState === 'error')) {
      initializeCamera();
    } else if (!isActive) {
      // Si no está activo, detener la cámara y resetear estado
      stopCamera();
      if (cameraState !== 'idle' && cameraState !== 'checking') {
        setCameraState('idle');
      }
    }

    return () => {
      // Cleanup: detener cámara si el componente se desmonta o isActive cambia a false
      if (!isActive && scannerRef.current) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const initializeCamera = async () => {
    // Verificar que isActive sigue siendo true antes de continuar (usar ref para valor actualizado)
    if (!isActiveRef.current) {
      console.log('Inicialización cancelada: isActive es false');
      return;
    }

    try {
      setCameraState('checking');
      setErrorDetails(null);
      
      // 1. Verificar si el navegador soporta la API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NAVEGADOR_NO_COMPATIBLE');
      }

      // 2. Verificar permisos existentes (si está disponible)
      // Nota: La API de permisos puede no estar disponible en todos los navegadores
      let permissionState = 'prompt';
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          permissionState = permission.state;
          
          if (permission.state === 'denied') {
            throw new Error('PERMISSION_DENIED');
          }
        }
      } catch (permError) {
        // Si el error es específicamente PERMISSION_DENIED, propagarlo
        if (permError.message === 'PERMISSION_DENIED') {
          throw permError;
        }
        // Si la API de permisos no está disponible, continuar e intentar getUserMedia
        console.log('API de permisos no disponible, intentando getUserMedia directamente');
      }

      // 3. Obtener cámaras disponibles
      // Estrategia: primero solicitar permisos, luego enumerar dispositivos
      let cameras = [];
      
      try {
        // Primero intentar obtener permisos (necesario para enumerar dispositivos en algunos navegadores)
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Limpiar stream inmediatamente después de obtener permisos
          stream.getTracks().forEach(track => track.stop());
          
          // Esperar un momento para que los permisos se propaguen
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (permError) {
          // Si getUserMedia falla, es un problema de permisos
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            throw new Error('PERMISSION_DENIED');
          }
          // Si es NotFoundError, puede ser que no haya cámara
          if (permError.name === 'NotFoundError' || permError.name === 'DevicesNotFoundError') {
            throw new Error('NO_CAMERA_AVAILABLE');
          }
          // Otros errores también pueden ser de permisos
          throw new Error('PERMISSION_DENIED');
        }

        // Intentar obtener cámaras usando Html5Qrcode (método preferido)
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (html5Error) {
          console.warn('Html5Qrcode.getCameras() falló, usando enumerateDevices como alternativa:', html5Error);
          
          // Fallback: usar enumerateDevices directamente
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length === 0) {
            throw new Error('NO_CAMERA_AVAILABLE');
          }
          
          // Convertir dispositivos al formato que espera Html5Qrcode
          cameras = videoDevices.map(device => ({
            id: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.substring(0, 8)}`
          }));
        }

        // Verificar que tenemos cámaras disponibles
        if (!cameras || cameras.length === 0) {
          // Último intento: usar enumerateDevices directamente
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length === 0) {
            throw new Error('NO_CAMERA_AVAILABLE');
          }
          
          cameras = videoDevices.map(device => ({
            id: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.substring(0, 8)}`
          }));
        }
      } catch (error) {
        // Si el error ya es PERMISSION_DENIED o NO_CAMERA_AVAILABLE, propagarlo
        if (error.message === 'PERMISSION_DENIED' || error.message === 'NO_CAMERA_AVAILABLE') {
          throw error;
        }
        // Para otros errores, intentar determinar la causa
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('PERMISSION_DENIED');
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('NO_CAMERA_AVAILABLE');
        }
        // Si no podemos determinar, asumir que no hay cámara
        console.error('Error desconocido al obtener cámaras:', error);
        throw new Error('NO_CAMERA_AVAILABLE');
      }

      // Verificar nuevamente que isActive sigue siendo true antes de inicializar scanner
      if (!isActiveRef.current) {
        console.log('Inicialización cancelada: isActive cambió a false durante la verificación');
        setCameraState('idle');
        return;
      }

      // 4. Inicializar scanner con configuración robusta
      await initializeScanner(cameras);
    } catch (error) {
      // Solo manejar el error si isActive sigue siendo true (usar ref para valor actualizado)
      if (isActiveRef.current) {
        handleCameraError(error);
      } else {
        console.log('Error ignorado porque isActive es false:', error);
        setCameraState('idle');
      }
    }
  };

  const initializeScanner = async (cameras) => {
    try {
      // Crear instancia de Html5Qrcode
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Seleccionar mejor cámara (trasera si está disponible)
      let cameraId = cameras[0].id;
      const backCamera = cameras.find(camera => 
        camera.label && (
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        )
      );
      
      if (backCamera && backCamera.id) {
        cameraId = backCamera.id;
      }

      // Intentar iniciar con la cámara seleccionada
      let startSuccess = false;
      let lastError = null;
      
      // Intentar con la cámara preferida primero
      try {
        await html5QrCode.start(
          cameraId,
          defaultConfig,
          onScanSuccess,
          onScanFailure
        );
        startSuccess = true;
        setCameraState('ready');
        console.log('Cámara iniciada correctamente:', cameraId);
      } catch (startError) {
        console.warn(`Error iniciando con cámara ${cameraId}, intentando otras cámaras:`, startError);
        lastError = startError;
        
        // Limpiar antes de intentar otras cámaras
        try {
          await html5QrCode.clear();
        } catch (clearError) {
          // Ignorar errores al limpiar
        }
        
        // Si falla, intentar con otras cámaras disponibles
        for (let i = 0; i < cameras.length; i++) {
          if (cameras[i].id === cameraId) continue; // Ya intentamos esta
          
          try {
            // Crear nueva instancia para cada intento
            const newHtml5QrCode = new Html5Qrcode(scannerId);
            await newHtml5QrCode.start(
              cameras[i].id,
              defaultConfig,
              onScanSuccess,
              onScanFailure
            );
            scannerRef.current = newHtml5QrCode;
            startSuccess = true;
            setCameraState('ready');
            console.log('Cámara iniciada correctamente (fallback):', cameras[i].id);
            break;
          } catch (fallbackError) {
            console.warn(`Error con cámara ${cameras[i].id}:`, fallbackError);
            lastError = fallbackError;
            // Limpiar antes del siguiente intento
            try {
              await html5QrCode.clear();
            } catch (e) {
              // Ignorar
            }
            continue;
          }
        }
      }
      
      if (!startSuccess) {
        throw new Error(`SCANNER_INIT_FAILED: ${lastError?.message || 'No se pudo iniciar ninguna cámara'}`);
      }
    } catch (error) {
      throw new Error(`SCANNER_INIT_FAILED: ${error.message}`);
    }
  };

  const handleCameraError = (error) => {
    console.error('Error de cámara:', error);
    
    let errorType = 'unknown';
    let userMessage = 'Error desconocido con la cámara';
    let recoverySteps = [];

    if (error.message.includes('PERMISSION_DENIED') || error.message.includes('NotAllowedError')) {
      errorType = 'permission_denied';
      userMessage = 'Permisos de cámara denegados';
      recoverySteps = getPermissionRecoverySteps();
    } else if (error.message.includes('NO_CAMERA_AVAILABLE') || error.message.includes('NotFoundError')) {
      errorType = 'no_camera';
      userMessage = 'No se encontró cámara disponible';
      recoverySteps = getNoCameraRecoverySteps();
    } else if (error.message.includes('SCANNER_INIT_FAILED')) {
      errorType = 'scanner_failed';
      userMessage = 'Error al inicializar el escáner';
      recoverySteps = getScannerRecoverySteps();
    } else if (error.message.includes('NAVEGADOR_NO_COMPATIBLE')) {
      errorType = 'browser_not_supported';
      userMessage = 'Navegador no compatible';
      recoverySteps = getBrowserRecoverySteps();
    }

    setCameraState('error');
    setErrorDetails({
      type: errorType,
      message: userMessage,
      recoverySteps,
      originalError: error.message
    });

    if (onCameraError) {
      onCameraError({ type: errorType, message: userMessage });
    }
  };

  const getPermissionRecoverySteps = () => [
    'Haz clic en el ícono de candado o cámara en la barra de direcciones',
    'Selecciona "Permitir" para el acceso a la cámara',
    'Recarga la página después de permitir los permisos',
    'Si no ves la opción, revisa la configuración de privacidad de tu navegador'
  ];

  const getNoCameraRecoverySteps = () => [
    'Verifica que tu dispositivo tenga una cámara conectada y funcionando',
    'Asegúrate de que la cámara no esté siendo usada por otra aplicación',
    'Si estás en una computadora, verifica que la cámara esté conectada correctamente',
    'Si estás en un dispositivo móvil, verifica que la cámara funcione en otras aplicaciones',
    'Intenta recargar la página después de conectar la cámara',
    'Usa el modo de entrada manual como alternativa mientras resuelves el problema'
  ];

  const getScannerRecoverySteps = () => [
    'Recarga la página e intenta nuevamente',
    'Prueba con un navegador diferente (Chrome, Firefox)',
    'Verifica que tu cámara funcione en otras aplicaciones',
    'Contacta al soporte técnico si el problema persiste'
  ];

  const getBrowserRecoverySteps = () => [
    'Actualiza tu navegador a la última versión',
    'Usa Google Chrome, Mozilla Firefox o Microsoft Edge',
    'Verifica que JavaScript esté habilitado',
    'Contacta al administrador del sistema si el problema persiste'
  ];

  const retryCamera = async () => {
    setCameraState('idle');
    setErrorDetails(null);
    await initializeCamera();
  };

  const requestCameraPermission = async () => {
    try {
      // Solicitar permisos de manera directa
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Limpiar stream inmediatamente
      stream.getTracks().forEach(track => track.stop());
      // Reintentar inicialización
      await retryCamera();
    } catch (error) {
      handleCameraError(error);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (error) {
        console.error('Error deteniendo cámara:', error);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  if (!isActive) {
    return (
      <div className="bg-gray-100 rounded-lg p-12 text-center">
        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <p className="text-gray-600 text-lg mb-2">Cámara inactiva</p>
        <p className="text-gray-500 text-sm">Activa el scanner para comenzar</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      <div 
        id={scannerId} 
        ref={containerRef}
        className="w-full h-full"
      />
      
      {cameraState === 'checking' && (
        <div className="absolute inset-0 bg-yellow-50 flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
          <p className="text-yellow-800 font-medium">Inicializando cámara...</p>
        </div>
      )}

      {cameraState === 'error' && errorDetails && (
        <CameraErrorRecovery 
          errorDetails={errorDetails}
          onRetry={retryCamera}
          onRequestPermission={requestCameraPermission}
        />
      )}

      {cameraState === 'ready' && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 z-10">
          <span>✅</span>
          <span>Cámara lista</span>
        </div>
      )}

      {/* Overlay de escaneo */}
      {cameraState === 'ready' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 p-4">
          <div className="border-4 border-blue-500 rounded-lg w-48 h-48 md:w-52 md:h-52 lg:w-56 lg:h-56 animate-pulse" style={{ maxWidth: 'min(70%, 240px)', maxHeight: 'min(70%, 240px)' }}></div>
        </div>
      )}
    </div>
  );
};

export default CameraOptimized;
