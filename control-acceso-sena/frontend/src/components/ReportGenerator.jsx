// ReportGenerator Component - Generador de reportes
import React, { useState } from 'react';
import { reportAPI } from '../services/api';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  
  // Filtros por tipo de reporte
  const [filters, setFilters] = useState({
    fecha: new Date().toISOString().split('T')[0],
    semana: '',
    desde: new Date().toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
    rol: ''
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      let response;
      
      switch (reportType) {
        case 'daily':
          response = await reportAPI.getDaily(filters.fecha);
          break;
        case 'weekly':
          response = await reportAPI.getWeekly(filters.semana);
          break;
        case 'visitors':
          response = await reportAPI.getVisitors(filters.desde, filters.hasta);
          break;
        case 'role':
          response = await reportAPI.getByRole(filters.rol, filters.desde, filters.hasta);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      if (response.success) {
        setReportData(response.data);
      } else {
        setError('Error al generar el reporte');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      await reportAPI.exportCSV(reportType, filters);
    } catch (err) {
      setError('Error al exportar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-CO');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-CO');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Reporte */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Generar Reporte</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte *
            </label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReportData(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="daily">Reporte Diario</option>
              <option value="weekly">Reporte Semanal</option>
              <option value="visitors">Reporte de Visitantes</option>
              <option value="role">Reporte por Rol</option>
            </select>
          </div>

          {/* Filtros según el tipo */}
          {reportType === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={filters.fecha}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semana (Formato: YYYY-WW o dejar vacío para semana actual)
              </label>
              <input
                type="text"
                name="semana"
                value={filters.semana}
                onChange={handleFilterChange}
                placeholder="2024-W05"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {reportType === 'visitors' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  name="desde"
                  value={filters.desde}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  name="hasta"
                  value={filters.hasta}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {reportType === 'role' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  name="rol"
                  value={filters.rol}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Todos los roles</option>
                  <option value="APRENDIZ">Aprendiz</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="VISITANTE">Visitante</option>
                  <option value="GUARDA">Guarda</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  name="desde"
                  value={filters.desde}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  name="hasta"
                  value={filters.hasta}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar Reporte
                </>
              )}
            </button>
            
            {reportData && (
              <button
                onClick={handleExportCSV}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Vista Previa del Reporte */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Vista Previa del Reporte</h2>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>

          {/* Estadísticas */}
          {reportData.estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Accesos</p>
                <p className="text-2xl font-bold text-gray-800">{reportData.estadisticas.total_accesos || reportData.estadisticas.total || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-gray-800">{reportData.estadisticas.entradas || reportData.estadisticas.total_entradas || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Salidas</p>
                <p className="text-2xl font-bold text-gray-800">{reportData.estadisticas.salidas || reportData.estadisticas.total_salidas || 0}</p>
              </div>
              {reportData.estadisticas.activos !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Visitantes Activos</p>
                  <p className="text-2xl font-bold text-gray-800">{reportData.estadisticas.activos || 0}</p>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Datos */}
          {reportType === 'daily' && reportData.accesos && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.accesos.slice(0, 50).map((acceso) => (
                    <tr key={acceso.id_acceso}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(acceso.fecha_entrada)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          acceso.tipo_acceso === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {acceso.tipo_acceso}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{acceso.persona_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{acceso.documento}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{acceso.rol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.accesos.length > 50 && (
                <p className="mt-4 text-sm text-gray-500 text-center">
                  Mostrando 50 de {reportData.accesos.length} registros. Exporta el CSV para ver todos.
                </p>
              )}
            </div>
          )}

          {reportType === 'weekly' && reportData.porDia && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entradas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salidas</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.porDia.map((dia, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(dia.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{dia.total_accesos}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-semibold">{dia.entradas}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 font-semibold">{dia.salidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'visitors' && reportData.visitantes && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.visitantes.map((visitante) => (
                    <tr key={visitante.id_visitante}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(visitante.fecha_inicio)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{visitante.persona_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{visitante.documento}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{visitante.motivo_visita?.substring(0, 50)}...</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          visitante.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          visitante.estado === 'finalizado' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {visitante.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'role' && reportData.accesos && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.accesos.slice(0, 50).map((acceso) => (
                    <tr key={acceso.id_acceso}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(acceso.fecha_entrada)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          acceso.tipo_acceso === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {acceso.tipo_acceso}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{acceso.persona_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{acceso.documento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;

















