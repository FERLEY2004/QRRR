// Auth Context

// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.verifyToken();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          // Si la respuesta no es exitosa, limpiar el token
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Solo limpiar el token si es un error de autenticación real
      // No redirigir aquí, dejar que el interceptor de axios lo maneje
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Verificar que la respuesta tenga la estructura correcta
      if (!response.success) {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
      
      const { user: userData, token } = response;
      
      if (!userData || !token) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userData.rol);
      setUser(userData);
      
      return userData;
    } catch (error) {
      // Si es un error de axios, extraer el mensaje del servidor
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Si es un error de conexión
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('No se puede conectar al servidor. Verifica que el servidor backend esté corriendo.');
      }
      // Otros errores
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};