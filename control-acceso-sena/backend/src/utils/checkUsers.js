// Script para verificar y crear usuarios si no existen
import pool from './dbPool.js';
import bcrypt from 'bcryptjs';

const checkAndCreateUsers = async () => {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');

    // Verificar conexión
    await pool.execute('SELECT 1');
    console.log('✅ Conexión a la base de datos establecida\n');

    // Verificar si existe la tabla usuarios
    try {
      await pool.execute('SELECT 1 FROM usuarios LIMIT 1');
      console.log('✅ Tabla usuarios existe\n');
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.error('❌ La tabla usuarios no existe. Ejecuta el script schema.sql primero.');
        process.exit(1);
      }
      throw error;
    }

    // Listar todos los usuarios existentes
    const [users] = await pool.execute('SELECT id_usuario, nombre, email, rol, estado, passwords FROM usuarios');
    
    console.log(`📋 Usuarios encontrados: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('Usuarios existentes:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.rol}) - Estado: ${user.estado}`);
        console.log(`    Password hash: ${user.passwords ? user.passwords.substring(0, 30) + '...' : '❌ NO EXISTE'}`);
      });
      console.log('');
    }

    // Usuarios por defecto
    const defaultUsers = [
      {
        nombre: 'Administrador',
        email: 'admin@sena.edu.co',
        password: 'admin123',
        rol: 'ADMINISTRADOR'
      },
      {
        nombre: 'Guarda de Seguridad',
        email: 'guarda@sena.edu.co',
        password: 'guarda123',
        rol: 'GUARDA'
      }
    ];

    console.log('🔧 Verificando usuarios por defecto...\n');

    for (const userData of defaultUsers) {
      const [existing] = await pool.execute(
        'SELECT * FROM usuarios WHERE email = ?',
        [userData.email]
      );

      if (existing.length === 0) {
        // Crear usuario
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await pool.execute(
          `INSERT INTO usuarios (nombre, email, passwords, rol, estado) 
           VALUES (?, ?, ?, ?, 'ACTIVO')`,
          [userData.nombre, userData.email, passwordHash, userData.rol]
        );
        console.log(`✅ Usuario creado: ${userData.email} (${userData.rol})`);
        console.log(`   Contraseña: ${userData.password}`);
      } else {
        const user = existing[0];
        
        // Mapear passwords a password_hash para verificación
        const passwordHash = user.passwords || user.password_hash;
        
        // Verificar si tiene passwords válido
        if (!passwordHash || passwordHash.length < 20) {
          console.log(`⚠️  Usuario ${userData.email} tiene passwords inválido. Actualizando...`);
          const newPasswordHash = await bcrypt.hash(userData.password, 10);
          await pool.execute(
            'UPDATE usuarios SET passwords = ?, estado = ? WHERE email = ?',
            [newPasswordHash, 'ACTIVO', userData.email]
          );
          console.log(`✅ Passwords actualizado para ${userData.email}`);
        } else {
          // Verificar que la contraseña funcione
          const isValid = await bcrypt.compare(userData.password, passwordHash);
          if (!isValid) {
            console.log(`⚠️  La contraseña de ${userData.email} no coincide. Actualizando...`);
            const newPasswordHash = await bcrypt.hash(userData.password, 10);
            await pool.execute(
              'UPDATE usuarios SET passwords = ?, estado = ? WHERE email = ?',
              [newPasswordHash, 'ACTIVO', userData.email]
            );
            console.log(`✅ Contraseña actualizada para ${userData.email}`);
          } else {
            console.log(`✅ Usuario ${userData.email} existe y la contraseña es correcta`);
          }
        }

        // Asegurar que el usuario esté activo
        if (user.estado && user.estado.toUpperCase() !== 'ACTIVO') {
          await pool.execute(
            'UPDATE usuarios SET estado = ? WHERE email = ?',
            ['ACTIVO', userData.email]
          );
          console.log(`✅ Estado actualizado a 'ACTIVO' para ${userData.email}`);
        }
      }
    }

    console.log('\n✅ Verificación completada\n');
    console.log('📝 Credenciales por defecto:');
    console.log('   Admin:');
    console.log('     Email: admin@sena.edu.co');
    console.log('     Password: admin123');
    console.log('   Guarda:');
    console.log('     Email: guarda@sena.edu.co');
    console.log('     Password: guarda123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

checkAndCreateUsers();




