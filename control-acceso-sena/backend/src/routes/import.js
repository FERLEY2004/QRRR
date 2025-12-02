// Import Routes
import express from 'express';
import {
  uploadFile,
  validateData,
  executeImport,
  getImportProgress,
  getImportResults,
  upload
} from '../controllers/importController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole('admin', 'ADMINISTRADOR'));

// POST /api/import/upload - Subir archivo y previsualizar
router.post('/upload', upload.single('file'), uploadFile);

// POST /api/import/validate - Validar datos del archivo
router.post('/validate', validateData);

// POST /api/import/execute - Ejecutar importación
router.post('/execute', executeImport);

// GET /api/import/progress/:jobId - Seguimiento de progreso
router.get('/progress/:jobId', getImportProgress);

// GET /api/import/results/:jobId - Resultados finales
router.get('/results/:jobId', getImportResults);

export default router;














