// Users Routes
import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole('admin', 'ADMINISTRADOR'));

// GET /api/users - Listar usuarios
router.get('/', getUsers);

// POST /api/users - Crear usuario
router.post('/', createUser);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', updateUser);

// DELETE /api/users/:id - Eliminar usuario (desactivar)
router.delete('/:id', deleteUser);

export default router;
