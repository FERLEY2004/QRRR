import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TIPO_LABELS = {
  login_exitoso: { label: 'Login Exitoso', color: 'bg-green-100 text-green-800' },
  login_fallido: { label: 'Login Fallido', color: 'bg-red-100 text-red-800' },
  cambio_password: { label: 'Cambio Contraseña', color: 'bg-yellow-100 text-yellow-800' },
  modificacion_usuario: { label: 'Modificación Usuario', color: 'bg-blue-100 text-blue-800' },
  acceso_sistema: { label: 'Acceso Sistema', color: 'bg-gray-100 text-gray-800' }
};

const ACCION_LABELS = {
  INSERT: { label: 'Creación', color: 'bg-green-100 text-green-800' },
  UPDATE: { label: 'Actualización', color: 'bg-yellow-100 text-yellow-800' },
  DELETE: { label: 'Eliminación', color: 'bg-red-100 text-red-800' }
};

const LogsViewer = () => {
  const [activeTab, setActiveTab] = useState('seguridad');
  const [logsSeguridad, setLogsSeguridad] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    accion: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'seguridad') {
        const params = new URLSearchParams();
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
        if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
        params.append('page', filters.page);
        params.append('limit', 25);

        const response = await api.get(`/logs/seguridad?${params.toString()}`);
        if (response.data.success) {
          setLogsSeguridad(response.data.data || []);
          setPagination(response.data.pagination || { total: 0, totalPages: 1 });
        }
      } else {
        const params = new URLSearchParams();
        if (filters.accion) params.append('accion', filters.accion);
        if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
        if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
        params.append('page', filters.page);
        params.append('limit', 25);

        const response = await api.get(`/logs/auditoria?${params.toString()}`);
        if (response.data.success) {
          setAuditoria(response.data.data || []);
          setPagination(response.data.pagination || { total: 0, totalPages: 1 });
        }
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJSON = (json) => {
    if (!json) return '-';
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return json;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Logs del Sistema</h1>
          <p className="text-gray-600">Consulta los registros de seguridad y auditoría del sistema</p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Logs Seguridad</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalLogs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Logins Exitosos</p>
              <p className="text-2xl font-bold text-green-600">{stats.loginsExitosos}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Logins Fallidos</p>
              <p className="text-2xl font-bold text-red-600">{stats.loginsFallidos}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Auditoría</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalAuditoria}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => { setActiveTab('seguridad'); setFilters(prev => ({ ...prev, page: 1 })); }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'seguridad'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔒 Logs de Seguridad
              </button>
              <button
                onClick={() => { setActiveTab('auditoria'); setFilters(prev => ({ ...prev, page: 1 })); }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'auditoria'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Auditoría
              </button>
            </nav>
          </div>

          {/* Filtros */}
          <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3">
            {activeTab === 'seguridad' && (
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="login_exitoso">Login Exitoso</option>
                <option value="login_fallido">Login Fallido</option>
                <option value="cambio_password">Cambio Contraseña</option>
                <option value="modificacion_usuario">Modificación Usuario</option>
                <option value="acceso_sistema">Acceso Sistema</option>
              </select>
            )}
            {activeTab === 'auditoria' && (
              <select
                value={filters.accion}
                onChange={(e) => handleFilterChange('accion', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas las acciones</option>
                <option value="INSERT">Creación</option>
                <option value="UPDATE">Actualización</option>
                <option value="DELETE">Eliminación</option>
              </select>
            )}
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Desde"
            />
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Hasta"
            />
            <button
              onClick={() => setFilters({ tipo: '', accion: '', fecha_desde: '', fecha_hasta: '', page: 1 })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Limpiar filtros
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Cargando registros...</p>
              </div>
            ) : activeTab === 'seguridad' ? (
              /* Tabla de Logs de Seguridad */
              logsSeguridad.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay registros de seguridad</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logsSeguridad.map((log) => {
                        const tipoInfo = TIPO_LABELS[log.tipo] || { label: log.tipo, color: 'bg-gray-100 text-gray-800' };
                        return (
                          <tr key={log.id_log} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(log.fecha)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                                {tipoInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.nombre_usuario || log.email_usuario || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.accion}>
                              {log.accion}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                              {log.ip_address || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatJSON(log.detalles)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Tabla de Auditoría */
              auditoria.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay registros de auditoría</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Registro</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datos Anteriores</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datos Nuevos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditoria.map((item) => {
                        const accionInfo = ACCION_LABELS[item.accion] || { label: item.accion, color: 'bg-gray-100 text-gray-800' };
                        return (
                          <tr key={item.id_auditoria} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(item.fecha)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${accionInfo.color}`}>
                                {accionInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.tabla_afectada}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.id_registro}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.nombre_usuario || item.email_usuario || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatJSON(item.datos_anteriores)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatJSON(item.datos_nuevos)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Página {filters.page} de {pagination.totalPages} ({pagination.total} registros)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={filters.page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={filters.page >= pagination.totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;





