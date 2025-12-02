// Script de diagnóstico y reparación de base de datos
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'control_acceso_sena',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const diagnoseAndFix = async () => {
  try {
    console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS\n');
    
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión...');
    try {
      await pool.execute('SELECT 1');
      console.log('   ✅ Conexión exitosa\n');
    } catch (error) {
      console.error('   ❌ Error de conexión:', error.message);
      console.error('   💡 Verifica las credenciales en el archivo .env\n');
      throw error;
    }

    // 2. Verificar si la base de datos existe
    console.log('2️⃣ Verificando base de datos...');
    try {
      await pool.execute(`USE ${process.env.DB_NAME || 'control_acceso_sena'}`);
      console.log('   ✅ Base de datos existe\n');
    } catch (error) {
      console.error('   ❌ Base de datos no existe:', error.message);
      console.error('   💡 Crea la base de datos manualmente en MySQL\n');
      throw error;
    }

    // 3. Crear tabla Usuarios si no existe
    console.log('3️⃣ Verificando tabla Usuarios...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS Usuarios (
          id_usuario INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          rol ENUM('admin', 'guarda') NOT NULL DEFAULT 'guarda',
          estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabla Usuarios verificada/creada\n');
    } catch (error) {
      console.error('   ❌ Error creando tabla:', error.message);
      throw error;
    }

    // 4. Verificar y crear usuarios
    console.log('4️⃣ Verificando usuarios...');
    
    // Usuario admin
    const [adminRows] = await pool.execute(
      'SELECT * FROM Usuarios WHERE email = ?',
      ['admin@sena.edu.co']
    );
    
    if (adminRows.length === 0) {
      console.log('   📝 Creando usuario admin...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Administrador', 'admin@sena.edu.co', adminPassword, 'admin', 'activo']
      );
      console.log('   ✅ Usuario admin creado');
    } else {
      const admin = adminRows[0];
      console.log(`   ✅ Usuario admin existe (ID: ${admin.id_usuario})`);
      
      // Verificar contraseña
      const isValid = await bcrypt.compare('admin123', admin.password_hash);
      if (!isValid) {
        console.log('   ⚠️  Contraseña incorrecta, actualizando...');
        const newPassword = await bcrypt.hash('admin123', 10);
        await pool.execute(
          'UPDATE Usuarios SET password_hash = ? WHERE email = ?',
          [newPassword, 'admin@sena.edu.co']
        );
        console.log('   ✅ Contraseña admin actualizada');
      } else {
        console.log('   ✅ Contraseña admin válida');
      }
    }

    // Usuario guarda
    const [guardaRows] = await pool.execute(
      'SELECT * FROM Usuarios WHERE email = ?',
      ['guarda@sena.edu.co']
    );
    
    if (guardaRows.length === 0) {
      console.log('   📝 Creando usuario guarda...');
      const guardaPassword = await bcrypt.hash('guarda123', 10);
      await pool.execute(
        `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Guarda de Seguridad', 'guarda@sena.edu.co', guardaPassword, 'guarda', 'activo']
      );
      console.log('   ✅ Usuario guarda creado');
    } else {
      const guarda = guardaRows[0];
      console.log(`   ✅ Usuario guarda existe (ID: ${guarda.id_usuario})`);
      
      // Verificar contraseña
      const isValid = await bcrypt.compare('guarda123', guarda.password_hash);
      if (!isValid) {
        console.log('   ⚠️  Contraseña incorrecta, actualizando...');
        const newPassword = await bcrypt.hash('guarda123', 10);
        await pool.execute(
          'UPDATE Usuarios SET password_hash = ? WHERE email = ?',
          [newPassword, 'guarda@sena.edu.co']
        );
        console.log('   ✅ Contraseña guarda actualizada');
      } else {
        console.log('   ✅ Contraseña guarda válida');
      }
    }

    console.log('\n5️⃣ Listando todos los usuarios:');
    const [allUsers] = await pool.execute('SELECT id_usuario, nombre, email, rol, estado FROM Usuarios');
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.rol}) - Estado: ${user.estado} - ID: ${user.id_usuario}`);
    });

    console.log('\n✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
    console.log('\n📋 Credenciales por defecto:');
    console.log('   Admin: admin@sena.edu.co / admin123');
    console.log('   Guarda: guarda@sena.edu.co / guarda123');
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL DIAGNÓSTICO:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('\n💡 SOLUCIONES:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   1. Verifica las credenciales en el archivo .env');
      console.error('   2. Asegúrate de que el usuario MySQL tenga permisos');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   1. Crea la base de datos: CREATE DATABASE control_acceso_sena;');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   1. Asegúrate de que MySQL esté corriendo');
      console.error('   2. Verifica que el puerto sea 3306');
    }
    
    console.error('\n   Stack:', error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

diagnoseAndFix();

