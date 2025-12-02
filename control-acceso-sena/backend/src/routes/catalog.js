// Catalog Routes - Rutas de catálogo
import express from 'express';
import {
  getAllPrograms,
  getProgramByCode,
  createProgram,
  getAllFichas,
  getFichaByCode,
  createFicha,
  getStudentsByFicha,
  getAllAmbientes,
  getAmbienteByCode,
  getAmbientesByType,
  getStudentsByProgram,
  getAmbientOccupation,
  getAccessByProgram,
  getAccessByFicha
} from '../controllers/catalogController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Programas de formación
// GET /api/catalog/programs - Lista todos los programas
router.get('/programs', getAllPrograms);

// GET /api/catalog/programs/:codigo - Programa específico
router.get('/programs/:codigo', getProgramByCode);

// POST /api/catalog/programs - Crear programa manualmente
router.post('/programs', requireRole('admin', 'ADMINISTRADOR', 'guarda', 'GUARDA'), createProgram);

// Fichas
// GET /api/catalog/fichas - Lista todas las fichas
router.get('/fichas', getAllFichas);

// GET /api/catalog/fichas/:codigo - Ficha específica
router.get('/fichas/:codigo', getFichaByCode);

// POST /api/catalog/fichas - Crear ficha
router.post('/fichas', requireRole('admin', 'ADMINISTRADOR', 'guarda', 'GUARDA'), createFicha);

// GET /api/catalog/fichas/:codigo/students - Aprendices por ficha
router.get('/fichas/:codigo/students', getStudentsByFicha);

// GET /api/catalog/fichas/:codigo/access - Accesos por ficha
router.get('/fichas/:codigo/access', getAccessByFicha);

// Ambientes
// GET /api/catalog/ambientes - Lista todos los ambientes
router.get('/ambientes', getAllAmbientes);

// GET /api/catalog/ambientes/:codigo - Ambiente específico
router.get('/ambientes/:codigo', getAmbienteByCode);

// GET /api/catalog/ambientes/tipo/:tipo - Ambientes por tipo
router.get('/ambientes/tipo/:tipo', getAmbientesByType);

// Consultas enriquecidas
// GET /api/catalog/programs/:codigo/students - Aprendices por programa
router.get('/programs/:codigo/students', getStudentsByProgram);

// GET /api/catalog/programs/:codigo/access - Accesos por programa
router.get('/programs/:codigo/access', getAccessByProgram);

// GET /api/catalog/ambientes/:codigo/occupation - Ocupación por ambiente
router.get('/ambientes/:codigo/occupation', getAmbientOccupation);

export default router;




