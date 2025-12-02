// BatchScanMode - Modo de escaneo rápido múltiple para eventos masivos
import React, { useState, useCallback } from 'react';
import CameraOptimized from '../CameraOptimized';

const BatchScanMode = ({ onProcess, onClose, api }) => {
  const [batchQueue, setBatchQueue] = useState([]);
  const [isBatchActive, setIsBatchActive] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });

  const processBatch = useCallback(async (decodedText, decodedResult) => {
    // Procesamiento ultra-rápido sin feedback visual completo
    if (!decodedText) {
      console.warn('QR vacío o inválido');
      return;
    }

    try {
      // Validar y formatear el QR antes de enviarlo
      let qrData = decodedText;
      let parsed;
      
      // Intentar parsear si es un string JSON
      try {
        parsed = typeof decodedText === 'string' ? JSON.parse(decodedText) : decodedText;
      } catch (parseError) {
        // Si no es JSON válido, tratar como documento directo
        parsed = null;
      }
      
      // Validar y formatear el QR
      if (parsed && typeof parsed === 'object') {
        // Es un objeto JSON parseado
        if (!parsed.type || !parsed.documento) {
          // Si falta type o documento, intentar extraer documento
          if (parsed.documento) {
            parsed.type = parsed.type || 'person';
          } else if (parsed.id) {
            // Algunos QRs pueden tener 'id' en lugar de 'documento'
            parsed.documento = parsed.id.toString();
            parsed.type = parsed.type || 'person';
          } else {
            throw new Error('QR incompleto: falta type o documento');
          }
        }
        qrData = JSON.stringify(parsed);
      } else {
        // No es JSON válido, verificar si es solo un número de documento
        const trimmed = decodedText.trim();
        if (/^[0-9]{6,12}$/.test(trimmed)) {
          // Crear objeto QR válido desde documento solo
          qrData = JSON.stringify({
            type: 'person',
            documento: trimmed,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error(`Formato QR inválido: "${trimmed.substring(0, 50)}"`);
        }
      }
      
      // Validar que qrData tenga el formato correcto antes de enviar
      const finalCheck = JSON.parse(qrData);
      if (!finalCheck.type || !finalCheck.documento) {
        throw new Error('QR no tiene el formato correcto después del procesamiento');
      }
      
      const result = await api.scanQR(qrData);
      
      const batchItem = {
        ...result,
        timestamp: Date.now(),
        qrData: decodedText
      };

      setBatchQueue(prev => [...prev, batchItem]);
      
      // Actualizar estadísticas
      setStats(prev => ({
        total: prev.total + 1,
        successful: result.success ? prev.successful + 1 : prev.successful,
        failed: result.success ? prev.failed : prev.failed + 1
      }));

      // Feedback mínimo (solo sonido)
      playMinimalFeedback(result.success);
    } catch (error) {
      const errorItem = {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al procesar QR',
        code: error.response?.data?.code,
        timestamp: Date.now(),
        qrData: decodedText
      };
      
      setBatchQueue(prev => [...prev, errorItem]);
      setStats(prev => ({
        total: prev.total + 1,
        successful: prev.successful,
        failed: prev.failed + 1
      }));
      
      playMinimalFeedback(false);
    }
  }, [api]);

  const playMinimalFeedback = (success) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = success ? 800 : 400;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Ignorar errores de audio
    }
  };

  const exportBatchResults = () => {
    const csvContent = generateBatchReport(batchQueue);
    downloadCSV(csvContent, `lote_escaneo_${Date.now()}.csv`);
  };

  const generateBatchReport = (queue) => {
    const headers = ['Timestamp', 'Éxito', 'Mensaje', 'Documento', 'Nombre', 'Acción'];
    const rows = queue.map(item => [
      new Date(item.timestamp).toLocaleString(),
      item.success ? 'Sí' : 'No',
      item.message || item.error || '',
      item.person?.documento || '',
      item.person?.nombre || '',
      item.action || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearBatch = () => {
    setBatchQueue([]);
    setStats({ total: 0, successful: 0, failed: 0 });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Modo Lote</h3>
          <p className="text-sm text-gray-600">Escaneo rápido múltiple</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
          <p className="text-xs text-gray-600">Exitosos</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-xs text-gray-600">Fallidos</p>
        </div>
      </div>

      {/* Cámara */}
      <div className="mb-4">
        <CameraOptimized
          scannerId="batch-qr-reader"
          onScanSuccess={processBatch}
          onScanFailure={() => {}}
          isActive={isBatchActive}
        />
      </div>

      {/* Controles */}
      <div className="flex gap-3">
        <button
          onClick={exportBatchResults}
          disabled={batchQueue.length === 0}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Exportar ({batchQueue.length})
        </button>
        <button
          onClick={clearBatch}
          disabled={batchQueue.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Limpiar
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Salir
          </button>
        )}
      </div>

      {/* Lista reciente (últimos 5) */}
      {batchQueue.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Últimos escaneos:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {batchQueue.slice(-5).reverse().map((item, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  item.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {item.success ? '✓' : '✗'} {item.person?.nombre || item.error || 'Procesado'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchScanMode;

