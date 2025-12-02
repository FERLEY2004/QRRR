// Script para insertar usuarios de inicio de sesión
// Genera los hashes bcrypt correctamente y los inserta en la base de datos

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './dbPool.js';

dotenv.config();

const insertUsers = async () => {
  try {
    console.log('🔐 Insertando usuarios de inicio de sesión...\n');

    // Usuarios a crear
    const users = [
      {
        nombre: 'Administrador',
        email: 'admin@sena.edu.co',
        password: 'admin123',
        rol: 'admin',
        estado: 'activo'
      },
      {
        nombre: 'Guarda de Seguridad',
        email: 'guarda@sena.edu.co',
        password: 'guarda123',
        rol: 'guarda',
        estado: 'activo'
      }
    ];

    for (const userData of users) {
      try {
        // Generar hash de la contraseña
        const passwordHash = await bcrypt.hash(userData.password, 10);
        
        // Verificar si el usuario ya existe
        const [existing] = await pool.execute(
          'SELECT id_usuario FROM Usuarios WHERE email = ?',
          [userData.email]
        );

        if (existing.length > 0) {
          // Actualizar usuario existente
          await pool.execute(
            `UPDATE Usuarios 
             SET nombre = ?, password_hash = ?, rol = ?, estado = ?
             WHERE email = ?`,
            [userData.nombre, passwordHash, userData.rol, userData.estado, userData.email]
          );
          console.log(`✅ Usuario actualizado: ${userData.email} (${userData.rol})`);
        } else {
          // Insertar nuevo usuario
          await pool.execute(
            `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
             VALUES (?, ?, ?, ?, ?)`,
            [userData.nombre, userData.email, passwordHash, userData.rol, userData.estado]
          );
          console.log(`✅ Usuario creado: ${userData.email} (${userData.rol})`);
        }

        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   🔑 Contraseña: ${userData.password}`);
        console.log(`   👤 Rol: ${userData.rol}\n`);
      } catch (error) {
        console.error(`❌ Error al procesar usuario ${userData.email}:`, error.message);
      }
    }

    // Listar todos los usuarios
    console.log('📋 Usuarios en la base de datos:');
    const [allUsers] = await pool.execute(
      'SELECT id_usuario, nombre, email, rol, estado FROM Usuarios ORDER BY id_usuario'
    );
    
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.rol}) - Estado: ${user.estado}`);
    });

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

// Ejecutar el script
insertUsers();

export default insertUsers;

