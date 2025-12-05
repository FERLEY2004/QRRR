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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">🔔 Alertas</h2>
          {alerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
          <button
            onClick={handleRunDetection}
            disabled={detecting}
            className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition disabled:opacity-50"
            title="Ejecutar detección de alertas"
          >
            {detecting ? '⏳' : '🔍'} Detectar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="pending">Pendientes</option>
            <option value="read">Leídas</option>
            <option value="all">Todas</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los tipos</option>
            <option value="intento_fraudulento">QR Inválido</option>
            <option value="documento_no_registrado">Acceso Denegado</option>
            <option value="comportamiento_sospechoso">Comportamiento Sospechoso</option>
            <option value="acceso_fuera_horario">Fuera de Horario</option>
            <option value="qr_expirado">QR Expirado</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
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
            const alertType = alert.type || alert.tipo || 'general';
            const isRead = alert.leida === true || alert.leida === 1;
            // Key única usando id_alerta + timestamp para evitar duplicados
            const uniqueKey = `alert-${alert.id_alerta || alertId}-${index}-${createdAt}`;
            return (
              <div
                key={uniqueKey}
                className={`p-4 rounded-lg border-2 transition-all ${getSeverityColor(severity)} ${isRead ? 'opacity-50 grayscale-[30%]' : 'shadow-sm'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${isRead ? 'grayscale' : ''}`}>{getAlertTypeIcon(alertType)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{alert.title || alert.titulo}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {getAlertTypeName(alertType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(severity)}`}>
                          {severity.toUpperCase()}
                        </span>
                        {isRead && (
                          <span className="text-xs px-2 py-1 bg-gray-300 text-gray-600 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Leída
                          </span>
                        )}
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(alert)}
                            disabled={resolvingAlerts.has(alertId)}
                            className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition disabled:opacity-50"
                            title="Marcar como leída"
                          >
                            {resolvingAlerts.has(alertId) ? '...' : '✓'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert)}
                          disabled={resolvingAlerts.has(alertId)}
                          className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition disabled:opacity-50"
                          title="Eliminar alerta"
                        >
                          {resolvingAlerts.has(alertId) ? '...' : '✕'}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{alert.message || alert.mensaje}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs opacity-75">
                        {formatDateTime(createdAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        {alert.metadata?.documento && (
                          <span className="text-xs text-gray-600">
                            Doc: {alert.metadata.documento}
                          </span>
                        )}
                        {alert.metadata?.rol && (
                          <span className="text-xs text-blue-600 uppercase">
                            {alert.metadata.rol}
                          </span>
                        )}
                      </div>
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










