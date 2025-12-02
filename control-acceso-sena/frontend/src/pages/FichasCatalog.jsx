// FichasCatalog - Catálogo de fichas de formación
import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../services/api.js';

const FichasCatalog = () => {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: 'activo',
    search: ''
  });
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadFichas();
  }, [filters]);

  const loadFichas = async () => {
    try {
      setLoading(true);
      const result = await catalogAPI.getAllFichas(filters);
      if (result.success) {
        setFichas(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando fichas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFichaClick = async (ficha) => {
    setSelectedFicha(ficha);
    setLoadingStudents(true);
    try {
      const result = await catalogAPI.getStudentsByFicha(ficha.codigo_ficha);
      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleViewAccess = async (codigo) => {
    // Navegar a reporte de accesos por ficha
    window.location.href = `/reports-dashboard?ficha=${codigo}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            📋 Catálogo de Fichas de Formación - CBI Palmira
          </h1>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <option value="finalizado">Finalizado</option>
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
                placeholder="Código de ficha o programa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadFichas}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Lista de fichas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Cargando fichas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fichas.map((ficha) => (
                <div
                  key={ficha.id_ficha || ficha.codigo_ficha}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleFichaClick(ficha)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded">
                      {ficha.codigo_ficha}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      ficha.estado === 'activo'
                        ? 'bg-green-100 text-green-700'
                        : ficha.estado === 'finalizado'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ficha.estado}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {ficha.nombre_programa || 'Programa no especificado'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Jornada:</span> {ficha.jornada || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Aprendices:</span> {ficha.total_aprendices || 0}
                  </p>
                  {ficha.fecha_inicio && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Inicio:</span> {new Date(ficha.fecha_inicio).toLocaleDateString('es-CO')}
                    </p>
                  )}
                  {ficha.fecha_fin && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Fin:</span> {new Date(ficha.fecha_fin).toLocaleDateString('es-CO')}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAccess(ficha.codigo_ficha);
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

          {!loading && fichas.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron fichas con los filtros seleccionados.
            </div>
          )}
        </div>

        {/* Panel de estudiantes de la ficha seleccionada */}
        {selectedFicha && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Aprendices - Ficha {selectedFicha.codigo_ficha}
              </h2>
              <button
                onClick={() => setSelectedFicha(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">{selectedFicha.nombre_programa}</p>

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
                      <tr key={student.id_persona || student.documento} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {student.documento}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {student.nombre}
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
                    No hay aprendices registrados en esta ficha.
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

export default FichasCatalog;



