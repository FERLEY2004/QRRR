// useScannerOptimizado - Hook personalizado para scanner optimizado
import { useState, useRef, useCallback, useEffect } from 'react';
import CameraOptimizer from '../utils/scanner/cameraOptimizer';
import PermissionManager from '../utils/scanner/permissionManager';
import ScannerErrorHandler from '../utils/scanner/errorHandler';
import PerformanceMonitor from '../utils/scanner/performanceMonitor';
import UserCache from '../utils/scanner/userCache';

const useScannerOptimizado = (api) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResults, setLastResults] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [performanceStats, setPerformanceStats] = useState(null);
  
  const scannerRef = useRef(null);
  const qrWorkerRef = useRef(null);
  const userCacheRef = useRef(new UserCache());
  const performanceMonitorRef = useRef(new PerformanceMonitor());
  const isProcessingRef = useRef(false);

  // Inicializar Web Worker si está disponible
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        // El worker se cargará desde el archivo qr-worker.js
        // Por ahora usamos procesamiento síncrono, pero la estructura está lista
        qrWorkerRef.current = {
          process: async (qrData) => {
            // Procesamiento síncrono por ahora
            return processQRDataSync(qrData);
          }
        };
      } catch (error) {
        console.warn('Web Worker no disponible, usando procesamiento síncrono:', error);
      }
    }
  }, []);

  // Verificar permisos al montar
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status = await PermissionManager.checkPermissionStatus();
    setPermissionStatus(status);
  };

  // Inicializar scanner con mejores prácticas
  const initializeScanner = useCallback(async () => {
    try {
      // Solo verificar permisos, no obtener cámara todavía
      // La cámara se obtendrá cuando realmente se necesite (al activar el scanner)
      const permissionResult = await PermissionManager.requestCameraPermission();
      
      if (!permissionResult.granted) {
        const errorInfo = PermissionManager.handlePermissionError(permissionResult.error);
        setCameraError(errorInfo);
        return { success: false, error: errorInfo };
      }

      // No intentar obtener la cámara aquí, solo verificar permisos
      // La cámara se obtendrá cuando CameraOptimized se active
      
      return { 
        success: true, 
        permissionStatus: permissionResult.method 
      };
    } catch (error) {
      // Si hay error, no es crítico todavía - solo se necesita cuando se active el scanner
      console.warn('Advertencia al inicializar scanner:', error);
      return { success: true, permissionStatus: 'unknown' };
    }
  }, []);

  // Procesar QR con optimizaciones
  const processQRCode = useCallback(async (qrData, options = {}) => {
    if (isProcessingRef.current && !options.force) {
      return { success: false, error: 'Ya hay un escaneo en proceso' };
    }

    isProcessingRef.current = true;
    const startTime = performance.now();

    try {
      // Log del QR original para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('QR recibido:', qrData?.substring(0, 100));
      }

      // Validar y formatear el QR antes de procesarlo (optimizado)
      let formattedQRData = qrData;
      let parsed;
      
      // Limpiar el QR de espacios y caracteres especiales al inicio/final
      const cleanedQR = typeof qrData === 'string' ? qrData.trim() : String(qrData).trim();
      
      // Intentar parsear si es un string JSON (con timeout para evitar bloqueos)
      try {
        parsed = JSON.parse(cleanedQR);
      } catch (parseError) {
        // Si no es JSON válido, tratar como texto plano
        parsed = null;
      }
      
      // Validar y formatear el QR (optimizado para mejor rendimiento)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Es un objeto JSON parseado - procesamiento rápido
        let documento = null;
        let type = parsed.type || 'person';
        let nombre = parsed.nombre || parsed.nombre_completo || parsed.name;
        
        // FLUJO SIMPLIFICADO PARA VISITANTES: Detectar primero
        if (type === 'visitor' || type === 'visitante') {
          // Para visitantes, buscar documento en campos comunes
          documento = parsed.documento || parsed.id || parsed.document || 
                     parsed.numero_documento || parsed.cedula || parsed.dni;
          
          if (documento) {
            documento = String(documento).trim();
          }
          
          // Validar que tenga documento (puede ser id si no hay documento)
          if (!documento || documento.length < 1) {
            throw new Error('QR de visitante incompleto: falta documento o identificador');
          }
          
          // Validar que tenga nombre
          if (!nombre || nombre.trim().length < 2) {
            throw new Error('QR de visitante incompleto: falta nombre válido');
          }
          
          // Para visitantes, solo necesitamos nombre y documento
          formattedQRData = JSON.stringify({
            type: 'visitor',
            documento: documento,
            nombre: nombre.trim(),
            ...(parsed.timestamp && { timestamp: parsed.timestamp }),
            ...(parsed.id && { id: parsed.id })
          });
        } else {
          // Para otros tipos, validación normal
          // Buscar documento en campos comunes (orden optimizado por frecuencia)
          documento = parsed.documento || parsed.document || 
                     parsed.numero_documento || parsed.cedula || parsed.dni;
          
          // No usar id como documento para no visitantes (puede ser un ID de base de datos)
          if (documento) {
            documento = String(documento).trim();
          }
          
          if (documento && documento.length >= 6) {
            formattedQRData = JSON.stringify({
              type: type,
              documento: documento,
              ...(parsed.timestamp && { timestamp: parsed.timestamp }),
              ...(parsed.nombre && { nombre: parsed.nombre }),
              ...(parsed.rol && { rol: parsed.rol }),
              ...(parsed.id && { id: parsed.id })
            });
          } else {
            const campos = Object.keys(parsed).join(', ');
            throw new Error(`QR incompleto: falta documento válido. Campos: ${campos}`);
          }
        }
      } else {
        // No es JSON válido, tratar como texto plano
        // Formato esperado: "NOMBRE COMPLETO DOCUMENTO APRENDIZ RH=TIPO" o similar
        const documentoMatch = cleanedQR.match(/\d{6,12}/);
        
        if (documentoMatch) {
          const documento = documentoMatch[0];
          const documentoIndex = cleanedQR.indexOf(documento);
          
          // Extraer nombre (todo antes del documento)
          let nombre = cleanedQR.substring(0, documentoIndex).trim();
          
          // Limpiar el nombre de espacios múltiples y caracteres especiales al final
          nombre = nombre.replace(/\s+/g, ' ').trim();
          
          // Si el nombre está vacío o muy corto, intentar extraer de otra forma
          if (!nombre || nombre.length < 3) {
            // Intentar extraer nombre antes del documento (puede haber formato diferente)
            const partes = cleanedQR.split(/\d{6,12}/);
            if (partes.length > 0) {
              nombre = partes[0].trim().replace(/\s+/g, ' ');
            }
          }
          
          // Detectar tipo de usuario (APRENDIZ, INSTRUCTOR, etc.)
          let tipoUsuario = 'aprendiz';
          const tipoMatch = cleanedQR.match(/\b(APRENDIZ|INSTRUCTOR|ADMINISTRATIVO|ADMIN)\b/i);
          if (tipoMatch) {
            const tipoTexto = tipoMatch[0].toLowerCase();
            if (tipoTexto.includes('instructor')) {
              tipoUsuario = 'instructor';
            } else if (tipoTexto.includes('administrativo') || tipoTexto.includes('admin')) {
              tipoUsuario = 'administrativo';
            } else {
              tipoUsuario = 'aprendiz';
            }
          }
          
          // Validar que tengamos nombre válido
          if (!nombre || nombre.length < 3) {
            throw new Error(`No se pudo extraer el nombre del QR. Formato: "${cleanedQR.substring(0, 80)}"`);
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('QR procesado (texto plano):', { nombre, documento, tipoUsuario });
          }
          
          formattedQRData = JSON.stringify({
            type: tipoUsuario,
            documento: documento,
            nombre: nombre,
            timestamp: new Date().toISOString()
          });
        } else {
          // Intentar extraer como documento alfanumérico
          const alphanumeric = cleanedQR.replace(/[^a-zA-Z0-9]/g, '');
          if (alphanumeric.length >= 6 && alphanumeric.length <= 20) {
            formattedQRData = JSON.stringify({
              type: 'person',
              documento: alphanumeric,
              timestamp: new Date().toISOString()
            });
          } else {
            throw new Error(`Formato QR inválido: "${cleanedQR.substring(0, 50)}"`);
          }
        }
      }
      
      // Validación rápida del formato
      const finalCheck = JSON.parse(formattedQRData);
      if (!finalCheck.type || !finalCheck.documento) {
        throw new Error('QR no tiene el formato correcto');
      }

      // Verificar cache primero
      let cachedResult = null;
      try {
        if (finalCheck.documento) {
          cachedResult = userCacheRef.current.get(finalCheck.documento);
          if (cachedResult) {
            userCacheRef.current.recordHit();
            // Procesar con datos del cache
            const result = await processWithCache(cachedResult, formattedQRData, api);
            const processingTime = performance.now() - startTime;
            performanceMonitorRef.current.recordScan({ ...result, processingTime });
            updatePerformanceStats();
            return result;
          } else {
            userCacheRef.current.recordMiss();
          }
        }
      } catch (e) {
        // Error al verificar cache, continuar con procesamiento normal
        console.warn('Error verificando cache:', e);
      }

      // Usar Web Worker si está disponible
      let processedData;
      if (qrWorkerRef.current) {
        processedData = await qrWorkerRef.current.process(formattedQRData);
      } else {
        processedData = processQRDataSync(formattedQRData);
      }

      // Procesar con API usando el QR formateado
      const result = await api.scanQR(formattedQRData);

      const processingTime = performance.now() - startTime;
      const finalResult = {
        ...result,
        processingTime,
        cached: !!cachedResult
      };

      // Registrar en monitor de rendimiento
      performanceMonitorRef.current.recordScan(finalResult);
      updatePerformanceStats();

      // Agregar a resultados recientes
      setLastResults(prev => [finalResult, ...prev.slice(0, 9)]);

      return finalResult;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      // Extraer mensaje de error del backend si está disponible
      let errorMessage = error.message || 'Error al procesar el código QR';
      let errorCode = null;
      
      if (error.response) {
        // Error de respuesta del servidor
        errorMessage = error.response.data?.message || errorMessage;
        errorCode = error.response.data?.code;
        
        // Log para debugging
        console.error('Error del servidor:', {
          status: error.response.status,
          data: error.response.data,
          qrData: typeof formattedQRData !== 'undefined' ? formattedQRData : qrData
        });
      } else if (error.request) {
        // Error de red
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        errorCode = 'NETWORK_ERROR';
      }
      
      const errorResult = {
        success: false,
        error: errorMessage,
        errorCode,
        message: errorMessage,
        processingTime
      };
      
      performanceMonitorRef.current.recordScan(errorResult);
      updatePerformanceStats();
      
      return errorResult;
    } finally {
      isProcessingRef.current = false;
    }
  }, [api]);

  const updatePerformanceStats = useCallback(() => {
    const stats = performanceMonitorRef.current.getPerformanceReport();
    setPerformanceStats(stats);
  }, []);

  // Procesar con datos del cache
  const processWithCache = async (cachedUser, qrData, api) => {
    try {
      // Aún necesitamos validar con el servidor para verificar estado actual
      const result = await api.scanQR(qrData);
      return result;
    } catch (error) {
      // Si falla, usar datos del cache como fallback
      return {
        success: true,
        person: cachedUser,
        message: 'Acceso permitido (datos en cache)',
        cached: true
      };
    }
  };

  // Procesamiento síncrono de QR (fallback sin Web Worker)
  const processQRDataSync = (qrData) => {
    try {
      const parsed = JSON.parse(qrData);
      return {
        success: true,
        data: parsed,
        valid: validateQRStructure(parsed)
      };
    } catch (error) {
      return {
        success: false,
        error: 'QR inválido o dañado',
        errorCode: 'QR_PARSE_ERROR'
      };
    }
  };

  // Validar estructura de QR
  const validateQRStructure = (data) => {
    if (!data || typeof data !== 'object') return false;
    
    // Validar campos mínimos requeridos
    const requiredFields = ['type', 'documento'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  };

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current = null;
    }
    setIsScanning(false);
    setCameraError(null);
  }, []);

  return {
    isScanning,
    lastResults,
    cameraError,
    permissionStatus,
    performanceStats,
    scannerRef,
    initializeScanner,
    processQRCode,
    cleanup,
    updatePerformanceStats,
    userCache: userCacheRef.current,
    performanceMonitor: performanceMonitorRef.current
  };
};

export default useScannerOptimizado;

