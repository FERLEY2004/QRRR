// Visitor Routes
import express from 'express';
import { createVisitor, getVisitors, generateVisitorQR } from '../controllers/visitorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/visitors - Crear visitante (guarda o admin)
router.post('/', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), createVisitor);

// GET /api/visitors - Listar visitantes
router.get('/', getVisitors);

// POST /api/visitors/:id/qr - Generar QR para visitante
router.post('/:id/qr', requireRole('guarda', 'GUARDA', 'admin', 'ADMINISTRADOR'), generateVisitorQR);

export default router;
