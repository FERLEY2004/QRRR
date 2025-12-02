// CameraErrorRecovery.jsx - Interfaz de recuperación de errores de cámara
import React from 'react';

const CameraErrorRecovery = ({ errorDetails, onRetry, onRequestPermission }) => {
  const { type, message, recoverySteps } = errorDetails;

  const getErrorIcon = () => {
    switch (type) {
      case 'permission_denied': return '🚫';
      case 'no_camera': 
      case 'no_cameras': return '📷';
      case 'scanner_failed': 
      case 'browser_not_supported': return '⚙️';
      default: return '❌';
    }
  };

  const getActionButton = () => {
    switch (type) {
      case 'permission_denied':
        return (
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            onClick={onRequestPermission}
          >
            Solicitar Permisos de Cámara
          </button>
        );
      default:
        return (
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            onClick={onRetry}
          >
            Reintentar
          </button>
        );
    }
  };

  return (
    <div className="absolute inset-0 bg-white flex items-center justify-center z-20 p-6">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-4">{getErrorIcon()}</div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-4">{message}</h3>
        
        {recoverySteps && recoverySteps.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-700 mb-3">Para solucionar:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              {recoverySteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          {getActionButton()}
          
          <button 
            className="bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition"
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Navegadores compatibles:</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span>Chrome ✅</span>
            <span>Firefox ✅</span>
            <span>Safari ✅</span>
            <span>Edge ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraErrorRecovery;
















