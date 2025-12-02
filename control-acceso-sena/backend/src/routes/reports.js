// Reports Routes
import express from 'express';
import { 
  getDailyReport, 
  getWeeklyReport, 
  getVisitorsReport, 
  getRoleReport,
  exportReportCSV 
} from '../controllers/reportController.js';
import {
  getCurrentPeople,
  getPredictiveFlows,
  getAccessHistory,
  getAccessByProgram
} from '../controllers/reportsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas existentes (requieren admin o ADMINISTRADOR)
router.get('/daily', requireRole('admin', 'ADMINISTRADOR'), getDailyReport);
router.get('/weekly', requireRole('admin', 'ADMINISTRADOR'), getWeeklyReport);
router.get('/visitors', requireRole('admin', 'ADMINISTRADOR'), getVisitorsReport);
router.get('/role', requireRole('admin', 'ADMINISTRADOR'), getRoleReport);
router.post('/export-csv', requireRole('admin', 'ADMINISTRADOR'), exportReportCSV);

// Nuevas rutas de reportes (HU9, HU11, HU20, HU27, HU7)
// GET /api/reports/current-people - HU9: Personas actualmente dentro
router.get('/current-people', getCurrentPeople);

// GET /api/reports/predictive-flows - HU7: Flujos predictivos
router.get('/predictive-flows', getPredictiveFlows);

// GET /api/reports/access-history - Historial de accesos con filtros
router.get('/access-history', getAccessHistory);

// GET /api/reports/program/:codigo/access - Accesos por programa específico
router.get('/program/:codigo/access', getAccessByProgram);

export default router;








