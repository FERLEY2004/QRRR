// Navbar Component
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../photos/huella1.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    };

    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminMenu]);

  // Verificar si alguna ruta de administración está activa
  const isAdminRouteActive = () => {
    const adminRoutes = [
      '/admin',
      '/reports-dashboard',
      '/reports',
      '/people-search',
      '/access-history',
      '/import',
      '/program-catalog',
      '/fichas',
      '/logs'
    ];
    return adminRoutes.some(route => location.pathname.startsWith(route));
  };

  return (
    <nav className="bg-white text-blue-600 shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 text-xl font-bold text-blue-600 hover:text-blue-700 transition">
              <img src={logo} alt="Logo SENA" className="h-14 w-14 object-contain" />
              <span>Control de Acceso SENA</span>
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition text-blue-600 ${
                  isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/scanner"
                className={`px-3 py-2 rounded-md text-sm font-medium transition text-blue-600 ${
                  isActive('/scanner') ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Scanner
              </Link>
              <Link
                to="/visitors"
                className={`px-3 py-2 rounded-md text-sm font-medium transition text-blue-600 ${
                  isActive('/visitors') ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Visitantes
              </Link>
              {(user?.rol?.toUpperCase() === 'ADMIN' || user?.rol?.toUpperCase() === 'ADMINISTRADOR') && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center text-blue-600 ${
                      isAdminRouteActive() ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    Administración
                    <svg
                      className={`ml-1 h-4 w-4 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAdminMenu && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        <Link
                          to="/admin"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/admin')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">⚙️</span>
                          Gestión de Usuarios
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <Link
                          to="/reports-dashboard"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/reports-dashboard') || isActive('/reports')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">📊</span>
                          Reportes
                        </Link>
                        <Link
                          to="/people-search"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/people-search')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">🔍</span>
                          Búsqueda
                        </Link>
                        <Link
                          to="/access-history"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/access-history')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">📋</span>
                          Historial de Accesos
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <Link
                          to="/import"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/import')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">📥</span>
                          Importar Datos
                        </Link>
                        <Link
                          to="/program-catalog"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/program-catalog')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">🎓</span>
                          Programas de Formación
                        </Link>
                        <Link
                          to="/fichas"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/fichas')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">📁</span>
                          Fichas
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <Link
                          to="/logs"
                          onClick={() => setShowAdminMenu(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            isActive('/logs')
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">📋</span>
                          Logs del Sistema
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-blue-600">{(user?.nombre || '').split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
