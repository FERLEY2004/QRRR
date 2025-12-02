// Search Routes - Rutas de búsqueda avanzada
import express from 'express';
import {
  searchUsers,
  searchAccess,
  searchVisitors,
  getPeopleWithFicha
} from '../controllers/searchController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// HU26 - Búsqueda avanzada de usuarios
// GET /api/search/users?q=term&role=aprendiz&ficha=255...
router.get('/users', searchUsers);

// HU12 - Búsqueda de accesos por documento y fecha
// GET /api/search/access?documento=123&fecha=2024-01-01...
router.get('/access', searchAccess);

// HU34 - Personas con ficha y programa (vista normalizada)
// GET /api/search/people?programa=foo&ficha=bar
router.get('/people', getPeopleWithFicha);

// HU33 - Búsqueda de visitantes
// GET /api/search/visitors?empresa=nombre&estado=activo...
router.get('/visitors', searchVisitors);

export default router;










