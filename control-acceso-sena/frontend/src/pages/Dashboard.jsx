// Dashboard Page - Vista en tiempo real completa
import React from 'react';
import { useAuth } from '../context/AuthContext';
import useDashboard from '../hooks/useDashboard';
import MetricCard from '../components/MetricCard';
import CurrentPeopleList from '../components/CurrentPeopleList';
import AlertsPanel from '../components/AlertsPanel';

const Dashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, lastUpdate, refresh } = useDashboard();

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de Control de Acceso</h1>
              <p className="text-gray-600">Vista en tiempo real del sistema</p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Última actualización</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatTime(lastUpdate)}
                  </p>
                </div>
              )}
              <button
                onClick={refresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Personas Dentro"
            value={data.metrics?.currentPeople || 0}
            icon="👥"
            borderColor="blue"
            loading={loading}
          />
          
          <MetricCard
            title="Accesos Hoy"
            value={data.metrics?.todayAccess?.total || 0}
            icon="📊"
            trend={data.metrics?.trendAccess !== undefined 
              ? `${data.metrics.trendAccess >= 0 ? '+' : ''}${data.metrics.trendAccess}% vs ayer`
              : undefined}
            borderColor="green"
            loading={loading}
          />
          
          <MetricCard
            title="Entradas Hoy"
            value={data.metrics?.todayAccess?.entradas || 0}
            icon="→"
            borderColor="green"
            loading={loading}
          />
          
          <MetricCard
            title="Salidas Hoy"
            value={data.metrics?.todayAccess?.salidas || 0}
            icon="←"
            borderColor="orange"
            loading={loading}
          />
        </div>

        {/* Métricas Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Visitantes Activos"
            value={data.metrics?.activeVisitors || 0}
            icon="👤"
            borderColor="purple"
            loading={loading}
          />
          
          <MetricCard
            title="Alertas Pendientes"
            value={data.metrics?.pendingAlerts || 0}
            icon="⚠️"
            borderColor={data.metrics?.pendingAlerts > 0 ? 'red' : 'yellow'}
            alert={data.metrics?.pendingAlerts > 0}
            loading={loading}
          />
          
          <MetricCard
            title="Accesos (7 días)"
            value={data.metrics?.statsLast7Days?.total_accesos || 0}
            icon="📈"
            borderColor="blue"
            loading={loading}
            trend={data.metrics?.statsLast7Days?.personas_unicas 
              ? `${data.metrics.statsLast7Days.personas_unicas} personas únicas`
              : undefined}
          />
          
          <MetricCard
            title="Tiempo Promedio"
            value={data.metrics?.statsLast7Days?.tiempo_promedio_minutos 
              ? `${Math.floor(data.metrics.statsLast7Days.tiempo_promedio_minutos / 60)}h ${data.metrics.statsLast7Days.tiempo_promedio_minutos % 60}m`
              : 'N/A'}
            icon="⏱️"
            borderColor="purple"
            loading={loading}
          />
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Personas Dentro - Ocupa 2 columnas */}
          <div className="lg:col-span-2">
            <CurrentPeopleList 
              people={data.people} 
              loading={loading} 
              onRefresh={refresh}
            />
          </div>

          {/* Alertas - Ocupa 1 columna */}
          <div className="lg:col-span-1">
            <AlertsPanel 
              alerts={data.alerts} 
              loading={loading}
              onAlertUpdate={refresh}
            />
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Información del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Usuario Actual</p>
              <p className="text-lg font-semibold text-gray-800">{user?.nombre || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">{user?.email || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rol</p>
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {(user?.rol?.toUpperCase() === 'ADMIN' || user?.rol?.toUpperCase() === 'ADMINISTRADOR') 
                  ? 'Administrador' 
                  : user?.rol?.toUpperCase() === 'GUARDA' 
                    ? 'Guarda de Seguridad' 
                    : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Estado del Sistema</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} ${!error ? 'animate-pulse' : ''}`}></div>
                <p className="text-sm font-medium text-gray-800">
                  {error ? 'Error de conexión' : 'Operativo'}
                </p>
              </div>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-2">
                  Actualizado: {formatTime(lastUpdate)}
                </p>
              )}
            </div>
          </div>
          
          {data.metrics?.outOfScheduleAccess > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-yellow-800">
                  {data.metrics.outOfScheduleAccess} acceso(s) fuera de horario detectado(s) hoy
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

