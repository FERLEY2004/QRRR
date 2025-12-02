import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../services/api.js';

const initialFilters = {
  estado: '',
  programa: '',
  search: ''
};

const initialForm = {
  codigo_ficha: '',
  codigo_programa: '',
  jornada: 'diurna',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'activa',
  numero_aprendices: 0,
  capacidad_maxima: ''
};

const FichaCatalog = () => {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState(null);
  const [programs, setPrograms] = useState([]);
  
  // Estados para consulta de accesos
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [accessData, setAccessData] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessFilters, setAccessFilters] = useState({
    fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadFichas();
  }, [filters]);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const result = await catalogAPI.getAllPrograms({ estado: 'activo' });
      if (result.success) {
        setPrograms(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando programas para fichas:', error);
    }
  };

  const loadFichas = async () => {
    setLoading(true);
    try {
      const result = await catalogAPI.getAllFichas(filters);
      if (result.success) {
        setFichas(result.data || []);
      } else {
        setFichas([]);
      }
    } catch (error) {
      console.error('Error cargando fichas:', error);
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAccessFilterChange = (key, value) => {
    setAccessFilters(prev => ({ ...prev, [key]: value }));
  };

  const loadAccessData = async (codigoFicha) => {
    setAccessLoading(true);
    try {
      const result = await catalogAPI.getAccessByFicha(codigoFicha, accessFilters);
      if (result.success) {
        setAccessData(result);
      } else {
        setAccessData(null);
        setFeedback({ type: 'error', message: result.message || 'No se encontraron accesos' });
      }
    } catch (error) {
      console.error('Error cargando accesos:', error);
      setAccessData(null);
      setFeedback({ type: 'error', message: 'Error al cargar los accesos de la ficha' });
    } finally {
      setAccessLoading(false);
    }
  };

  const handleViewAccess = (ficha) => {
    setSelectedFicha(ficha);
    loadAccessData(ficha.codigo_ficha);
  };

  const handleCloseAccessModal = () => {
    setSelectedFicha(null);
    setAccessData(null);
  };

  const handleRefreshAccess = () => {
    if (selectedFicha) {
      loadAccessData(selectedFicha.codigo_ficha);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: 'info', message: 'Guardando ficha...' });

    try {
      const payload = {
        ...form,
        numero_aprendices: Number(form.numero_aprendices) || 0,
        capacidad_maxima: form.capacidad_maxima ? Number(form.capacidad_maxima) : null
      };

      const result = await catalogAPI.createFicha(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Ficha creada correctamente' });
        setForm(initialForm);
        loadFichas();
      } else {
        setFeedback({
          type: 'error',
          message: result.message || 'No se pudo crear la ficha'
        });
      }
    } catch (error) {
      console.error('Error creando ficha:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error al crear la ficha'
      });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📁 Catálogo de Fichas</h1>
              <p className="text-gray-600">
                Gestiona fichas y sus programas asociados sin duplicar vistas.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Buscar por ficha o programa"
                className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-64"
              />
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Estado</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <select
                value={filters.programa}
                onChange={(e) => handleFilterChange('programa', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Programa</option>
                {programs.map(program => (
                  <option key={program.id_programa} value={program.nombre_programa}>
                    {program.nombre_programa}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nueva ficha</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={form.codigo_ficha}
                onChange={(e) => handleFormChange('codigo_ficha', e.target.value)}
                placeholder="Código de ficha"
                required
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Programa de formación
                </label>
                <input
                  list="programs"
                  value={form.codigo_programa}
                  onChange={(e) => handleFormChange('codigo_programa', e.target.value)}
                  placeholder="Código del programa"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <datalist id="programs">
                  {programs.map(program => (
                    <option
                      key={program.id_programa}
                      value={program.codigo_programa}
                    >
                      {program.nombre_programa}
                    </option>
                  ))}
                </datalist>
              </div>
              <select
                value={form.jornada}
                onChange={(e) => handleFormChange('jornada', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="diurna">Diurna</option>
                <option value="nocturna">Nocturna</option>
                <option value="mixta">Mixta</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => handleFormChange('fecha_inicio', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => handleFormChange('fecha_fin', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={form.estado}
                onChange={(e) => handleFormChange('estado', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                min={0}
                value={form.numero_aprendices}
                onChange={(e) => handleFormChange('numero_aprendices', e.target.value)}
                placeholder="Número de aprendices"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                min={0}
                value={form.capacidad_maxima}
                onChange={(e) => handleFormChange('capacidad_maxima', e.target.value)}
                placeholder="Capacidad máxima"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
              >
                Guardar ficha
              </button>
              {feedback && (
                <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {feedback.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Listado de fichas</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Cargando fichas...</p>
            </div>
          ) : fichas.length === 0 ? (
            <p className="text-gray-600">No hay fichas que cumplan los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ficha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jornada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprendices</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última actualización</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fichas.map(ficha => (
                    <tr key={ficha.id_ficha} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{ficha.codigo_ficha}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium">{ficha.nombre_programa || ficha.programa_formacion || '—'}</p>
                        <p className="text-xs text-gray-500">{ficha.codigo_programa}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">{ficha.jornada || 'diurna'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        <span className={`px-2 py-1 rounded text-xs ${ficha.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {ficha.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ficha.numero_aprendices ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ficha.capacidad_maxima ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {ficha.fecha_fin ? new Date(ficha.fecha_fin).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleViewAccess(ficha)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1"
                          title="Ver accesos de esta ficha"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Ver accesos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de accesos por ficha */}
        {selectedFicha && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">📊 Accesos de Ficha {selectedFicha.codigo_ficha}</h3>
                  <p className="text-indigo-100 text-sm">{selectedFicha.nombre_programa || 'Sin programa asignado'}</p>
                </div>
                <button
                  onClick={handleCloseAccessModal}
                  className="text-white hover:text-indigo-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Filtros de fecha */}
                <div className="flex flex-wrap gap-4 mb-6 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={accessFilters.fecha_desde}
                      onChange={(e) => handleAccessFilterChange('fecha_desde', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={accessFilters.fecha_hasta}
                      onChange={(e) => handleAccessFilterChange('fecha_hasta', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={handleRefreshAccess}
                    disabled={accessLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {accessLoading ? 'Cargando...' : '🔄 Actualizar'}
                  </button>
                </div>

                {accessLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-gray-600">Cargando accesos...</p>
                  </div>
                ) : accessData ? (
                  <>
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{accessData.estadisticas?.total_accesos || 0}</p>
                        <p className="text-sm text-gray-600">Total accesos</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{accessData.estadisticas?.entradas || 0}</p>
                        <p className="text-sm text-gray-600">Entradas</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">{accessData.estadisticas?.salidas || 0}</p>
                        <p className="text-sm text-gray-600">Salidas</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{accessData.estadisticas?.aprendices_unicos || 0}</p>
                        <p className="text-sm text-gray-600">Aprendices únicos</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-600">{accessData.estadisticas?.tiempo_promedio || 0} min</p>
                        <p className="text-sm text-gray-600">Tiempo promedio</p>
                      </div>
                    </div>

                    {/* Tabla de accesos */}
                    {accessData.data && accessData.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {accessData.data.map((access, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{access.documento}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{access.nombre_completo?.trim() || '—'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    access.tipo_acceso === 'entrada' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {access.tipo_acceso === 'entrada' ? '↓ Entrada' : '↑ Salida'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {access.fecha_hora ? new Date(access.fecha_hora).toLocaleString('es-CO') : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {access.duracion_minutos ? `${access.duracion_minutos} min` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    access.estado === 'completado' 
                                      ? 'bg-gray-100 text-gray-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {access.estado || 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No se encontraron accesos para esta ficha en el período seleccionado.</p>
                      </div>
                    )}

                    {/* Información del período */}
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      Período: {accessData.periodo?.fecha_desde} — {accessData.periodo?.fecha_hasta}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay datos de accesos disponibles.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FichaCatalog;

