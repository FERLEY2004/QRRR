// AlertsPanel Component - Panel de alertas
import React, { useState, useMemo } from 'react';
import { dashboardAPI } from '../services/api';

const AlertsPanel = ({ alerts = [], loading = false, onAlertUpdate }) => {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [resolvingAlerts, setResolvingAlerts] = useState(new Set());
  const [resolvedAlerts, setResolvedAlerts] = useState(new Set());

  const visibleAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const alertId = alert.id || alert.id_alerta || `${alert.type || 'alert'}-${alert.createdAt || alert.fecha_creacion}`;
      return !resolvedAlerts.has(alertId);
    });
  }, [alerts, resolvedAlerts]);

  const filteredAlerts = visibleAlerts.filter(alert => {
    const severity = (alert.severity || alert.severidad || 'media').toLowerCase();
    return filterSeverity === 'all' || severity === filterSeverity;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'alta':
        return '🔴';
      case 'media':
        return '🟡';
      case 'baja':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-CO', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getSeverity = (alert) => (alert.severity || alert.severidad || 'media').toLowerCase();

  const getAlertId = (alert) => alert.id || alert.id_alerta || `${alert.type || 'alert'}-${alert.createdAt || alert.fecha_creacion}`;

  const handleResolveAlert = async (alert) => {
    const alertId = getAlertId(alert);
    if (resolvingAlerts.has(alertId)) return;

    setResolvingAlerts(prev => new Set(prev).add(alertId));

    try {
      await dashboardAPI.resolveAlert(alertId);
      setResolvedAlerts(prev => new Set(prev).add(alertId));
      onAlertUpdate?.();
    } catch (error) {
      console.error('Error al resolver alerta:', error);
    } finally {
      setResolvingAlerts(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">Alertas</h2>
          {alerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{filterSeverity !== 'all' ? 'No hay alertas de esta severidad' : 'No hay alertas pendientes'}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert, index) => {
            const severity = getSeverity(alert);
            const alertId = getAlertId(alert);
            const createdAt = alert.createdAt || alert.fecha_creacion;
            return (
              <div
                key={alertId + index}
                className={`p-4 rounded-lg border-2 ${getSeverityColor(severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getSeverityIcon(severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{alert.title || alert.titulo}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(severity)}`}>
                          {severity.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleResolveAlert(alert)}
                          disabled={resolvingAlerts.has(alertId)}
                          className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition disabled:opacity-50"
                          title="Marcar como resuelta"
                        >
                          {resolvingAlerts.has(alertId) ? '...' : '✓'}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{alert.message || alert.mensaje}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs opacity-75">
                        {formatDateTime(createdAt)}
                      </p>
                      {alert.metadata?.rol && (
                        <span className="text-xs text-blue-600 uppercase">
                          {alert.metadata.rol}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {filteredAlerts.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Mostrando {filteredAlerts.length} de {alerts.length} alertas
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;










