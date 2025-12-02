// Config Routes
import express from 'express';
import { 
  getConfig, 
  updateConfig, 
  updateMultipleConfig,
  createConfig,
  setupAccesosTrigger,
  syncAccesos
} from '../controllers/configController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole('admin', 'ADMINISTRADOR'));

// GET /api/config - Obtener todas las configuraciones
router.get('/', getConfig);

// PUT /api/config - Actualizar configuración
router.put('/', updateConfig);

// PUT /api/config/multiple - Actualizar múltiples configuraciones
router.put('/multiple', updateMultipleConfig);

// POST /api/config - Crear nueva configuración
router.post('/', createConfig);

// POST /api/config/setup-accesos-trigger - Verificar y crear trigger de Accesos
router.post('/setup-accesos-trigger', setupAccesosTrigger);

// POST /api/config/sync-accesos - Sincronizar tabla Accesos con datos existentes
router.post('/sync-accesos', syncAccesos);

export default router;














