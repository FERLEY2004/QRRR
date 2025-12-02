// Processing Step - Paso 4: Procesar importación
import React, { useState, useEffect } from 'react';
import { importAPI } from '../../services/api.js';

const ProcessingStep = ({ jobId, onComplete }) => {
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    successful: 0,
    failed: 0,
    percentage: 0
  });
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    let interval;
    let timeoutId;
    
    const checkProgress = async () => {
      try {
        const response = await importAPI.getProgress(jobId);
        if (response.success && response.job) {
          const job = response.job;
          setProgress(job.progress || {
            processed: 0,
            total: 0,
            successful: 0,
            failed: 0,
            percentage: 0
          });
          setStatus(job.status || 'processing');

          // Verificar si el trabajo está completo o falló
          if (job.status === 'completed' || job.status === 'failed') {
            if (interval) {
              clearInterval(interval);
            }
            
            // Obtener resultados finales
            try {
              const resultsResponse = await importAPI.getResults(jobId);
              if (resultsResponse.success) {
                onComplete(resultsResponse.job);
              } else {
                // Si no hay resultados pero el estado es completado, usar el job actual
                onComplete(job);
              }
            } catch (error) {
              console.error('Error obteniendo resultados:', error);
              // Usar el job actual como resultado
              onComplete(job);
            }
          } else if (job.progress && job.progress.percentage >= 100) {
            // Si el porcentaje es 100% pero el estado aún no es completado, esperar un poco más
            timeoutId = setTimeout(() => {
              checkProgress();
            }, 1000);
          }
        } else {
          console.error('Error en respuesta de progreso:', response);
        }
      } catch (error) {
        console.error('Error obteniendo progreso:', error);
        // Si hay un error de red, seguir intentando
      }
    };

    // Verificar inmediatamente
    checkProgress();
    
    // Configurar polling cada 2 segundos
    interval = setInterval(checkProgress, 2000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [jobId, onComplete]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Paso 4: Procesando Importación</h2>

      <div className={`border rounded-lg p-6 ${
        status === 'completed' ? 'bg-green-50 border-green-200' :
        status === 'failed' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="text-center mb-4">
          {status === 'processing' ? (
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          ) : status === 'completed' ? (
            <div className="inline-block bg-green-500 rounded-full h-12 w-12 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="inline-block bg-red-500 rounded-full h-12 w-12 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`text-lg font-semibold ${
            status === 'completed' ? 'text-green-800' :
            status === 'failed' ? 'text-red-800' :
            'text-gray-800'
          }`}>
            {status === 'processing' ? 'Procesando...' : status === 'completed' ? 'Completado' : 'Error en la importación'}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Procesados</p>
            <p className="text-xl font-bold text-gray-800">
              {progress.processed} / {progress.total}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Éxitos</p>
            <p className="text-xl font-bold text-green-600">{progress.successful}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Errores</p>
            <p className="text-xl font-bold text-red-600">{progress.failed}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Por favor, no cierre esta ventana mientras se procesa la importación...
      </p>
    </div>
  );
};

export default ProcessingStep;

