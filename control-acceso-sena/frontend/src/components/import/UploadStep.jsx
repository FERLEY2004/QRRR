// Upload Step - Paso 1: Cargar archivo
import React, { useRef, useState } from 'react';

const UploadStep = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onFileUpload(selectedFile);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Paso 1: Cargar Archivo</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-lg font-semibold text-gray-700">
              Arrastra y suelta tu archivo aquí
            </p>
            <p className="text-gray-500 mt-2">o</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Seleccionar archivo
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv)
            <br />
            Tamaño máximo: 10MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleFileSelect(file);
        }}
      />

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir y Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStep;

















