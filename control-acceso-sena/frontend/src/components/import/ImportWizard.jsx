// Import Wizard - Asistente de importación paso a paso
import React, { useState } from 'react';
import { importAPI } from '../../services/api.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import UploadStep from './UploadStep.jsx';
import MappingStep from './MappingStep.jsx';
import ValidationStep from './ValidationStep.jsx';
import ProcessingStep from './ProcessingStep.jsx';
import ResultsStep from './ResultsStep.jsx';

const ImportWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  const steps = [
    { number: 1, title: 'Cargar Archivo' },
    { number: 2, title: 'Mapear Columnas' },
    { number: 3, title: 'Validar Datos' },
    { number: 4, title: 'Procesar' },
    { number: 5, title: 'Resultados' }
  ];

  const handleFileUpload = async (file) => {
    try {
      setError('');
      const response = await importAPI.uploadFile(file);
      
      if (response.success) {
        setFileData(response.data);
        setCurrentStep(2);
      } else {
        setError(response.message || 'Error al cargar archivo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar archivo');
    }
  };

  const handleMappingComplete = (mapping) => {
    setFieldMapping(mapping);
    setCurrentStep(3);
  };

  const handleValidation = async () => {
    try {
      setError('');
      // Usar fileId si está disponible, sino usar preview para validación rápida
      const dataToValidate = fileData.fileId ? fileData.fileId : fileData.preview;
      
      if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
        setError('Por favor, complete el mapeo de columnas antes de validar');
        return;
      }
      
      const response = await importAPI.validateData(dataToValidate, fieldMapping);
      
      if (response.success) {
        setValidationResult(response.data);
        // No avanzar automáticamente, mostrar resultados de validación
      } else {
        setError(response.message || 'Error al validar datos');
      }
    } catch (err) {
      console.error('Error en validación:', err);
      setError(err.response?.data?.message || err.message || 'Error al validar datos');
    }
  };

  const handleExecuteImport = async () => {
    try {
      setError('');
      
      // Verificar que tenemos fileId para ejecutar con todos los datos
      if (!fileData.fileId) {
        setError('Error: No se encontró el archivo completo. Por favor, vuelva a subir el archivo.');
        return;
      }
      
      if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
        setError('Error: El mapeo de columnas está vacío. Por favor, vuelva al paso anterior.');
        return;
      }
      
      // Usar fileId para ejecutar con todos los datos
      const response = await importAPI.executeImport(fileData.fileId, fieldMapping);
      
      if (response.success) {
        setJobId(response.data.jobId);
        setCurrentStep(4);
      } else {
        setError(response.message || 'Error al ejecutar importación');
      }
    } catch (err) {
      console.error('Error al ejecutar importación:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al ejecutar importación';
      setError(errorMessage);
    }
  };

  const handleResultsLoaded = (results) => {
    setImportResult(results);
    setCurrentStep(5); // Avanzar al paso de resultados
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFileData(null);
    setFieldMapping({});
    setValidationResult(null);
    setJobId(null);
    setImportResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importación Masiva de Usuarios</h1>
          <p className="text-gray-600">Asistente paso a paso para importar usuarios desde Excel o CSV</p>
        </div>

        {/* Indicador de pasos */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Contenido del paso actual */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {currentStep === 1 && (
            <UploadStep
              onFileUpload={handleFileUpload}
              onNext={() => {}}
            />
          )}

          {currentStep === 2 && fileData && (
            <MappingStep
              columns={fileData.columns}
              preview={fileData.preview}
              onMappingComplete={handleMappingComplete}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
              <ValidationStep
                validationResult={validationResult}
                onValidate={handleValidation}
                onBack={() => setCurrentStep(2)}
                onExecute={handleExecuteImport}
              />
            </ErrorBoundary>
          )}

          {currentStep === 4 && jobId && (
            <ProcessingStep
              jobId={jobId}
              onComplete={handleResultsLoaded}
            />
          )}

          {currentStep === 5 && importResult && (
            <ResultsStep
              result={importResult}
              onReset={resetWizard}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;

