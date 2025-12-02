// Protected Route Component
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    // Normalizar rol a mayúsculas para comparación
    const userRol = user.rol ? user.rol.toUpperCase() : '';
    // Aceptar tanto 'admin' como 'ADMINISTRADOR'
    const isAdmin = userRol === 'ADMIN' || userRol === 'ADMINISTRADOR';
    if (!isAdmin) {
      return <Navigate to="/scanner" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
