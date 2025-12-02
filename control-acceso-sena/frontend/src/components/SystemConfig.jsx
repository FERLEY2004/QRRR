// SystemConfig Component - Configuración del sistema
import React, { useState, useEffect } from 'react';
import { configAPI } from '../services/api';

const SystemConfig = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await configAPI.getAll();
      if (response.success) {
        setConfig(response.data || {});
      }
    } catch (err) {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (clave, valor) => {
    setConfig(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        valor
      }
    }));
  };

  const handleSave = async (clave) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const configItem = config[clave];
      await configAPI.update(clave, configItem.valor);
      
      setSuccess(`Configuración "${clave}" actualizada exitosamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const configs = Object.keys(config).map(clave => ({
        clave,
        valor: config[clave].valor
      }));
      
      await configAPI.updateMultiple(configs);
      setSuccess('Todas las configuraciones se guardaron exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Configuración del Sistema</h2>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(config).map((clave) => {
          const configItem = config[clave];
          
          return (
            <div key={clave} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{clave}</h3>
                  {configItem.descripcion && (
                    <p className="text-sm text-gray-600">{configItem.descripcion}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  configItem.tipo === 'number' ? 'bg-blue-100 text-blue-800' :
                  configItem.tipo === 'boolean' ? 'bg-purple-100 text-purple-800' :
                  configItem.tipo === 'json' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {configItem.tipo}
                </span>
              </div>

              <div className="space-y-3">
                {configItem.tipo === 'boolean' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={configItem.valor === true || configItem.valor === 'true' || configItem.valor === 1}
                      onChange={(e) => handleConfigChange(clave, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {configItem.valor ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                ) : configItem.tipo === 'number' ? (
                  <input
                    type="number"
                    value={configItem.valor || 0}
                    onChange={(e) => handleConfigChange(clave, parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : configItem.tipo === 'json' ? (
                  <textarea
                    value={typeof configItem.valor === 'string' ? configItem.valor : JSON.stringify(configItem.valor, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleConfigChange(clave, parsed);
                      } catch {
                        handleConfigChange(clave, e.target.value);
                      }
                    }}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    value={configItem.valor || ''}
                    onChange={(e) => handleConfigChange(clave, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}

                <button
                  onClick={() => handleSave(clave)}
                  disabled={saving}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(config).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>No hay configuraciones disponibles</p>
        </div>
      )}
    </div>
  );
};

export default SystemConfig;

















