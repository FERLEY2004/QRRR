// Validation Step - Paso 3: Validar datos
import React, { useState, useEffect } from 'react';
import { importAPI } from '../../services/api.js';
import { renderSafe, renderError } from '../../utils/safeRenderer.js';

const ValidationStep = ({ validationResult, onValidate, onBack, onExecute }) => {
  const [validating, setValidating] = useState(false);
  const [localValidationResult, setLocalValidationResult] = useState(null);

  useEffect(() => {
    if (validationResult) {
      setLocalValidationResult(validationResult);
    }
  }, [validationResult]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      await onValidate();
    } finally {
      setValidating(false);
    }
  };

  if (!localValidationResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Paso 3: Validar Datos</h2>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </button>
        </div>
        <div className="text-center py-8">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {validating ? 'Validando...' : 'Validar Datos'}
          </button>
        </div>
      </div>
    );
  }

  // Extraer valores de forma segura con valores por defecto
  const totalRows = renderSafe(localValidationResult?.totalRows, 0);
  const validCount = renderSafe(localValidationResult?.validCount, 0);
  const invalidCount = renderSafe(localValidationResult?.invalidCount, 0);
  const errors = Array.isArray(localValidationResult?.errors) ? localValidationResult.errors : [];
  const warnings = Array.isArray(localValidationResult?.warnings) ? localValidationResult.warnings : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Paso 3: Validar Datos</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Volver
        </button>
      </div>

      {/* Resumen de validación */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total de Filas</p>
          <p className="text-2xl font-bold text-gray-800">{totalRows}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Válidas</p>
          <p className="text-2xl font-bold text-green-800">{validCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Con Errores</p>
          <p className="text-2xl font-bold text-red-800">{invalidCount}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Advertencias</p>
          <p className="text-2xl font-bold text-yellow-800">{warnings.length}</p>
        </div>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Errores Encontrados ({errors.length})</h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {errors.slice(0, 20).map((error, idx) => {
              // Usar función helper para renderizar error de forma segura
              const safeError = renderError(error);
              return (
                <div key={idx} className="text-sm text-red-700">
                  <strong>Fila {safeError.row}:</strong> {safeError.message} ({safeError.field})
                </div>
              );
            })}
            {errors.length > 20 && (
              <p className="text-sm text-red-600 italic">
                ... y {errors.length - 20} errores más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Advertencias ({warnings.length})</h3>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {warnings.slice(0, 10).map((warning, idx) => {
              // Renderizar advertencia de forma segura
              const rowNum = renderSafe(warning?.row, 'N/A');
              const message = renderSafe(warning?.message, 'Advertencia desconocida');
              return (
                <div key={idx} className="text-sm text-yellow-700">
                  <strong>Fila {rowNum}:</strong> {message}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold"
        >
          Volver
        </button>
        {Number(invalidCount) === 0 && Number(validCount) > 0 ? (
          <button
            onClick={onExecute}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Ejecutar Importación
          </button>
        ) : Number(invalidCount) > 0 ? (
          <div className="text-red-600 text-sm flex items-center">
            Corrija los errores antes de continuar ({invalidCount} filas con errores)
          </div>
        ) : Number(validCount) === 0 ? (
          <div className="text-yellow-600 text-sm flex items-center">
            No hay filas válidas para importar
          </div>
        ) : (
          <button
            onClick={onExecute}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Ejecutar Importación
          </button>
        )}
      </div>
    </div>
  );
};

export default ValidationStep;

