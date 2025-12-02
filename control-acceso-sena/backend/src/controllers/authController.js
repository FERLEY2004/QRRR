// Auth Controller
import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import LogService from '../services/LogService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📥 Datos recibidos:', { 
      email: email ? `${email.substring(0, 10)}...` : 'undefined',
      passwordLength: password ? password.length : 0,
      bodyKeys: Object.keys(req.body)
    });

    if (!email || !password) {
      console.log('❌ Faltan campos requeridos:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    console.log(`🔐 Intento de login: ${email}`);

    // Buscar usuario por email
    let user;
    try {
      user = await User.findByEmail(email);
    } catch (error) {
      console.error('❌ Error al buscar usuario:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error stack:', error.stack);
      
      // Si la tabla no existe, dar mensaje específico
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('no existe')) {
        return res.status(500).json({
          success: false,
          message: 'Base de datos no inicializada. Ejecuta el script de inicialización.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Si hay error de datos incompletos
      if (error.message.includes('incompletos')) {
        return res.status(500).json({
          success: false,
          message: 'Usuario con datos incompletos. Ejecuta el script checkUsers.js para corregirlo.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      throw error;
    }

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      console.log(`💡 Sugerencia: Ejecuta el script checkUsers.js para crear usuarios por defecto`);
      
      // Registrar intento fallido
      await LogService.loginFallido(email, 'Usuario no encontrado', req);
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        hint: process.env.NODE_ENV === 'development' ? 'Usuario no encontrado en la base de datos' : undefined
      });
    }

    console.log(`✅ Usuario encontrado: ${user.email}, Estado: ${user.estado}`);
    console.log(`   ID: ${user.id_usuario}, Rol: ${user.rol}`);
    console.log(`   Password hash existe: ${!!user.password_hash}`);
    console.log(`   Password hash length: ${user.password_hash ? user.password_hash.length : 0}`);

    // Verificar que tenga password_hash
    if (!user.password_hash || user.password_hash.length < 20) {
      console.error(`❌ Usuario sin password_hash válido: ${email}`);
      console.error(`💡 Ejecuta el script checkUsers.js para corregir este problema`);
      return res.status(500).json({
        success: false,
        message: 'Error en datos del usuario. Ejecuta el script checkUsers.js para corregirlo.',
        error: process.env.NODE_ENV === 'development' ? 'Password hash inválido o faltante' : undefined
      });
    }

    // Verificar contraseña
    console.log(`🔐 Verificando contraseña...`);
    const isValidPassword = await User.verifyPassword(password, user.password_hash);

    console.log(`🔐 Resultado de verificación de contraseña: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      console.log(`💡 Usuario existe pero la contraseña no coincide`);
      
      // Registrar intento fallido
      await LogService.loginFallido(email, 'Contraseña incorrecta', req);
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        hint: process.env.NODE_ENV === 'development' ? 'La contraseña proporcionada no coincide con el hash almacenado' : undefined
      });
    }

    // Verificar que el usuario esté activo (acepta 'ACTIVO' o 'activo')
    if (user.estado && user.estado.toUpperCase() !== 'ACTIVO') {
      console.log(`⚠️  Usuario inactivo: ${email}, Estado: ${user.estado}`);
      
      // Registrar intento fallido
      await LogService.loginFallido(email, 'Usuario inactivo', req);
      
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Normalizar rol a mayúsculas para consistencia
    let normalizedRol = user.rol ? user.rol.toUpperCase() : 'GUARDA';
    // Mapear roles antiguos a nuevos si es necesario
    if (normalizedRol === 'ADMIN') {
      normalizedRol = 'ADMINISTRADOR';
    }

    // Generar token
    let token;
    try {
      token = generateToken({
        id: user.id_usuario,
        email: user.email,
        rol: normalizedRol,
        nombre: user.nombre
      });
    } catch (error) {
      console.error('❌ Error al generar token:', error);
      throw new Error('Error al generar token de autenticación');
    }

    // Retornar datos del usuario (sin password)
    const userData = {
      id: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol: normalizedRol,
      estado: user.estado
    };

    console.log(`✅ Login exitoso: ${email} (${user.rol})`);

    // Registrar login exitoso
    await LogService.loginExitoso(user.id_usuario, email, req);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: userData,
      token
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack:', error.stack);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const verify = async (req, res) => {
  try {
    // El middleware authenticate ya validó el token
    const user = await User.findByEmail(req.user.email);
    
    if (!user || (user.estado && user.estado.toUpperCase() !== 'ACTIVO')) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }

    const userData = {
      id: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      estado: user.estado
    };

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
