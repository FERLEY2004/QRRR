// Admin Panel - Gestión completa del sistema
import React, { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SystemConfig from '../components/SystemConfig.jsx';

const isDigitString = (value) => /^\d+$/.test(value);

const isSequentialDigits = (value) => {
  if (!isDigitString(value) || value.length < 2) {
    return false;
  }

  let ascending = true;
  let descending = true;

  for (let i = 1; i < value.length; i++) {
    const prev = parseInt(value[i - 1], 10);
    const current = parseInt(value[i], 10);
    const diff = current - prev;
    if (diff !== 1) ascending = false;
    if (diff !== -1) descending = false;
  }

  return ascending || descending;
};

const isRepeatedDigit = (value) => {
  if (!isDigitString(value) || value.length < 8) {
    return false;
  }

  const uniqueDigits = new Set(value.split(''));
  return uniqueDigits.size === 1;
};

const getPasswordValidationError = (password) => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (isDigitString(password) && isSequentialDigits(password)) {
    return 'No puedes usar una secuencia numérica consecutiva como contraseña';
  }
  if (isRepeatedDigit(password)) {
    return 'No puedes repetir el mismo número ocho veces o más';
  }
  return null;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    passwordConfirm: '',
    currentPassword: '',
    rol: 'GUARDA',
    estado: 'ACTIVO'
  });
  const { user } = useAuth();

  // Estados para recuperación de contraseña
  const [pendingResets, setPendingResets] = useState([]);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
    if (activeTab === 'password-recovery') {
      loadPendingResets();
    }
  }, [activeTab]);

  // Cargar solicitudes de recuperación pendientes
  const loadPendingResets = async () => {
    try {
      const response = await authAPI.getPendingResets();
      if (response.success) {
        setPendingResets(response.data || []);
      }
    } catch (err) {
      console.error('Error al cargar solicitudes pendientes:', err);
    }
  };

  // Restablecer contraseña por admin
  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail) {
      setError('Selecciona o ingresa un email');
      return;
    }

    if (!resetNewPassword) {
      setError('Ingresa la nueva contraseña');
      return;
    }

    if (resetNewPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoadingReset(true);

    try {
      const response = await authAPI.adminResetPassword(resetEmail, resetNewPassword);
      setSuccess(response.message || 'Contraseña restablecida exitosamente');
      setResetEmail('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      loadPendingResets();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoadingReset(false);
    }
  };

  useEffect(() => {
    // Filtrar usuarios cuando cambian los filtros
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => {
        const userRol = u.rol ? u.rol.toUpperCase() : '';
        const filterRolUpper = filterRole.toUpperCase();
        // Mapear 'admin' a 'ADMINISTRADOR' para comparación
        if (filterRolUpper === 'ADMIN') {
          return userRol === 'ADMIN' || userRol === 'ADMINISTRADOR';
        }
        return userRol === filterRolUpper;
      });
    }

    if (filterEstado !== 'all') {
      filtered = filtered.filter(u => {
        const userEstado = u.estado ? u.estado.toUpperCase() : '';
        const filterEstadoUpper = filterEstado.toUpperCase();
        return userEstado === filterEstadoUpper;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterEstado]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const isEditingSelf = editingUser && editingUser.id_usuario === user?.id;

    try {
      if (editingUser) {
        if (formData.password) {
          if (formData.password !== formData.passwordConfirm) {
            setError('La contraseña y su confirmación no coinciden');
            return;
          }
          const passwordError = getPasswordValidationError(formData.password);
          if (passwordError) {
            setError(passwordError);
            return;
          }
          if (isEditingSelf && !formData.currentPassword) {
            setError('Debes indicar tu contraseña actual para cambiarla');
            return;
          }
        }

        const updateData = {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          estado: formData.estado
        };
        if (formData.password) {
          updateData.password = formData.password;
          if (isEditingSelf) {
            updateData.currentPassword = formData.currentPassword;
          }
        }

        await userAPI.update(editingUser.id_usuario, updateData);
        setSuccess('Usuario actualizado exitosamente');
      } else {
        if (!formData.password) {
          setError('La contraseña es requerida para nuevos usuarios');
          return;
        }
        if (formData.password !== formData.passwordConfirm) {
          setError('La contraseña y su confirmación no coinciden');
          return;
        }
        const passwordError = getPasswordValidationError(formData.password);
        if (passwordError) {
          setError(passwordError);
          return;
        }

        await userAPI.create({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
          estado: formData.estado
        });
        setSuccess('Usuario creado exitosamente');
      }
      
      setShowUserForm(false);
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        passwordConfirm: '',
        currentPassword: '',
        rol: 'GUARDA',
        estado: 'ACTIVO'
      });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      nombre: userToEdit.nombre,
      email: userToEdit.email,
      password: '',
      passwordConfirm: '',
      currentPassword: '',
      rol: userToEdit.rol,
      estado: userToEdit.estado
    });
    setShowUserForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await userAPI.delete(userId);
      
      if (response.success) {
        // Actualizar el estado local inmediatamente removiendo el usuario
        setUsers(prevUsers => prevUsers.filter(u => u.id_usuario !== userId));
        setSuccess('Usuario eliminado exitosamente');
        
        // Recargar usuarios para asegurar sincronización con el backend
        await loadUsers();
      } else {
        setError(response.message || 'Error al eliminar usuario');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMessage);
      console.error('Error al eliminar usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      passwordConfirm: '',
      currentPassword: '',
      rol: 'GUARDA',
      estado: 'ACTIVO'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Gestión completa del sistema</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('password-recovery')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'password-recovery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recuperar Contraseñas
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración
          </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
                  {!showUserForm && (
                    <button
                      onClick={() => setShowUserForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      + Nuevo Usuario
                    </button>
                  )}
                </div>

                {/* Búsqueda y Filtros */}
                {!showUserForm && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buscar
                        </label>
                        <input
                          type="text"
                          placeholder="Buscar por nombre o email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filtrar por Rol
                        </label>
                        <select
                          value={filterRole}
                          onChange={(e) => setFilterRole(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="all">Todos los roles</option>
                          <option value="ADMINISTRADOR">Administrador</option>
                          <option value="GUARDA">Guarda</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filtrar por Estado
                        </label>
                        <select
                          value={filterEstado}
                          onChange={(e) => setFilterEstado(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="all">Todos los estados</option>
                          <option value="ACTIVO">Activo</option>
                          <option value="INACTIVO">Inactivo</option>
                        </select>
                      </div>
                    </div>
                    {(searchTerm || filterRole !== 'all' || filterEstado !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterRole('all');
                          setFilterEstado('all');
                        }}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                {showUserForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!editingUser}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {editingUser ? 'Confirmar nueva contraseña' : 'Confirmar contraseña *'}
                          </label>
                          <input
                            type="password"
                            name="passwordConfirm"
                            value={formData.passwordConfirm}
                            onChange={handleInputChange}
                            required={!editingUser || !!formData.password}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol *
                          </label>
                          <select
                            name="rol"
                            value={formData.rol}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="GUARDA">Guarda de Seguridad</option>
                            <option value="ADMINISTRADOR">Administrador</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado *
                          </label>
                            <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="ACTIVO">Activo</option>
                            <option value="INACTIVO">Inactivo</option>
                          </select>
                        </div>
                      </div>

                      {editingUser && editingUser.id_usuario === user?.id && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña anterior {formData.password ? '*' : '(solo si vas a cambiarla)'}
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            required={!!formData.password}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Solo se solicita cuando vas a actualizar tu propia contraseña.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                        >
                          {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading && !showUserForm ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                              {searchTerm || filterRole !== 'all' || filterEstado !== 'all' 
                                ? 'No se encontraron usuarios con los filtros aplicados'
                                : 'No hay usuarios registrados'}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id_usuario} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {u.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {u.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  (u.rol?.toUpperCase() === 'ADMIN' || u.rol?.toUpperCase() === 'ADMINISTRADOR') 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {(u.rol?.toUpperCase() === 'ADMIN' || u.rol?.toUpperCase() === 'ADMINISTRADOR') 
                                    ? 'Administrador' 
                                    : 'Guarda'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  (u.estado?.toUpperCase() === 'ACTIVO') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {(u.estado?.toUpperCase() === 'ACTIVO') ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(u)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Editar
                                  </button>
                                  {u.id_usuario !== user?.id && (
                                    <button
                                      onClick={() => handleDelete(u.id_usuario)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {filteredUsers.length > 0 && (
                      <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600">
                        Mostrando {filteredUsers.length} de {users.length} usuarios
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'password-recovery' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Recuperación de Contraseñas</h2>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Formulario para restablecer contraseña */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Restablecer Contraseña</h3>
                    </div>

                    <form onSubmit={handleAdminResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email del Usuario
                        </label>
                        <select
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Seleccionar usuario...</option>
                          {users.map((u) => (
                            <option key={u.id_usuario} value={u.email}>
                              {u.nombre} ({u.email})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          O ingresa el email manualmente:
                        </p>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="usuario@sena.edu.co"
                          className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Contraseña
                        </label>
                        <input
                          type="password"
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Repite la contraseña"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingReset}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {loadingReset ? 'Restableciendo...' : 'Restablecer Contraseña'}
                      </button>
                    </form>
                  </div>

                  {/* Solicitudes pendientes */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Solicitudes Pendientes</h3>
                    </div>

                    {pendingResets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No hay solicitudes pendientes</p>
                        <p className="text-sm mt-1">Las solicitudes aparecerán aquí cuando un usuario solicite recuperar su contraseña</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingResets.map((request) => (
                          <div 
                            key={request.id} 
                            className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium text-gray-800">{request.nombre}</p>
                              <p className="text-sm text-gray-500">{request.email}</p>
                              <p className="text-xs text-amber-600 mt-1">
                                Expira: {new Date(request.expira).toLocaleString('es-CO')}
                              </p>
                            </div>
                            <button
                              onClick={() => setResetEmail(request.email)}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition"
                            >
                              Seleccionar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={loadPendingResets}
                      className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualizar lista
                    </button>
                  </div>
                </div>

                {/* Información */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-blue-800">Cómo funciona</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Los usuarios pueden solicitar recuperación desde la página de inicio de sesión</li>
                        <li>• Las solicitudes aparecen en "Solicitudes Pendientes" con un tiempo de expiración</li>
                        <li>• Como administrador, puedes restablecer la contraseña de cualquier usuario directamente</li>
                        <li>• También puedes dar el token al usuario para que él mismo restablezca su contraseña</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <SystemConfig />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
