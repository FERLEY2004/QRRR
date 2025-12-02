// Auth Middleware
import { verifyToken } from '../config/jwt.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de autenticación requerido' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: error.message || 'Token inválido' 
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    // Normalizar roles a mayúsculas para comparación
    const userRol = req.user.rol ? req.user.rol.toUpperCase() : '';
    const allowedRoles = roles.map(r => r.toUpperCase());
    
    // Mapear roles antiguos a nuevos
    const roleMap = {
      'ADMIN': 'ADMINISTRADOR',
      'GUARDA': 'GUARDA'
    };
    
    // Verificar si el rol del usuario está permitido
    const normalizedUserRol = roleMap[userRol] || userRol;
    const isAllowed = allowedRoles.some(allowed => {
      const normalizedAllowed = roleMap[allowed] || allowed;
      return normalizedUserRol === normalizedAllowed || userRol === allowed.toUpperCase();
    });

    if (!isAllowed) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permisos insuficientes',
        required: roles,
        current: req.user.rol
      });
    }

    next();
  };
};
