// Auth Routes
import express from 'express';
import { 
  login, 
  verify, 
  requestPasswordReset, 
  resetPassword, 
  getPendingResets,
  adminResetPassword 
} from '../controllers/authController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify
router.get('/verify', authenticate, verify);

// POST /api/auth/forgot-password - Solicitar recuperación
router.post('/forgot-password', requestPasswordReset);

// POST /api/auth/reset-password - Restablecer con token
router.post('/reset-password', resetPassword);

// GET /api/auth/pending-resets - Ver solicitudes pendientes (solo admin)
router.get('/pending-resets', authenticate, requireRole('ADMINISTRADOR'), getPendingResets);

// POST /api/auth/admin-reset-password - Restablecer por admin
router.post('/admin-reset-password', authenticate, requireRole('ADMINISTRADOR'), adminResetPassword);

export default router;
