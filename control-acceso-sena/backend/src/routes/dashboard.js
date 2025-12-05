// Dashboard Routes
import express from 'express';
import { 
  getMetrics, 
  getRecentAccess, 
  getAlerts, 
  getAccessStats, 
  markAlertAsRead, 
  deleteAlert,
  getAlertStats,
  runAlertDetection
} from '../controllers/dashboardController.js';
import { diagnoseTables } from '../controllers/diagnosticController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/dashboard/metrics - Obtener métricas consolidadas
router.get('/metrics', getMetrics);

// GET /api/dashboard/recent-access - Obtener accesos recientes
router.get('/recent-access', getRecentAccess);

// Alertas
// GET /api/dashboard/alerts - Obtener alertas
router.get('/alerts', getAlerts);

// GET /api/dashboard/alerts/stats - Estadísticas de alertas
router.get('/alerts/stats', getAlertStats);

// POST /api/dashboard/alerts/detect - Ejecutar detección de alertas manualmente
router.post('/alerts/detect', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), runAlertDetection);

// PUT /api/dashboard/alerts/:alertId/read - Marcar alerta como leída
router.put('/alerts/:alertId/read', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), markAlertAsRead);

// POST /api/dashboard/alerts/:alertId/resolve - Alias para marcar como leída (compatibilidad)
router.post('/alerts/:alertId/resolve', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), markAlertAsRead);

// DELETE /api/dashboard/alerts/:alertId - Eliminar alerta
router.delete('/alerts/:alertId', requireRole('admin', 'ADMINISTRADOR'), deleteAlert);

// GET /api/dashboard/access-stats - Endpoint de diagnóstico de accesos
router.get('/access-stats', getAccessStats);

// GET /api/dashboard/diagnose-tables - Diagnóstico completo de estructura de tablas
router.get('/diagnose-tables', diagnoseTables);

export default router;















