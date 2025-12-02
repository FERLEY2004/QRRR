// Analytics Routes - Rutas de análisis en tiempo real
import express from 'express';
import {
  getCurrentOccupancy,
  getStatsByFicha,
  getStatsByPrograma,
  getAttendanceHistory,
  getDailyStats
} from '../controllers/analyticsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/analytics/current-occupancy - Ocupación actual por ambiente
router.get('/current-occupancy', getCurrentOccupancy);

// GET /api/analytics/by-ficha/:ficha - Estadísticas por ficha
router.get('/by-ficha/:ficha', getStatsByFicha);

// GET /api/analytics/by-programa/:programa - Estadísticas por programa
router.get('/by-programa/:programa', getStatsByPrograma);

// GET /api/analytics/attendance-history/:documento - Historial de asistencias
router.get('/attendance-history/:documento', getAttendanceHistory);

// GET /api/analytics/daily-stats - Estadísticas diarias generales
router.get('/daily-stats', getDailyStats);

export default router;










