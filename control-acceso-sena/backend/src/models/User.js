// User Model
// models/User.js
import pool from '../utils/dbPool.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default class User {
  // Generar token de recuperación de contraseña
  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const user = rows[0];
      
      // Mapear el campo passwords a password_hash para compatibilidad
      if (user.passwords) {
        user.password_hash = user.passwords;
      }
      
      // Validar que el usuario tenga los campos necesarios
      if (!user.password_hash && !user.passwords) {
        console.error('⚠️  Usuario sin password_hash/passwords:', email);
        throw new Error('Usuario con datos incompletos');
      }
      
      return user;
    } catch (error) {
      console.error('Error en findByEmail:', error);
      console.error('SQL Error Code:', error.code);
      console.error('SQL Error Message:', error.message);
      
      // Si la tabla no existe, lanzar error específico
      if (error.code === 'ER_NO_SUCH_TABLE') {
        throw new Error('La tabla usuarios no existe. Ejecuta el script de inicialización.');
      }
      
      throw error;
    }
  }

  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Mapear rol a mayúsculas si viene en minúsculas
      let rol = userData.rol;
      if (rol === 'admin' || rol === 'administrador') {
        rol = 'ADMINISTRADOR';
      } else if (rol === 'guarda') {
        rol = 'GUARDA';
      }
      
      // Mapear estado a mayúsculas
      const estado = userData.estado ? userData.estado.toUpperCase() : 'ACTIVO';
      
      const [result] = await pool.execute(
        `INSERT INTO usuarios (nombre, email, passwords, rol, estado) 
         VALUES (?, ?, ?, ?, ?)`,
        [userData.nombre, userData.email, hashedPassword, rol, estado]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      if (!hashedPassword || !plainPassword) {
        console.error('⚠️  Contraseña o hash faltante');
        return false;
      }
      
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error en verifyPassword:', error);
      return false;
    }
  }

  // Guardar token de recuperación de contraseña
  static async saveResetToken(email, token, expiresAt) {
    try {
      const [result] = await pool.execute(
        `UPDATE usuarios 
         SET reset_token = ?, reset_token_expires = ? 
         WHERE email = ?`,
        [token, expiresAt, email]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en saveResetToken:', error);
      throw error;
    }
  }

  // Buscar usuario por token de recuperación
  static async findByResetToken(token) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM usuarios 
         WHERE reset_token = ? AND reset_token_expires > NOW()`,
        [token]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en findByResetToken:', error);
      throw error;
    }
  }

  // Actualizar contraseña
  static async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [result] = await pool.execute(
        `UPDATE usuarios 
         SET passwords = ?, reset_token = NULL, reset_token_expires = NULL 
         WHERE id_usuario = ?`,
        [hashedPassword, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en updatePassword:', error);
      throw error;
    }
  }

  // Actualizar contraseña por email (para admin)
  static async updatePasswordByEmail(email, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [result] = await pool.execute(
        `UPDATE usuarios 
         SET passwords = ?, reset_token = NULL, reset_token_expires = NULL 
         WHERE email = ?`,
        [hashedPassword, email]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en updatePasswordByEmail:', error);
      throw error;
    }
  }

  // Limpiar token de recuperación
  static async clearResetToken(userId) {
    try {
      await pool.execute(
        `UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?`,
        [userId]
      );
    } catch (error) {
      console.error('Error en clearResetToken:', error);
    }
  }

  // Obtener solicitudes de recuperación pendientes (para admin)
  static async getPendingResetRequests() {
    try {
      const [rows] = await pool.execute(
        `SELECT id_usuario, nombre, email, reset_token_expires 
         FROM usuarios 
         WHERE reset_token IS NOT NULL AND reset_token_expires > NOW()
         ORDER BY reset_token_expires DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error en getPendingResetRequests:', error);
      return [];
    }
  }
}
