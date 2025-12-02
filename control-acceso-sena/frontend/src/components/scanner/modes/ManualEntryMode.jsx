// ManualEntryMode - Modo de entrada manual de documento
import React, { useState } from 'react';

const ManualEntryMode = ({ onProcess, onClose, loading = false }) => {
  const [documento, setDocumento] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!documento.trim()) {
      setError('Por favor ingrese un número de documento');
      return;
    }

    // Validar formato básico
    if (!/^[0-9]{6,12}$/.test(documento.trim())) {
      setError('El documento debe tener entre 6 y 12 dígitos');
      return;
    }

    try {
      // Crear QR data manualmente
      const qrData = JSON.stringify({
        type: 'person',
        documento: documento.trim(),
        timestamp: new Date().toISOString(),
        manual: true
      });

      await onProcess(qrData);
      setDocumento('');
    } catch (error) {
      setError(error.message || 'Error al procesar documento');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Ingreso y Salida Manual</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Documento
          </label>
          <input
            type="text"
            value={documento}
            onChange={(e) => {
              setDocumento(e.target.value);
              setError('');
            }}
            placeholder="Ej: 1234567890"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !documento.trim()}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Buscar</span>
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Consejo:</strong> Use este modo cuando el código QR no se pueda escanear o esté dañado.
        </p>
      </div>
    </div>
  );
};

export default ManualEntryMode;
















