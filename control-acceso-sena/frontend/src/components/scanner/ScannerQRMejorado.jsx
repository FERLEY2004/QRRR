// ScannerQRMejorado - Componente principal optimizado del scanner QR
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accessAPI } from '../../services/api';
import useScannerOptimizado from '../../hooks/useScannerOptimizado';
import CameraOptimized from './CameraOptimized';
import FeedbackInmediato from './FeedbackInmediato';
import PerformanceOverlay from './PerformanceOverlay';
import ManualEntryMode from './modes/ManualEntryMode';
import TrainingMode from './modes/TrainingMode';
import UserCard from '../UserCard';
import ScannerErrorHandler from '../../utils/scanner/errorHandler';
import PermissionManager from '../../utils/scanner/permissionManager';

const ScannerQRMejorado = () => {
  const { user } = useAuth();
  const [scannerState, setScannerState] = useState('ready'); // ready, scanning, processing, error
  const [currentMode, setCurrentMode] = useState('normal'); // normal, training, manual
  const [scanResult, setScanResult] = useState(null);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [qrRegenerationNotice, setQRRegenerationNotice] = useState(false);
  const [pendingVisitorDoc, setPendingVisitorDoc] = useState('');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const lastScannedRef = useRef(null); // Para evitar escaneos duplicados
  const scanThrottleRef = useRef(null); // Para throttling

  const {
    isScanning,
    lastResults,
    cameraError,
    permissionStatus,
    performanceStats,
    scannerRef,
    initializeScanner,
    processQRCode,
    cleanup,
    updatePerformanceStats
  } = useScannerOptimizado(accessAPI);

  // Activar scanner automáticamente al montar
  useEffect(() => {
    const autoStart = async () => {
      const initResult = await initializeScanner();
      if (initResult.success) {
        setScannerState('scanning');
        setErrorInfo(null);
      } else {
        setErrorInfo(initResult.error);
        setScannerState('error');
      }
    };
    
    autoStart();
    
    return () => {
      cleanup();
    };
  }, []);

  // Manejar escaneo exitoso con throttling y prevención de duplicados
  const handleScanSuccess = async (decodedText) => {
    // Evitar procesar si ya estamos procesando
    if (scannerState === 'processing') return;

    // Throttling: evitar escaneos muy frecuentes (máximo 1 por segundo)
    const now = Date.now();
    if (scanThrottleRef.current && (now - scanThrottleRef.current) < 1000) {
      return; // Ignorar escaneos muy frecuentes
    }
    scanThrottleRef.current = now;

    // Evitar escaneos duplicados del mismo QR
    if (lastScannedRef.current === decodedText) {
      return; // Ignorar si es el mismo QR que el último escaneado
    }

    setScannerState('processing');
    lastScannedRef.current = decodedText; // Guardar el último QR escaneado
    
    try {
      const result = await processQRCode(decodedText);
      
      setScanResult(result);
      if (result.errorCode === 'QR_REQUIERE_REGENERACION') {
        setQRRegenerationNotice(true);
        setPendingVisitorDoc(result.person?.documento || result.person?.doc || '');
        setShowVisitorModal(true);
      } else if (result.success) {
        setQRRegenerationNotice(false);
      } else {
        setQRRegenerationNotice(false);
      }
      
      if (result.success) {
        setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      }

      // Reiniciar scanner después de procesar (reducido de 3000ms a 1500ms)
      setTimeout(() => {
        setScanResult(null);
        lastScannedRef.current = null; // Limpiar después del timeout
        if (scannerState === 'scanning') {
          setScannerState('scanning');
        }
      }, 1500);
    } catch (error) {
      const handledError = ScannerErrorHandler.handleQRProcessingError(error);
      setScanResult({
        success: false,
        ...handledError
      });
      if (handledError.errorCode === 'QR_REQUIERE_REGENERACION') {
        setQRRegenerationNotice(true);
      } else {
        setQRRegenerationNotice(false);
      }
      // Limpiar el último escaneado en caso de error para permitir reintento
      setTimeout(() => {
        lastScannedRef.current = null;
      }, 2000);
    } finally {
      setScannerState('scanning');
    }
  };

  // Manejar errores de escaneo (QR no legible, etc.)
  const handleScanFailure = (errorMessage) => {
    // No hacer nada si ya estamos procesando
    if (scannerState === 'processing') return;
    
    // Los errores de escaneo son normales (QR no detectado aún)
    // Solo logueamos en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.debug('Error de escaneo (normal):', errorMessage);
    }
    
    // No actualizamos el estado para no interrumpir el flujo de escaneo
    // El scanner seguirá intentando escanear automáticamente
  };

  // Manejar errores de cámara
  const handleCameraError = (error) => {
    console.error('Error de cámara recibido:', error);
    setErrorInfo({
      type: error.type,
      message: error.message,
      recoverable: error.type !== 'browser_not_supported'
    });
    setScannerState('error');
  };

  // Iniciar scanner
  const handleStartScanner = async () => {
    const initResult = await initializeScanner();
    
    if (initResult.success) {
      setScannerState('scanning');
      setErrorInfo(null);
    } else {
      setErrorInfo(initResult.error);
      setScannerState('error');
    }
  };

  // Detener scanner
  const handleStopScanner = () => {
    cleanup();
    setScannerState('ready');
    setScanResult(null);
  };

  // Manejar entrada manual
  const handleManualProcess = async (qrData) => {
    setScannerState('processing');
    try {
      const result = await processQRCode(qrData);
      setScanResult(result);
      
      if (result.success) {
        setScanHistory(prev => [result, ...prev.slice(0, 9)]);
        setShowManualInput(false);
      }
      if (result.errorCode === 'QR_REQUIERE_REGENERACION') {
        setQRRegenerationNotice(true);
        setPendingVisitorDoc(result.person?.documento || result.person?.doc || '');
        setShowVisitorModal(true);
      } else if (result.success) {
        setQRRegenerationNotice(false);
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: error.message || 'Error al procesar documento'
      });
      setQRRegenerationNotice(false);
    } finally {
      setScannerState('ready');
    }
  };

  // Formatear timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Ahora';
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString();
      }
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString();
        }
      }
      return 'Ahora';
    } catch (error) {
      return 'Ahora';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header optimizado */}
      <div className="bg-white text-blue-600 p-4 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Scanner</h1>
            <p className="text-gray-600 text-sm">Usuario: {user?.nombre}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Botón de performance */}
            {performanceStats && (
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                📊 Stats
              </button>
            )}

            {/* Modos */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentMode('normal');
                  setShowManualInput(false);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  currentMode === 'normal' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => {
                  setCurrentMode('training');
                  setShowManualInput(false);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  currentMode === 'training' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Entrenamiento
              </button>
            </div>

            {/* Control de scanner */}
            {scannerState === 'ready' || scannerState === 'error' ? (
              <button
                onClick={handleStartScanner}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Activar Scanner
              </button>
            ) : (
              <button
                onClick={handleStopScanner}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Detener
              </button>
            )}

            {/* Botón manual */}
            <button
              onClick={() => {
                setShowManualInput(!showManualInput);
                setCurrentMode('normal');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {showManualInput ? 'Ocultar Manual' : 'Ingreso Manual'}
            </button>
          </div>
        </div>
      </div>
      {qrRegenerationNotice && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 p-4 rounded-lg shadow">
            <p className="font-semibold">QR de visitante inválido</p>
            <p className="text-sm">Este QR ya fue utilizado en una visita anterior. Debes solicitar un nuevo QR desde el módulo de Visitantes antes de poder ingresar nuevamente.</p>
            <Link
              to="/visitors"
              className="inline-flex items-center mt-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Ir a Visitantes
              <span className="ml-1 text-lg">↗</span>
            </Link>
          </div>
        </div>
      )}

      {/* Performance Overlay */}
      {performanceStats && (
        <PerformanceOverlay
          stats={performanceStats}
          isVisible={showPerformance}
          onToggle={() => setShowPerformance(!showPerformance)}
        />
      )}

      {/* Feedback Inmediato */}
      {scanResult && (
        <FeedbackInmediato
          result={scanResult}
          onClose={() => setScanResult(null)}
        />
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Área principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              {/* Errores de cámara */}
              {(cameraError || errorInfo) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-semibold">Error:</p>
                  <p className="text-red-600 text-sm mt-1">
                    {(cameraError || errorInfo)?.message || (cameraError || errorInfo)?.userMessage}
                  </p>
                  {permissionStatus === 'denied' && (
                    <div className="mt-3">
                      <p className="text-red-600 text-xs font-semibold mb-2">Pasos para resolver:</p>
                      <ul className="text-red-600 text-xs list-disc list-inside space-y-1">
                        {PermissionManager.getPermissionHelpSteps().slice(0, 3).map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Modos especiales */}
              {currentMode === 'training' && (
                <TrainingMode
                  onClose={() => setCurrentMode('normal')}
                />
              )}

              {/* Modo normal */}
              {currentMode === 'normal' && (
                <>
                  {/* Entrada manual */}
                  {showManualInput && (
                    <div className="mb-4">
                      <ManualEntryMode
                        onProcess={handleManualProcess}
                        onClose={() => setShowManualInput(false)}
                        loading={scannerState === 'processing'}
                      />
                    </div>
                  )}

                  {/* Cámara */}
                  <CameraOptimized
                    scannerId="qr-reader-optimized"
                    onScanSuccess={handleScanSuccess}
                    onScanFailure={handleScanFailure}
                    onCameraError={handleCameraError}
                    isActive={scannerState === 'scanning'}
                  />

                  {/* Estado de procesamiento */}
                  {scannerState === 'processing' && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Procesando código QR...</p>
                    </div>
                  )}

                  {/* Resultado del escaneo (sin feedback overlay) */}
                  {scanResult && !showManualInput && (
                    <div className={`mt-4 p-4 rounded-lg border-2 ${
                      scanResult.success 
                        ? (scanResult.action === 'salida' 
                            ? 'bg-blue-50 border-blue-400' 
                            : 'bg-green-50 border-green-400')
                        : 'bg-red-50 border-red-400'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          scanResult.success 
                            ? (scanResult.action === 'salida' ? 'bg-blue-500' : 'bg-green-500')
                            : 'bg-red-500'
                        }`}>
                          {scanResult.success ? (
                            scanResult.action === 'salida' ? (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold text-lg ${
                            scanResult.success 
                              ? (scanResult.action === 'salida' ? 'text-blue-800' : 'text-green-800')
                              : 'text-red-800'
                          }`}>
                            {scanResult.message}
                          </p>
                          {scanResult.person && (
                            <UserCard person={scanResult.person} action={scanResult.action} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Historial */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Historial Reciente</h2>
              {scanHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay escaneos recientes</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        scan.success 
                          ? (scan.action === 'salida' 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-green-50 border-green-200')
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${
                          scan.success 
                            ? (scan.action === 'salida' ? 'text-blue-700' : 'text-green-700')
                            : 'text-red-700'
                        }`}>
                          {scan.action === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(scan.timestamp)}
                        </span>
                      </div>
                      {scan.person && (
                        <p className="text-sm font-medium text-gray-800">{scan.person.nombre}</p>
                      )}
                      <p className="text-xs text-gray-600">{scan.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Solicitar nuevo QR</h3>
              <button
                onClick={() => setShowVisitorModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Este visitante ya salió y el QR anterior ya fue invalidado. Generá uno nuevo para habilitar el reingreso.
            </p>
            <label className="text-xs font-semibold uppercase text-gray-500">Documento</label>
            <input
              type="text"
              value={pendingVisitorDoc}
              onChange={(e) => setPendingVisitorDoc(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <Link
                to={`/visitors?documento=${pendingVisitorDoc}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                onClick={() => setShowVisitorModal(false)}
              >
                Abrir Visitantes
              </Link>
              <button
                onClick={() => setShowVisitorModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerQRMejorado;

