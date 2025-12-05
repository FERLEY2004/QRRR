// API Service

// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos ya en la página de login
      // y si el error es realmente de autenticación (no de verificación de token durante carga inicial)
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        // Usar replace para evitar agregar al historial
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }).then(res => res.data),
  
  verifyToken: () => 
    api.get('/auth/verify').then(res => res.data),

  // Recuperación de contraseña
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then(res => res.data),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }).then(res => res.data),

  // Solo para admin
  getPendingResets: () =>
    api.get('/auth/pending-resets').then(res => res.data),

  adminResetPassword: (email, newPassword) =>
    api.post('/auth/admin-reset-password', { email, newPassword }).then(res => res.data),
};

export const accessAPI = {
  scanQR: (qrData) => 
    api.post('/access/scan', { qrData }).then(res => res.data),
  
  scanComplete: (qrData) =>
    api.post('/access/scan-complete', { qrData }).then(res => res.data),
  
  getCurrentPeople: () => 
    api.get('/access/current').then(res => res.data),
  
  getDailyStats: (date) =>
    api.get('/access/stats/daily', { params: { date } }).then(res => res.data),
};

export const analyticsAPI = {
  getCurrentOccupancy: () =>
    api.get('/analytics/current-occupancy').then(res => res.data),
  
  getStatsByFicha: (ficha) =>
    api.get(`/analytics/by-ficha/${ficha}`).then(res => res.data),
  
  getStatsByPrograma: (programa) =>
    api.get(`/analytics/by-programa/${programa}`).then(res => res.data),
  
  getAttendanceHistory: (documento, limit = 30) =>
    api.get(`/analytics/attendance-history/${documento}`, { params: { limit } }).then(res => res.data),
  
  getDailyStats: (date) =>
    api.get('/analytics/daily-stats', { params: { date } }).then(res => res.data),
};

export const visitorAPI = {
  create: (visitorData) => 
    api.post('/visitors', visitorData).then(res => res.data),
  
  generateQR: (visitorId) => 
    api.post(`/visitors/${visitorId}/qr`).then(res => res.data),
  
  getAll: () =>
    api.get('/visitors').then(res => res.data),
};

export const userAPI = {
  getAll: () =>
    api.get('/users').then(res => res.data),
  
  create: (userData) =>
    api.post('/users', userData).then(res => res.data),
  
  update: (id, userData) =>
    api.put(`/users/${id}`, userData).then(res => res.data),
  
  delete: (id) =>
    api.delete(`/users/${id}`).then(res => res.data),
};

export const dashboardAPI = {
  getMetrics: () =>
    api.get('/dashboard/metrics')
      .then(res => {
        console.log('📊 [API] Respuesta de métricas:', res.data);
        return res.data;
      })
      .catch(err => {
        console.error('❌ [API] Error en getMetrics:', err);
        throw err;
      }),
  
  getRecentAccess: (limit = 20) =>
    api.get('/dashboard/recent-access', { params: { limit } })
      .then(res => {
        console.log('🔍 [API] Respuesta de accesos recientes:', {
          success: res.data.success,
          total: res.data.data?.length || 0,
          metadata: res.data.metadata,
          request_id: res.data.metadata?.request_id
        });
        return res.data;
      })
      .catch(err => {
        console.error('❌ [API] Error en getRecentAccess:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        throw err;
      }),
  
  getAlerts: (filters = {}) =>
    api.get('/dashboard/alerts', { params: filters })
      .then(res => {
        console.log('🚨 [API] Respuesta de alertas:', res.data);
        return res.data;
      })
      .catch(err => {
        console.error('❌ [API] Error en getAlerts:', err);
        throw err;
      }),

  getAlertStats: () =>
    api.get('/dashboard/alerts/stats')
      .then(res => res.data)
      .catch(err => {
        console.error('❌ [API] Error en getAlertStats:', err);
        throw err;
      }),

  runAlertDetection: () =>
    api.post('/dashboard/alerts/detect')
      .then(res => res.data)
      .catch(err => {
        console.error('❌ [API] Error en runAlertDetection:', err);
        throw err;
      }),

  markAlertAsRead: (alertId) =>
    api.put(`/dashboard/alerts/${alertId}/read`)
      .then(res => res.data)
      .catch(err => {
        console.error('❌ [API] Error en markAlertAsRead:', err);
        throw err;
      }),

  deleteAlert: (alertId) =>
    api.delete(`/dashboard/alerts/${alertId}`)
      .then(res => res.data)
      .catch(err => {
        console.error('❌ [API] Error en deleteAlert:', err);
        throw err;
      }),

  // Alias para compatibilidad
  resolveAlert: (alertId) =>
    api.put(`/dashboard/alerts/${alertId}/read`)
      .then(res => res.data)
      .catch(err => {
        console.error('❌ [API] Error en resolveAlert:', err);
        throw err;
      }),
  
  getAccessStats: () =>
    api.get('/dashboard/access-stats')
      .then(res => {
        console.log('📈 [API] Estadísticas de diagnóstico:', res.data);
        return res.data;
      })
      .catch(err => {
        console.error('❌ [API] Error en getAccessStats:', err);
        throw err;
      }),
  
  diagnoseTables: () =>
    api.get('/dashboard/diagnose-tables')
      .then(res => {
        console.log('🔍 [API] Diagnóstico de tablas:', res.data);
        return res.data;
      })
      .catch(err => {
        console.error('❌ [API] Error en diagnoseTables:', err);
        throw err;
      }),
};

export const reportAPI = {
  getDaily: (fecha) =>
    api.get('/reports/daily', { params: { fecha } }).then(res => res.data),
  
  getWeekly: (semana) =>
    api.get('/reports/weekly', { params: { semana } }).then(res => res.data),
  
  getVisitors: (desde, hasta) =>
    api.get('/reports/visitors', { params: { desde, hasta } }).then(res => res.data),
  
  getByRole: (rol, desde, hasta) =>
    api.get('/reports/role', { params: { rol, desde, hasta } }).then(res => res.data),
  
  exportCSV: (tipo, params) =>
    api.post('/reports/export-csv', { tipo, ...params }, { 
      responseType: 'blob' 
    }).then(res => {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }),
};

export const configAPI = {
  getAll: () =>
    api.get('/config').then(res => res.data),
  
  update: (clave, valor) =>
    api.put('/config', { clave, valor }).then(res => res.data),
  
  updateMultiple: (configs) =>
    api.put('/config/multiple', { configs }).then(res => res.data),
  
  create: (clave, valor, tipo, descripcion) =>
    api.post('/config', { clave, valor, tipo, descripcion }).then(res => res.data),
};

export const securityAPI = {
  // Alertas
  getAlerts: (filters = {}) =>
    api.get('/security/alerts', { params: filters }).then(res => res.data),
  
  markAlertAsRead: (alertId) =>
    api.post(`/security/alerts/${alertId}/read`).then(res => res.data),
  
  deleteAlert: (alertId) =>
    api.delete(`/security/alerts/${alertId}`).then(res => res.data),
  
  deleteOldReadAlerts: (days = 30) =>
    api.delete('/security/alerts/old/read', { params: { days } }).then(res => res.data),
  
  getAlertStats: () =>
    api.get('/security/alerts/stats').then(res => res.data),
  
  checkAlertsNow: () =>
    api.post('/security/alerts/check-now').then(res => res.data),
  
  // Seguridad
  getSystemHealth: () =>
    api.get('/security/system-health').then(res => res.data),
  
  detectFraud: () =>
    api.get('/security/fraud-detection').then(res => res.data),
  
  getSuspiciousAttempts: (limit = 20) =>
    api.get('/security/suspicious-attempts', { params: { limit } }).then(res => res.data),
  
  getSecurityMetrics: () =>
    api.get('/security/security-metrics').then(res => res.data),
  
  // Auditoría
  getAuditLogs: (filters = {}) =>
    api.get('/security/audit-logs', { params: filters }).then(res => res.data),
  
  getSecurityLogs: (filters = {}) =>
    api.get('/security/security-logs', { params: filters }).then(res => res.data),
  
  getAccessHistory: (filters = {}) =>
    api.get('/security/access-history', { params: filters }).then(res => res.data),
};

export const importAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  
  validateData: (dataOrFileId, fieldMapping) => {
    const body = typeof dataOrFileId === 'string' && dataOrFileId.startsWith('file_')
      ? { fileId: dataOrFileId, fieldMapping }
      : { data: dataOrFileId, fieldMapping };
    return api.post('/import/validate', body).then(res => res.data);
  },
  
  executeImport: (dataOrFileId, fieldMapping) => {
    const body = typeof dataOrFileId === 'string' && dataOrFileId.startsWith('file_')
      ? { fileId: dataOrFileId, fieldMapping }
      : { data: dataOrFileId, fieldMapping };
    return api.post('/import/execute', body).then(res => res.data);
  },
  
  getProgress: (jobId) =>
    api.get(`/import/progress/${jobId}`).then(res => res.data),
  
  getResults: (jobId) =>
    api.get(`/import/results/${jobId}`).then(res => res.data),
};

export const reportsAPI = {
  // HU9 - Personas actualmente dentro
  getCurrentPeople: (filters = {}) =>
    api.get('/reports/current-people', { params: filters }).then(res => res.data),
  
  // HU7 - Flujos predictivos
  getPredictiveFlows: (filters = {}) =>
    api.get('/reports/predictive-flows', { params: filters }).then(res => res.data),
  
  // Historial de accesos
  getAccessHistory: (filters = {}, pagination = {}) =>
    api.get('/reports/access-history', { 
      params: { ...filters, ...pagination } 
    }).then(res => res.data),
};

export const searchAPI = {
  // HU26 - Búsqueda avanzada de usuarios
  searchUsers: (filters = {}, pagination = {}) =>
    api.get('/search/users', { 
      params: { ...filters, ...pagination } 
    }).then(res => res.data),
  
  // HU12 - Búsqueda de accesos
  searchAccess: (filters = {}, pagination = {}) =>
    api.get('/search/access', { 
      params: { ...filters, ...pagination } 
    }).then(res => res.data),
  
  // HU33 - Búsqueda de visitantes
  searchVisitors: (filters = {}, pagination = {}) =>
    api.get('/search/visitors', { 
      params: { ...filters, ...pagination } 
    }).then(res => res.data),
};

export const exportAPI = {
  // HU8 - Exportar a PDF
  exportToPDF: (reportType, filters = {}, data = null) =>
    api.post('/export/pdf', { reportType, filters, data }).then(res => res.data),
  
  // HU8 - Exportar a Excel
  exportToExcel: (reportType, filters = {}) =>
    api.post('/export/excel', { reportType, filters }, { 
      responseType: 'blob' 
    }).then(res => {
      const blob = new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `reporte_${reportType}_${timestamp}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }),
};

export const catalogAPI = {
  // Programas de formación
  getAllPrograms: (filters = {}) =>
    api.get('/catalog/programs', { params: filters }).then(res => res.data),
  createProgram: (programData) =>
    api.post('/catalog/programs', programData).then(res => res.data),
  createFicha: (fichaData) =>
    api.post('/catalog/fichas', fichaData).then(res => res.data),
  
  getProgramByCode: (codigo) =>
    api.get(`/catalog/programs/${codigo}`).then(res => res.data),
  
  // Fichas
  getAllFichas: (filters = {}) =>
    api.get('/catalog/fichas', { params: filters }).then(res => res.data),
  
  getFichaByCode: (codigo) =>
    api.get(`/catalog/fichas/${codigo}`).then(res => res.data),
  
  getStudentsByFicha: (codigo, filters = {}) =>
    api.get(`/catalog/fichas/${codigo}/students`, { params: filters }).then(res => res.data),
  
  getAccessByFicha: (codigo, filters = {}) =>
    api.get(`/catalog/fichas/${codigo}/access`, { params: filters }).then(res => res.data),
  
  // Ambientes
  getAllAmbientes: (filters = {}) =>
    api.get('/catalog/ambientes', { params: filters }).then(res => res.data),
  
  getAmbienteByCode: (codigo) =>
    api.get(`/catalog/ambientes/${codigo}`).then(res => res.data),
  
  getAmbientesByType: (tipo) =>
    api.get(`/catalog/ambientes/tipo/${tipo}`).then(res => res.data),
  
  // Consultas enriquecidas
  getStudentsByProgram: (codigo, filters = {}) =>
    api.get(`/catalog/programs/${codigo}/students`, { params: filters }).then(res => res.data),
  
  getAccessByProgram: (codigo, filters = {}) =>
    api.get(`/catalog/programs/${codigo}/access`, { params: filters }).then(res => res.data),
  
  getAmbientOccupation: (codigo) =>
    api.get(`/catalog/ambientes/${codigo}/occupation`).then(res => res.data),
};

export default api;