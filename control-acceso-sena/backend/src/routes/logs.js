// Logs Routes - Rutas para logs de seguridad y auditoría
import express from 'express';
import { getLogsSeguridad, getAuditoria, getLogStats } from '../controllers/logsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticate);
router.use(requireRole('admin', 'ADMINISTRADOR'));

// GET /api/logs/seguridad - Obtener logs de seguridad
router.get('/seguridad', getLogsSeguridad);

// GET /api/logs/auditoria - Obtener registros de auditoría
router.get('/auditoria', getAuditoria);

// GET /api/logs/stats - Obtener estadísticas
router.get('/stats', getLogStats);

export default router;




