// Login Page
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../photos/huella1.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
