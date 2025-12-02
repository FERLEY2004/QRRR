// Security Routes
import express from 'express';
import {
  getAlerts,
  markAlertAsRead,
  getAlertStats,
  checkAlertsNow,
  deleteAlert,
  deleteOldReadAlerts,
  getSystemHealth,
  detectFraud,
  getSuspiciousAttempts,
  getSecurityMetrics
} from '../controllers/securityController.js';
import {
  getAuditLogs,
  getSecurityLogs,
  getAccessHistory
} from '../controllers/auditController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de alertas
router.get('/alerts', getAlerts);
router.post('/alerts/:id/read', markAlertAsRead);
router.delete('/alerts/:id', deleteAlert);
router.delete('/alerts/old/read', requireRole('admin', 'ADMINISTRADOR'), deleteOldReadAlerts);
router.get('/alerts/stats', getAlertStats);
router.post('/alerts/check-now', requireRole('admin', 'ADMINISTRADOR'), checkAlertsNow);

// Rutas de seguridad
router.get('/system-health', getSystemHealth);
router.get('/fraud-detection', requireRole('admin', 'ADMINISTRADOR'), detectFraud);
router.get('/suspicious-attempts', requireRole('admin', 'ADMINISTRADOR'), getSuspiciousAttempts);
router.get('/security-metrics', requireRole('admin', 'ADMINISTRADOR'), getSecurityMetrics);

// Rutas de auditoría
router.get('/audit-logs', requireRole('admin', 'ADMINISTRADOR'), getAuditLogs);
router.get('/security-logs', requireRole('admin', 'ADMINISTRADOR'), getSecurityLogs);
router.get('/access-history', getAccessHistory);

export default router;










