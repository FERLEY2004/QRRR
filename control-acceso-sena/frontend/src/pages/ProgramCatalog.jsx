// ProgramCatalog - Catálogo de programas de formación
import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../services/api.js';

const ProgramCatalog = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nivel: '',
    area: '',
    estado: 'activo',
    search: ''
  });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [accessProgram, setAccessProgram] = useState(null);
  const [accesses, setAccesses] = useState([]);
  const [loadingAccesses, setLoadingAccesses] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [programForm, setProgramForm] = useState({
    codigo_programa: '',
    nombre_programa: '',
    nivel: 'Técnico',
    area_conocimiento: '',
    duracion_meses: 12,
    descripcion: '',
    estado: 'activo'
  });
  const [formFeedback, setFormFeedback] = useState(null);

  useEffect(() => {
    loadPrograms();
  }, [filters]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const result = await catalogAPI.getAllPrograms(filters);
      if (result.success) {
        setPrograms(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando programas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleProgramClick = async (program) => {
    setSelectedProgram(program);
    setLoadingStudents(true);
    try {
      const result = await catalogAPI.getStudentsByProgram(program.codigo_programa);
      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleViewAccess = async (program) => {
    setAccessProgram(program);
    setLoadingAccesses(true);
    setAccesses([]);
    setNotification(null);
    try {
      const result = await catalogAPI.getAccessByProgram(program.codigo_programa);
      if (result.success) {
        const accessData = result.data || [];
        setAccesses(accessData);
        
        // Mostrar notificación si no hay accesos
        if (accessData.length === 0) {
          setNotification({
            type: 'info',
            message: 'No hay accesos registrados para este programa de formación'
          });
          // Auto-cerrar la notificación después de 5 segundos
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      } else {
        console.error('Error obteniendo accesos:', result.message);
        setAccesses([]);
        setNotification({
          type: 'error',
          message: result.message || 'Error al obtener accesos'
        });
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error cargando accesos:', error);
      setAccesses([]);
      setNotification({
        type: 'error',
        message: 'Error al cargar los accesos del programa'
      });
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setLoadingAccesses(false);
    }
  };

  const handleProgramFormChange = (field, value) => {
    setProgramForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProgramFormSubmit = async (event) => {
    event.preventDefault();
    setFormFeedback({ type: 'info', message: 'Guardando programa...' });
    try {
      const result = await catalogAPI.createProgram(programForm);
      if (result.success) {
        setFormFeedback({ type: 'success', message: 'Programa creado correctamente' });
        setProgramForm({
          codigo_programa: '',
          nombre_programa: '',
          nivel: 'Técnico',
          area_conocimiento: '',
          duracion_meses: 12,
          descripcion: '',
          estado: 'activo'
        });
        setShowAddForm(false);
        loadPrograms();
      } else {
        setFormFeedback({ type: 'error', message: result.message || 'No se pudo crear el programa' });
      }
    } catch (error) {
      console.error('Error creando programa:', error);
      setFormFeedback({ type: 'error', message: error.response?.data?.message || 'Error al crear el programa' });
    }
    setTimeout(() => setFormFeedback(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notificación */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 max-w-md transform transition-all duration-300 ease-in-out ${
            notification.type === 'error' 
              ? 'bg-red-50 border-red-400 text-red-800' 
              : 'bg-blue-50 border-blue-400 text-blue-800'
          } border-2 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-fade-in`}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex-shrink-0 text-xl">
            {notification.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            .animate-fade-in {
              animation: slideInRight 0.3s ease-out;
            }
          `}</style>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            📚 Catálogo de Programas de Formación - CBI Palmira
          </h1>

          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Filtros rápidos</h2>
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded transition hover:bg-green-700 flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              {showAddForm ? 'Cancelar nuevo programa' : 'Agregar Programa de formación'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 border border-green-200 rounded-lg p-4 mb-6">
              <form onSubmit={handleProgramFormSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={programForm.codigo_programa}
                    onChange={(e) => handleProgramFormChange('codigo_programa', e.target.value)}
                    placeholder="Código del programa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <input
                    type="text"
                    value={programForm.nombre_programa}
                    onChange={(e) => handleProgramFormChange('nombre_programa', e.target.value)}
                    placeholder="Nombre del programa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <input
                    type="number"
                    min={1}
                    value={programForm.duracion_meses}
                    onChange={(e) => handleProgramFormChange('duracion_meses', parseInt(e.target.value, 10))}
                    placeholder="Duración meses"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={programForm.nivel}
                    onChange={(e) => handleProgramFormChange('nivel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Técnico">Técnico</option>
                    <option value="Tecnológico">Tecnológico</option>
                    <option value="Especialización">Especialización</option>
                    <option value="Complementaria">Complementaria</option>
                  </select>
                  <input
                    type="text"
                    value={programForm.area_conocimiento}
                    onChange={(e) => handleProgramFormChange('area_conocimiento', e.target.value)}
                    placeholder="Área de conocimiento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={programForm.estado}
                    onChange={(e) => handleProgramFormChange('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <textarea
                  value={programForm.descripcion}
                  onChange={(e) => handleProgramFormChange('descripcion', e.target.value)}
                  placeholder="Descripción breve"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold"
                  >
                    Guardar programa
                  </button>
                  {formFeedback && (
                    <p className={`text-sm ${formFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {formFeedback.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel
              </label>
              <select
                value={filters.nivel}
                onChange={(e) => handleFilterChange('nivel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="Técnico">Técnico</option>
                <option value="Tecnológico">Tecnológico</option>
                <option value="Especialización">Especialización</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área de Conocimiento
              </label>
              <input
                type="text"
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                placeholder="Ej: Desarrollo de Software"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Código o nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de programas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Cargando programas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <div
                  key={program.id_programa}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProgramClick(program)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {program.codigo_programa}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      program.nivel === 'Técnico' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {program.nivel}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {program.nombre_programa}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Área:</span> {program.area_conocimiento}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duración:</span> {program.duracion_meses} meses
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAccess(program);
                      }}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Ver Accesos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && programs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron programas con los filtros seleccionados.
            </div>
          )}
        </div>

        {/* Panel de estudiantes del programa seleccionado */}
        {selectedProgram && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Aprendices - {selectedProgram.nombre_programa}
              </h2>
              <button
                onClick={() => setSelectedProgram(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingStudents ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ficha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Último Acceso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Accesos (30 días)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id_persona} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {student.documento}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {student.nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.ficha || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.estado === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {student.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.ultimo_acceso
                            ? new Date(student.ultimo_acceso).toLocaleDateString('es-CO')
                            : 'Nunca'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.accesos_mes || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay aprendices registrados en este programa.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Panel de accesos del programa */}
        {accessProgram && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Accesos - {accessProgram.nombre_programa}
              </h2>
              <button
                onClick={() => {
                  setAccessProgram(null);
                  setAccesses([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingAccesses ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Cargando accesos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ficha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo Acceso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Entrada
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Salida
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duración (min)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accesses.map((access) => (
                      <tr key={access.id_acceso} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {access.documento}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {access.nombre_completo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {access.ficha || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            access.tipo_acceso === 'entrada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {access.tipo_acceso === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {access.fecha_entrada
                            ? new Date(access.fecha_entrada).toLocaleString('es-CO')
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {access.fecha_salida
                            ? new Date(access.fecha_salida).toLocaleString('es-CO')
                            : 'En curso'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {access.duracion_minutos || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            access.estado === 'completado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {access.estado || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {accesses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay accesos registrados para este programa en el período seleccionado.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramCatalog;


