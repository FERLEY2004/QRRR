// FeedbackInmediato - Respuestas visuales y auditivas inmediatas
import React, { useEffect, useState } from 'react';

const FeedbackInmediato = ({ result, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setIsVisible(true);
      playFeedback(result);
      
      // Auto-cerrar después de 3 segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); // Delay para animación
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [result]);

  const getFeedbackConfig = (result) => {
    if (!result) return null;

    const configs = {
      success: {
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-400',
        icon: '✅',
        sound: 'success',
        vibration: [100, 50, 100],
        message: result.message || 'Acceso permitido',
        title: 'ÉXITO'
      },
      successExit: {
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-400',
        icon: '👋',
        sound: 'success',
        vibration: [100, 50, 100],
        message: result.message || 'Salida registrada',
        title: 'SALIDA'
      },
      error: {
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-400',
        icon: '❌',
        sound: 'error',
        vibration: [300],
        message: result.message || 'Acceso denegado',
        title: 'ERROR'
      },
      warning: {
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-400',
        icon: '⚠️',
        sound: 'warning',
        vibration: [200, 100, 200],
        message: result.message || 'Verificar documento',
        title: 'ADVERTENCIA'
      }
    };

    if (result.success) {
      // Si es una salida exitosa, usar el color azul
      if (result.action === 'salida') {
        return configs.successExit;
      }
      return configs.success;
    } else if (result.code === 'PERSON_NOT_FOUND' || result.code === 'QR_EXPIRED') {
      return configs.warning;
    } else {
      return configs.error;
    }
  };

  const playFeedback = (result) => {
    const config = getFeedbackConfig(result);
    if (!config) return;

    // Reproducir sonido
    playSound(config.sound);

    // Vibración (si está disponible)
    if (navigator.vibrate && config.vibration) {
      navigator.vibrate(config.vibration);
    }
  };

  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frecuencias diferentes para cada tipo
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600
      };

      oscillator.frequency.value = frequencies[type] || 600;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Error reproduciendo sonido:', error);
    }
  };

  if (!result || !isVisible) return null;

  const config = getFeedbackConfig(result);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}>
      <div className={`${config.bgColor} ${config.borderColor} border-4 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="text-center">
          {/* Ícono grande */}
          <div className="text-8xl mb-4 animate-bounce">
            {config.icon}
          </div>
          
          {/* Título */}
          <h3 className={`text-2xl font-bold mb-2 text-${config.color}-800`}>
            {config.title}
          </h3>
          
          {/* Mensaje */}
          <p className={`text-lg text-${config.color}-700 mb-4`}>
            {config.message}
          </p>

          {/* Información adicional */}
          {result.person && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="font-semibold text-gray-800">{result.person.nombre}</p>
              {result.person.documento && (
                <p className="text-sm text-gray-600">Doc: {result.person.documento}</p>
              )}
              {result.action && (
                <p className="text-sm text-gray-600 mt-1">
                  Acción: {result.action === 'entrada' ? 'Entrada' : 'Salida'}
                </p>
              )}
            </div>
          )}

          {/* Tiempo de procesamiento */}
          {result.processingTime && (
            <p className="text-xs text-gray-500 mt-4">
              Procesado en {Math.round(result.processingTime)}ms
            </p>
          )}

          {/* Botón cerrar */}
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) setTimeout(onClose, 300);
            }}
            className={`mt-4 px-6 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackInmediato;




