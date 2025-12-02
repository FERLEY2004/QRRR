// Auth Routes
import express from 'express';
import { login, verify } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify
router.get('/verify', authenticate, verify);

export default router;
