// Login Page
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import logo from '../photos/huella1.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirigir a la página desde donde venía el usuario, o según el rol
      const from = location.state?.from?.pathname;
      const userRole = localStorage.getItem('userRole');
      const normalizedRole = userRole ? userRole.toUpperCase() : '';
      
      if (from) {
        navigate(from, { replace: true });
      } else if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/scanner', { replace: true });
      }
    } catch (err) {
      // Mejorar el manejo de errores para mostrar mensajes más claros
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response) {
        // Error del servidor (401, 500, etc.)
        errorMessage = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
        if (err.response.data?.hint) {
          errorMessage += ` - ${err.response.data.hint}`;
        }
      } else if (err.request) {
        // El servidor no respondió
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:4000';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar recuperación de contraseña
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Ingresa tu correo electrónico');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(response.message || 'Solicitud enviada. Contacta al administrador para obtener tu token de recuperación.');
      
      // Si estamos en desarrollo y el token viene en la respuesta, mostrarlo
      if (response.dev_token) {
        setResetToken(response.dev_token);
        setShowResetForm(true);
        setSuccess('Token generado. Puedes usarlo para restablecer tu contraseña.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Restablecer contraseña con token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken) {
      setError('Ingresa el token de recuperación');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resetToken, newPassword);
      setSuccess(response.message || 'Contraseña actualizada exitosamente');
      
      // Volver al formulario de login después de 2 segundos
      setTimeout(() => {
        setShowForgotPassword(false);
        setShowResetForm(false);
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Volver al login
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetForm(false);
    setError('');
    setSuccess('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Formulario de solicitud de recuperación
  if (showForgotPassword && !showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Recuperar Contraseña</h1>
            <p className="text-gray-600 mt-2">Ingresa tu correo para solicitar la recuperación</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="tu.correo@sena.edu.co"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando solicitud...
                </>
              ) : (
                'Solicitar Recuperación'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ¿Ya tienes un token? Restablecer contraseña
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center mx-auto"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de restablecimiento con token
  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Contraseña</h1>
            <p className="text-gray-600 mt-2">Ingresa el token y tu nueva contraseña</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Token de Recuperación
              </label>
              <input
                id="token"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                placeholder="Ingresa el token proporcionado"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solicita este token al administrador del sistema
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Repite la contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center mx-auto"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de login principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Control de Acceso SENA" className="mx-auto h-24 w-24 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Control de Acceso SENA</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@sena.edu.co"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Enlace de recuperación de contraseña */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Credenciales por defecto:</p>
          <p className="mt-2">
            <span className="font-semibold">Admin:</span> admin@sena.edu.co / admin123<br />
            <span className="font-semibold">Guarda:</span> guarda@sena.edu.co / guarda123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
