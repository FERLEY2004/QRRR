// Export Routes - Rutas de exportación
import express from 'express';
import {
  exportToPDF,
  exportToExcel
} from '../controllers/exportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole('admin', 'ADMINISTRADOR'));

// HU8 - Exportar reporte a PDF
// POST /api/export/pdf
router.post('/pdf', exportToPDF);

// HU8 - Exportar reporte a Excel
// POST /api/export/excel
router.post('/excel', exportToExcel);

export default router;







