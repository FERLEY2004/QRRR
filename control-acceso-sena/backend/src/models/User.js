// User Model
// models/User.js
import pool from '../utils/dbPool.js';
import bcrypt from 'bcryptjs';

export default class User {
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
}
