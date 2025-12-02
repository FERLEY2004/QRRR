// Access Routes
import express from 'express';
import { scanQR, scanComplete, getCurrentPeople, getDailyStats } from '../controllers/accessController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/access/scan - Escanear QR (guarda o admin)
router.post('/scan', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), scanQR);

// POST /api/access/scan-complete - Escaneo completo con fusión QR + BD
router.post('/scan-complete', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), scanComplete);

// GET /api/access/current - Personas actualmente dentro
router.get('/current', getCurrentPeople);

// GET /api/access/stats/daily - Estadísticas diarias
router.get('/stats/daily', getDailyStats);

export default router;
