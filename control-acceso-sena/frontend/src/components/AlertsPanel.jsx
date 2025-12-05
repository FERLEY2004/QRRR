// AlertsPanel Component - Panel de alertas
import React, { useState, useMemo } from 'react';
import { dashboardAPI } from '../services/api';

const AlertsPanel = ({ alerts = [], loading = false, onAlertUpdate }) => {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'read' - Cambiado a 'all' por defecto
  const [resolvingAlerts, setResolvingAlerts] = useState(new Set());
  const [resolvedAlerts, setResolvedAlerts] = useState(new Set());
  const [detecting, setDetecting] = useState(false);
  
  // Estado para modal de confirmación de eliminación
  const [alertToDelete, setAlertToDelete] = useState(null);

  const handleRunDetection = async () => {
    if (detecting) return;
    setDetecting(true);
    try {
      await dashboardAPI.runAlertDetection();
      onAlertUpdate?.();
    } catch (error) {
      console.error('Error ejecutando detección:', error);
    } finally {
      setDetecting(false);
    }
  };

  const visibleAlerts = useMemo(() => {
    console.log('🔔 [AlertsPanel] Alertas recibidas:', alerts.length, alerts);
    return alerts.filter(alert => {
      const alertId = alert.id || alert.id_alerta || `${alert.type || 'alert'}-${alert.createdAt || alert.fecha_creacion}`;
      return !resolvedAlerts.has(alertId);
    });
  }, [alerts, resolvedAlerts]);

  const filteredAlerts = visibleAlerts.filter(alert => {
    const severity = (alert.severity || alert.severidad || 'media').toLowerCase();
    const type = alert.type || alert.tipo || 'general';
    const isRead = alert.leida === true || alert.leida === 1;
    
    const matchSeverity = filterSeverity === 'all' || severity === filterSeverity;
    const matchType = filterType === 'all' || type === filterType;
    const matchStatus = filterStatus === 'all' || 
                       (filterStatus === 'pending' && !isRead) || 
                       (filterStatus === 'read' && isRead);
    
    return matchSeverity && matchType && matchStatus;
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

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'intento_fraudulento':
      case 'qr_invalido':
        return '🚫';
      case 'documento_no_registrado':
      case 'acceso_denegado':
        return '⛔';
      case 'comportamiento_sospechoso':
      case 'acceso_frecuente':
        return '⚠️';
      case 'acceso_fuera_horario':
        return '🕐';
      case 'qr_expirado':
        return '⏰';
      case 'seguridad':
        return '🔒';
      case 'sistema':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getAlertTypeName = (type) => {
    switch (type) {
      case 'intento_fraudulento':
      case 'qr_invalido':
        return 'QR Inválido';
      case 'documento_no_registrado':
      case 'acceso_denegado':
        return 'Acceso Denegado';
      case 'comportamiento_sospechoso':
      case 'acceso_frecuente':
        return 'Comportamiento Sospechoso';
      case 'acceso_fuera_horario':
        return 'Fuera de Horario';
      case 'qr_expirado':
        return 'QR por Expirar';
      case 'seguridad':
        return 'Seguridad';
      case 'sistema':
        return 'Sistema';
      default:
        return 'Alerta';
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

  const handleMarkAsRead = async (alert) => {
    const alertId = getAlertId(alert);
    if (resolvingAlerts.has(alertId)) return;

    setResolvingAlerts(prev => new Set(prev).add(alertId));

    try {
      await dashboardAPI.markAlertAsRead(alertId);
      setResolvedAlerts(prev => new Set(prev).add(alertId));
      onAlertUpdate?.();
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
    } finally {
      setResolvingAlerts(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  // Mostrar modal de confirmación
  const handleDeleteAlert = (alert) => {
    const alertId = getAlertId(alert);
    if (resolvingAlerts.has(alertId)) return;
    setAlertToDelete(alert);
  };

  // Confirmar eliminación
  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    
    const alertId = getAlertId(alertToDelete);
    setResolvingAlerts(prev => new Set(prev).add(alertId));
    setAlertToDelete(null);

    try {
      await dashboardAPI.deleteAlert(alertId);
      setResolvedAlerts(prev => new Set(prev).add(alertId));
      onAlertUpdate?.();
    } catch (error) {
      console.error('Error al eliminar alerta:', error);
    } finally {
      setResolvingAlerts(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  // Cancelar eliminación
  const cancelDeleteAlert = () => {
    setAlertToDelete(null);
  };

  // Alias para compatibilidad
  const handleResolveAlert = handleMarkAsRead;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">🔔 Alertas</h2>
          {alerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={handleRunDetection}
          disabled={detecting}
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition disabled:opacity-50 whitespace-nowrap"
          title="Ejecutar detección de alertas"
        >
          {detecting ? '⏳' : '🔍'} Detectar
        </button>
      </div>
      
      {/* Filtros en columna */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="read">Leídas</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Todos los tipos</option>
          <option value="intento_fraudulento">QR Inválido</option>
          <option value="documento_no_registrado">Acceso Denegado</option>
          <option value="comportamiento_sospechoso">Sospechoso</option>
          <option value="acceso_fuera_horario">Fuera de Horario</option>
          <option value="qr_expirado">QR Expirado</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Todas</option>
          <option value="critica">Crítica</option>
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
        <div className="text-center py-6 text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{filterSeverity !== 'all' || filterType !== 'all' || filterStatus !== 'all' ? 'Sin alertas con los filtros aplicados' : 'Sin alertas pendientes'}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredAlerts.map((alert, index) => {
            const severity = getSeverity(alert);
            const alertId = getAlertId(alert);
            const createdAt = alert.createdAt || alert.fecha_creacion;
            const alertType = alert.type || alert.tipo || 'general';
            const isRead = alert.leida === true || alert.leida === 1;
            const uniqueKey = `alert-${alert.id_alerta || alertId}-${index}-${createdAt}`;
            return (
              <div
                key={uniqueKey}
                className={`p-3 rounded-lg border transition-all ${getSeverityColor(severity)} ${isRead ? 'opacity-50 grayscale-[30%]' : 'shadow-sm'}`}
              >
                {/* Header de la alerta */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-lg flex-shrink-0 ${isRead ? 'grayscale' : ''}`}>{getAlertTypeIcon(alertType)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">{alert.title || alert.titulo}</h3>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {getAlertTypeName(alertType)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSeverityColor(severity)}`}>
                          {severity.toUpperCase()}
                        </span>
                        {isRead && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-300 text-gray-600 rounded flex items-center gap-0.5">
                            ✓ Leída
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Botones de acción */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert)}
                        disabled={resolvingAlerts.has(alertId)}
                        className="w-6 h-6 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded text-xs transition disabled:opacity-50"
                        title="Marcar como leída"
                      >
                        {resolvingAlerts.has(alertId) ? '·' : '✓'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAlert(alert)}
                      disabled={resolvingAlerts.has(alertId)}
                      className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded text-xs transition disabled:opacity-50"
                      title="Eliminar alerta"
                    >
                      {resolvingAlerts.has(alertId) ? '·' : '✕'}
                    </button>
                  </div>
                </div>
                {/* Mensaje */}
                <p className="text-xs text-gray-700 mb-1 line-clamp-2">{alert.message || alert.mensaje}</p>
                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{formatDateTime(createdAt)}</span>
                  {alert.metadata?.documento && (
                    <span>Doc: {alert.metadata.documento}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {filteredAlerts.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {filteredAlerts.length} de {alerts.length} alertas
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {alertToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Eliminar alerta</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">
              ¿Estás seguro de que deseas eliminar esta alerta?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 font-medium">Alerta a eliminar:</p>
              <p className="text-sm text-gray-800 font-semibold">{alertToDelete.title || alertToDelete.titulo}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteAlert}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAlert}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;










