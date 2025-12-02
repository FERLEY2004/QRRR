// Results Step - Paso 5: Resultados finales
import React from 'react';

const ResultsStep = ({ result, onReset }) => {
  if (!result) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    );
  }

  const { progress, errors, warnings, duration } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Paso 5: Resultados de Importación</h2>
      </div>

      {/* Resumen final */}
      <div className={`rounded-lg p-6 ${
        progress.failed === 0 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">
            {progress.failed === 0 ? '✅' : '⚠️'}
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {progress.failed === 0 
              ? 'Importación Completada Exitosamente' 
              : 'Importación Completada con Errores'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Procesado</p>
            <p className="text-2xl font-bold text-gray-800">{progress.processed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Importados Exitosamente</p>
            <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Con Errores</p>
            <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Duración</p>
            <p className="text-2xl font-bold text-gray-800">
              {duration ? `${duration}s` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Errores detallados */}
      {errors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">
            Errores Detallados ({errors.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {errors.slice(0, 50).map((error, idx) => {
              const rowNum = error?.row ? String(error.row) : 'N/A';
              const message = error?.message ? String(error.message) : 'Error desconocido';
              const field = error?.field ? String(error.field) : null;
              return (
                <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded">
                  <strong>Fila {rowNum}:</strong> {message}
                  {field && <span className="text-gray-500"> ({field})</span>}
                </div>
              );
            })}
            {errors.length > 50 && (
              <p className="text-sm text-red-600 italic">
                ... y {errors.length - 50} errores más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advertencias */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Advertencias ({warnings.length})
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {warnings.slice(0, 20).map((warning, idx) => {
              const rowNum = warning?.row ? String(warning.row) : 'N/A';
              const message = warning?.message ? String(warning.message) : 'Advertencia desconocida';
              return (
                <div key={idx} className="text-sm text-yellow-700">
                  <strong>Fila {rowNum}:</strong> {message}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
        >
          Nueva Importación
        </button>
      </div>
    </div>
  );
};

export default ResultsStep;







