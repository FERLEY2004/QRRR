// Dashboard Routes
import express from 'express';
import { getMetrics, getRecentAccess, getAlerts, getAccessStats, resolveAlert } from '../controllers/dashboardController.js';
import { diagnoseTables } from '../controllers/diagnosticController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/dashboard/metrics - Obtener métricas consolidadas
router.get('/metrics', getMetrics);

// GET /api/dashboard/recent-access - Obtener accesos recientes
router.get('/recent-access', getRecentAccess);

// GET /api/dashboard/alerts - Obtener alertas
router.get('/alerts', getAlerts);
router.post('/alerts/:alertId/resolve', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), resolveAlert);

// GET /api/dashboard/access-stats - Endpoint de diagnóstico de accesos
router.get('/access-stats', getAccessStats);

// GET /api/dashboard/diagnose-tables - Diagnóstico completo de estructura de tablas
router.get('/diagnose-tables', diagnoseTables);

export default router;















