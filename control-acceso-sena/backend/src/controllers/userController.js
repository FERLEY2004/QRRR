// User Controller
import User from '../models/User.js';
import pool from '../utils/dbPool.js';
import LogService from '../services/LogService.js';

let cachedPasswordColumns = null;

const getPasswordColumnInfo = async () => {
  if (cachedPasswordColumns) {
    return cachedPasswordColumns;
  }

  const [columns] = await pool.execute('SHOW COLUMNS FROM Usuarios');
  const columnNames = columns.map(col => col.Field.toLowerCase());
  cachedPasswordColumns = {
    hasPasswordHash: columnNames.includes('password_hash'),
    hasPasswords: columnNames.includes('passwords')
  };

  return cachedPasswordColumns;
};

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

const getPasswordPolicyError = (password) => {
  if (!password || typeof password !== 'string') {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (isDigitString(password) && isSequentialDigits(password)) {
    return 'La contraseña no puede ser una secuencia numérica consecutiva';
  }
  if (isRepeatedDigit(password)) {
    return 'La contraseña no puede repetir el mismo número 8 veces o más';
  }
  return null;
};

let cachedBcrypt = null;
const getBcrypt = async () => {
  if (!cachedBcrypt) {
    const bcryptModule = await import('bcryptjs');
    cachedBcrypt = bcryptModule.default;
  }
  return cachedBcrypt;
};

export const getUsers = async (req, res) => {
  try {
    const { rol, estado, search } = req.query;
    
    let query = 'SELECT id_usuario, nombre, email, rol, estado, fecha_creacion FROM Usuarios WHERE 1=1';
    const params = [];

    if (rol) {
      query += ' AND rol = ?';
      params.push(rol);
    }

    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }

    if (search) {
      query += ' AND (nombre LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY fecha_creacion DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const userId = await User.create({ nombre, email, password, rol });

    // Registrar en auditoría
    await LogService.auditoria(
      'Usuarios',
      userId,
      'INSERT',
      null,
      { nombre, email, rol },
      req.user?.id,
      req
    );

    // Registrar en logs de seguridad
    await LogService.modificacionUsuario(
      req.user?.id,
      `Usuario creado: ${email}`,
      { nuevo_usuario_id: userId, nombre, email, rol },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: userId,
        nombre,
        email,
        rol
      }
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, estado, currentPassword } = req.body;
    const targetId = parseInt(id, 10);
    const passwordColumns = await getPasswordColumnInfo();
    const selectFields = ['rol'];
    if (passwordColumns.hasPasswordHash) selectFields.push('password_hash');
    if (passwordColumns.hasPasswords) selectFields.push('passwords');

    const [targetRows] = await pool.execute(
      `SELECT ${selectFields.join(', ')} FROM Usuarios WHERE id_usuario = ?`,
      [targetId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const targetRole = (targetRows[0].rol || '').toUpperCase();
    const normalizedTargetRole = targetRole === 'ADMIN' ? 'ADMINISTRADOR' : targetRole;
    const currentUserId = req.user?.id;
    const storedPasswordHash = targetRows[0].password_hash || targetRows[0].passwords;
    const isEditingSelf = currentUserId === targetId;

    if (
      normalizedTargetRole === 'ADMINISTRADOR' &&
      currentUserId !== parseInt(id, 10)
    ) {
      return res.status(403).json({
        success: false,
        message: 'No puedes modificar a otro administrador'
      });
    }

    const updates = [];
    const params = [];

    if (nombre) {
      updates.push('nombre = ?');
      params.push(nombre);
    }

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (password) {
      const passwordError = getPasswordPolicyError(password);
      if (passwordError) {
        return res.status(400).json({
          success: false,
          message: passwordError
        });
      }

      if (isEditingSelf) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Debes proporcionar tu contraseña actual para cambiarla'
          });
        }
        if (!storedPasswordHash) {
          return res.status(400).json({
            success: false,
            message: 'No se encontró la contraseña actual almacenada'
          });
        }

        const bcrypt = await getBcrypt();
        const matches = await bcrypt.compare(currentPassword, storedPasswordHash);
        if (!matches) {
          return res.status(400).json({
            success: false,
            message: 'La contraseña actual no coincide'
          });
        }
      }

      const passwordColumns = await getPasswordColumnInfo();
      if (!passwordColumns.hasPasswordHash && !passwordColumns.hasPasswords) {
        return res.status(500).json({
          success: false,
          message: 'La columna de contraseña no está disponible en la base de datos'
        });
      }

      const bcrypt = await getBcrypt();
      const passwordHash = await bcrypt.hash(password, 10);

      if (passwordColumns.hasPasswordHash) {
        updates.push('password_hash = ?');
        params.push(passwordHash);
      }

      if (passwordColumns.hasPasswords) {
        updates.push('passwords = ?');
        params.push(passwordHash);
      }
    }

    if (rol) {
      updates.push('rol = ?');
      params.push(rol);
    }

    if (estado) {
      updates.push('estado = ?');
      params.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE Usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Registrar en auditoría
    const cambios = {};
    if (nombre) cambios.nombre = nombre;
    if (email) cambios.email = email;
    if (rol) cambios.rol = rol;
    if (estado) cambios.estado = estado;
    if (password) cambios.password = '***cambiada***';

    await LogService.auditoria(
      'Usuarios',
      parseInt(id, 10),
      'UPDATE',
      { id_usuario: id },
      cambios,
      req.user?.id,
      req
    );

    // Registrar cambio de contraseña específicamente
    if (password) {
      await LogService.cambioPassword(
        parseInt(id, 10),
        email || `ID:${id}`,
        req.user?.email || 'sistema',
        req
      );
    }

    // Registrar modificación general
    await LogService.modificacionUsuario(
      req.user?.id,
      `Usuario actualizado: ID ${id}`,
      { usuario_modificado_id: id, cambios },
      req
    );

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    const [userCheck] = await pool.execute(
      'SELECT id_usuario, rol FROM Usuarios WHERE id_usuario = ?',
      [id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const targetRole = (userCheck[0].rol || '').toUpperCase();
    const normalizedTargetRole = targetRole === 'ADMIN' ? 'ADMINISTRADOR' : targetRole;

    if (normalizedTargetRole === 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        message: 'No puedes eliminar a otro administrador'
      });
    }

    // Guardar datos antes de eliminar para auditoría
    const [userData] = await pool.execute(
      'SELECT nombre, email, rol FROM Usuarios WHERE id_usuario = ?',
      [id]
    );
    const deletedUserData = userData[0] || {};

    // Eliminar físicamente el usuario de la base de datos
    const [result] = await pool.execute(
      'DELETE FROM Usuarios WHERE id_usuario = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Registrar en auditoría
    await LogService.auditoria(
      'Usuarios',
      parseInt(id, 10),
      'DELETE',
      deletedUserData,
      null,
      req.user?.id,
      req
    );

    // Registrar en logs de seguridad
    await LogService.modificacionUsuario(
      req.user?.id,
      `Usuario eliminado: ${deletedUserData.email || id}`,
      { usuario_eliminado_id: id, ...deletedUserData },
      req
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
