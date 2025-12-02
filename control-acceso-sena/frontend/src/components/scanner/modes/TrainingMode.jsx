// TrainingMode - Modo de entrenamiento para capacitar nuevos guardas
import React, { useState } from 'react';

const TrainingMode = ({ onClose }) => {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const scenarios = [
    {
      id: 1,
      name: 'QR Válido - Aprendiz',
      qrData: JSON.stringify({
        type: 'person',
        id: 123,
        documento: '123456789',
        nombre: 'Ana García',
        rol: 'aprendiz',
        timestamp: new Date().toISOString()
      }),
      expectedAction: 'PERMITIR_ACCESO',
      explanation: 'Aprendiz activo en horario permitido. Debe permitir el acceso.',
      difficulty: 'Fácil'
    },
    {
      id: 2,
      name: 'QR Expirado - Visitante',
      qrData: JSON.stringify({
        type: 'visitor',
        id: 456,
        documento: '987654321',
        nombre: 'Carlos Ruiz',
        expiration: '2023-01-01T00:00:00Z',
        timestamp: new Date().toISOString()
      }),
      expectedAction: 'DENEGAR_ACCESO',
      explanation: 'QR de visitante expirado hace más de 24 horas. Debe denegar el acceso.',
      difficulty: 'Medio'
    },
    {
      id: 3,
      name: 'QR Válido - Instructor',
      qrData: JSON.stringify({
        type: 'person',
        id: 789,
        documento: '456789123',
        nombre: 'María López',
        rol: 'instructor',
        timestamp: new Date().toISOString()
      }),
      expectedAction: 'PERMITIR_ACCESO',
      explanation: 'Instructor activo. Siempre debe permitir el acceso.',
      difficulty: 'Fácil'
    },
    {
      id: 4,
      name: 'QR Dañado',
      qrData: 'QR_INVALIDO_DAÑADO',
      expectedAction: 'VERIFICAR_MANUALMENTE',
      explanation: 'QR dañado o ilegible. Debe solicitar documento físico o usar modo manual.',
      difficulty: 'Medio'
    }
  ];

  const startScenario = (scenario) => {
    setCurrentScenario(scenario);
    setShowResults(false);
  };

  const submitAnswer = (action) => {
    if (!currentScenario) return;

    const isCorrect = action === currentScenario.expectedAction;
    
    const answer = {
      scenario: currentScenario,
      userAction: action,
      isCorrect,
      timestamp: new Date()
    };

    setUserAnswers(prev => [...prev, answer]);
    setShowResults(true);
  };

  const evaluatePerformance = () => {
    if (userAnswers.length === 0) return null;

    const correctAnswers = userAnswers.filter(answer => answer.isCorrect);
    const score = (correctAnswers.length / userAnswers.length) * 100;

    return {
      score: Math.round(score),
      correct: correctAnswers.length,
      total: userAnswers.length,
      feedback: getPerformanceFeedback(score)
    };
  };

  const getPerformanceFeedback = (score) => {
    if (score >= 90) {
      return {
        level: 'Excelente',
        message: '¡Dominas perfectamente el uso del scanner!',
        color: 'green'
      };
    } else if (score >= 70) {
      return {
        level: 'Bueno',
        message: 'Buen desempeño, pero puedes mejorar.',
        color: 'blue'
      };
    } else if (score >= 50) {
      return {
        level: 'Regular',
        message: 'Necesitas más práctica. Revisa los escenarios.',
        color: 'yellow'
      };
    } else {
      return {
        level: 'Necesita Mejora',
        message: 'Revisa cuidadosamente cada escenario antes de responder.',
        color: 'red'
      };
    }
  };

  const resetTraining = () => {
    setUserAnswers([]);
    setCurrentScenario(null);
    setShowResults(false);
  };

  const performance = evaluatePerformance();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Modo Entrenamiento</h3>
          <p className="text-sm text-gray-600">Practica con escenarios reales</p>
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

      {!currentScenario ? (
        <div>
          <h4 className="font-semibold text-gray-700 mb-4">Selecciona un escenario:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => startScenario(scenario)}
                className="p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{scenario.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    scenario.difficulty === 'Fácil' ? 'bg-green-100 text-green-700' :
                    scenario.difficulty === 'Medio' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{scenario.explanation}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {!showResults ? (
            <div>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">{currentScenario.name}</h4>
                <p className="text-sm text-gray-700 mb-4">{currentScenario.explanation}</p>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs font-mono text-gray-600 break-all">
                    {currentScenario.qrData.substring(0, 100)}...
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-gray-700">¿Qué acción tomarías?</h5>
                <button
                  onClick={() => submitAnswer('PERMITIR_ACCESO')}
                  className="w-full p-4 bg-green-50 border-2 border-green-500 rounded-lg hover:bg-green-100 transition text-left"
                >
                  <span className="font-semibold text-green-700">✓ Permitir Acceso</span>
                </button>
                <button
                  onClick={() => submitAnswer('DENEGAR_ACCESO')}
                  className="w-full p-4 bg-red-50 border-2 border-red-500 rounded-lg hover:bg-red-100 transition text-left"
                >
                  <span className="font-semibold text-red-700">✗ Denegar Acceso</span>
                </button>
                <button
                  onClick={() => submitAnswer('VERIFICAR_MANUALMENTE')}
                  className="w-full p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg hover:bg-yellow-100 transition text-left"
                >
                  <span className="font-semibold text-yellow-700">⚠ Verificar Manualmente</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {userAnswers.length > 0 && (
                <div className={`p-4 rounded-lg mb-4 ${
                  userAnswers[userAnswers.length - 1].isCorrect
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {userAnswers[userAnswers.length - 1].isCorrect ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
                    <span className="font-semibold">
                      {userAnswers[userAnswers.length - 1].isCorrect ? '¡Correcto!' : 'Incorrecto'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Respuesta esperada: <strong>{currentScenario.expectedAction}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {currentScenario.explanation}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCurrentScenario(null);
                    setShowResults(false);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Nuevo Escenario
                </button>
                {performance && (
                  <button
                    onClick={() => setShowResults(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Ver Resultados
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel de resultados */}
      {performance && userAnswers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Tu Desempeño:</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{performance.score}%</p>
              <p className="text-xs text-gray-600">Puntuación</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{performance.correct}</p>
              <p className="text-xs text-gray-600">Correctas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{performance.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>
          <div className={`p-3 rounded ${
            performance.feedback.color === 'green' ? 'bg-green-100' :
            performance.feedback.color === 'blue' ? 'bg-blue-100' :
            performance.feedback.color === 'yellow' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            <p className="font-semibold">{performance.feedback.level}</p>
            <p className="text-sm">{performance.feedback.message}</p>
          </div>
          <button
            onClick={resetTraining}
            className="mt-3 w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Reiniciar Entrenamiento
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingMode;
















