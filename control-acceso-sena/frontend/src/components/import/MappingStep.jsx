// Mapping Step - Paso 2: Mapear columnas
import React, { useState, useEffect } from 'react';

const systemFields = [
  // Campos base (obligatorios)
  { key: 'documento', label: 'Documento', required: true, category: 'base' },
  { key: 'tipo_documento', label: 'Tipo de Documento', required: false, category: 'base' },
  { key: 'nombres', label: 'Nombres', required: true, category: 'base' },
  { key: 'apellidos', label: 'Apellidos', required: false, category: 'base' },
  { key: 'email', label: 'Email', required: false, category: 'base' },
  { key: 'rol', label: 'Rol', required: false, category: 'base' },
  { key: 'estado', label: 'Estado', required: false, category: 'base' },
  
  // Campos comunes
  { key: 'rh', label: 'Grupo Sanguíneo (RH)', required: false, category: 'comun' },
  { key: 'telefono', label: 'Teléfono', required: false, category: 'comun' },
  
  // Campos para APRENDICES
  { key: 'programa_formacion', label: 'Programa de Formación', required: false, category: 'aprendiz' },
  { key: 'ficha', label: 'Ficha', required: false, category: 'aprendiz' },
  { key: 'jornada', label: 'Jornada', required: false, category: 'aprendiz' },
  { key: 'ambiente_asignado', label: 'Ambiente Asignado', required: false, category: 'aprendiz' },
  { key: 'fecha_inicio_formacion', label: 'Fecha Inicio Formación', required: false, category: 'aprendiz' },
  { key: 'fecha_fin_formacion', label: 'Fecha Fin Formación', required: false, category: 'aprendiz' },
  
  // Campos para INSTRUCTORES
  { key: 'ambientes_clase', label: 'Ambientes de Clase (separados por comas)', required: false, category: 'instructor' },
  { key: 'fichas_atiende', label: 'Fichas que Atiende (separadas por comas)', required: false, category: 'instructor' },
  { key: 'areas_formacion', label: 'Áreas de Formación (separadas por comas)', required: false, category: 'instructor' },
  { key: 'horarios_clase', label: 'Horarios de Clase', required: false, category: 'instructor' },
  { key: 'tipo_contrato', label: 'Tipo de Contrato', required: false, category: 'instructor' },
  
  // Campos para ADMINISTRATIVOS
  { key: 'ambiente_trabajo', label: 'Ambiente de Trabajo', required: false, category: 'administrativo' },
  { key: 'dependencia', label: 'Dependencia', required: false, category: 'administrativo' },
  { key: 'horario_oficina', label: 'Horario de Oficina', required: false, category: 'administrativo' },
  { key: 'cargo', label: 'Cargo', required: false, category: 'administrativo' }
];

const MappingStep = ({ columns, preview, onMappingComplete, onBack }) => {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    // Auto-mapear columnas detectadas
    const autoMapping = {};
    columns.forEach(col => {
      if (col.detected) {
        autoMapping[col.detected] = col.original;
        console.log(`✅ Auto-mapeado: ${col.original} → ${col.detected}`);
      }
    });
    console.log('📋 Mapeo automático completo:', autoMapping);
    setMapping(autoMapping);
  }, [columns]);

  const handleMappingChange = (systemField, fileColumn) => {
    setMapping(prev => ({
      ...prev,
      [systemField]: fileColumn
    }));
  };

  const handleContinue = () => {
    // Validar campos obligatorios
    const requiredFields = systemFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !mapping[f.key]);

    
    if (missingFields.length > 0) {
      alert(`Debe mapear los siguientes campos obligatorios: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    onMappingComplete(mapping);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Paso 2: Mapear Columnas</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Volver
        </button>
      </div>

      <p className="text-gray-600">
        Asigna cada columna de tu archivo al campo correspondiente del sistema.
        {columns.filter(c => c.detected).length > 0 && (
          <span className="ml-2 text-green-600 font-semibold">
            ✓ {columns.filter(c => c.detected).length} columna(s) detectada(s) automáticamente
          </span>
        )}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Vista Previa de Datos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-gray-200">
              <tr>
                {columns.map(col => (
                  <th key={col.original} className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    {col.original}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview && preview.length > 0 ? (
                preview.slice(0, 3).map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {columns.map(col => {
                      const cellValue = row[col.original];
                      // Convertir a string si es un objeto o array
                      let displayValue = '-';
                      if (cellValue !== null && cellValue !== undefined) {
                        if (typeof cellValue === 'object') {
                          displayValue = Array.isArray(cellValue) 
                            ? cellValue.join(', ') 
                            : JSON.stringify(cellValue);
                        } else {
                          displayValue = String(cellValue);
                        }
                      }
                      return (
                        <td key={col.original} className="px-4 py-2 text-sm text-gray-600">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-2 text-sm text-gray-500 text-center">
                    No hay datos de vista previa disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-gray-800 text-lg">Mapeo de Campos</h3>
        
        {/* Campos Base */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Campos Base (Obligatorios)</h4>
          <div className="space-y-2">
            {systemFields.filter(f => f.category === 'base').map(field => {
              const isAutoDetected = mapping[field.key] && columns.find(c => c.original === mapping[field.key] && c.detected === field.key);
              return (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      {isAutoDetected && <span className="text-green-600 ml-2 text-xs">✓ Auto</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      isAutoDetected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccionar columna --</option>
                    {columns.map(col => {
                      const isDetectedForThisField = col.detected === field.key;
                      return (
                        <option key={col.original} value={col.original}>
                          {col.original}{isDetectedForThisField ? ' ✓ (detectado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campos Comunes */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Campos Comunes (Opcionales)</h4>
          <div className="space-y-2">
            {systemFields.filter(f => f.category === 'comun').map(field => {
              const isAutoDetected = mapping[field.key] && columns.find(c => c.original === mapping[field.key] && c.detected === field.key);
              return (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {isAutoDetected && <span className="text-green-600 ml-2 text-xs">✓ Auto</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      isAutoDetected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccionar columna --</option>
                    {columns.map(col => {
                      const isDetectedForThisField = col.detected === field.key;
                      return (
                        <option key={col.original} value={col.original}>
                          {col.original}{isDetectedForThisField ? ' ✓ (detectado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campos para Aprendices */}
        <div>
          <h4 className="font-semibold text-blue-700 mb-3 text-sm uppercase">📚 Campos para Aprendices</h4>
          <div className="space-y-2">
            {systemFields.filter(f => f.category === 'aprendiz').map(field => {
              const isAutoDetected = mapping[field.key] && columns.find(c => c.original === mapping[field.key] && c.detected === field.key);
              return (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {isAutoDetected && <span className="text-green-600 ml-2 text-xs">✓ Auto</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      isAutoDetected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccionar columna --</option>
                    {columns.map(col => {
                      const isDetectedForThisField = col.detected === field.key;
                      return (
                        <option key={col.original} value={col.original}>
                          {col.original}{isDetectedForThisField ? ' ✓ (detectado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campos para Instructores */}
        <div>
          <h4 className="font-semibold text-purple-700 mb-3 text-sm uppercase">👨‍🏫 Campos para Instructores</h4>
          <div className="space-y-2">
            {systemFields.filter(f => f.category === 'instructor').map(field => {
              const isAutoDetected = mapping[field.key] && columns.find(c => c.original === mapping[field.key] && c.detected === field.key);
              return (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {isAutoDetected && <span className="text-green-600 ml-2 text-xs">✓ Auto</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                      isAutoDetected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccionar columna --</option>
                    {columns.map(col => {
                      const isDetectedForThisField = col.detected === field.key;
                      return (
                        <option key={col.original} value={col.original}>
                          {col.original}{isDetectedForThisField ? ' ✓ (detectado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campos para Administrativos */}
        <div>
          <h4 className="font-semibold text-green-700 mb-3 text-sm uppercase">💼 Campos para Administrativos</h4>
          <div className="space-y-2">
            {systemFields.filter(f => f.category === 'administrativo').map(field => {
              const isAutoDetected = mapping[field.key] && columns.find(c => c.original === mapping[field.key] && c.detected === field.key);
              return (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {isAutoDetected && <span className="text-green-600 ml-2 text-xs">✓ Auto</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                      isAutoDetected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccionar columna --</option>
                    {columns.map(col => {
                      const isDetectedForThisField = col.detected === field.key;
                      return (
                        <option key={col.original} value={col.original}>
                          {col.original}{isDetectedForThisField ? ' ✓ (detectado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold"
        >
          Volver
        </button>
        <button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Continuar a Validación
        </button>
      </div>
    </div>
  );
};

export default MappingStep;







