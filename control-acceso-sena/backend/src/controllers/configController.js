// Config Controller - Configuración del sistema
import pool from '../utils/dbPool.js';
import { verifyTrigger, createTrigger, syncAccesosTable } from '../utils/syncAccesos.js';

// Obtener todas las configuraciones
export const getConfig = async (req, res) => {
  try {
    // Verificar que la tabla existe
    try {
      const [testRows] = await pool.execute('SELECT COUNT(*) as count FROM Configuracion');
      console.log('📊 Configuraciones en BD:', testRows[0]?.count || 0);
    } catch (testError) {
      console.error('❌ Error verificando tabla Configuracion:', testError.message);
      // Si la tabla no existe, devolver configuraciones por defecto
      return res.json({
        success: true,
        data: {
          'qr_visitor_expiry_hours': {
            valor: 24,
            tipo: 'number',
            descripcion: 'Horas de validez del QR de visitante',
            id: null
          },
          'system_name': {
            valor: 'Control de Acceso SENA',
            tipo: 'string',
            descripcion: 'Nombre del sistema',
            id: null
          },
          'max_visitors_per_day': {
            valor: 100,
            tipo: 'number',
            descripcion: 'Máximo de visitantes por día',
            id: null
          }
        }
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM Configuracion ORDER BY clave ASC'
    );

    // Convertir a objeto clave-valor
    const config = {};
    
    // Si no hay configuraciones, devolver valores por defecto
    if (rows.length === 0) {
      console.log('⚠️ No hay configuraciones en BD, usando valores por defecto');
      return res.json({
        success: true,
        data: {
          'qr_visitor_expiry_hours': {
            valor: 24,
            tipo: 'number',
            descripcion: 'Horas de validez del QR de visitante',
            id: null
          },
          'system_name': {
            valor: 'Control de Acceso SENA',
            tipo: 'string',
            descripcion: 'Nombre del sistema',
            id: null
          },
          'max_visitors_per_day': {
            valor: 100,
            tipo: 'number',
            descripcion: 'Máximo de visitantes por día',
            id: null
          }
        }
      });
    }
    
    rows.forEach(row => {
      let value = row.valor;
      
      // Convertir según el tipo
      switch (row.tipo) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = value;
          }
          break;
        default:
          value = value;
      }
      
      config[row.clave] = {
        valor: value,
        tipo: row.tipo,
        descripcion: row.descripcion,
        id: row.id_config
      };
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Error en getConfig:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Actualizar configuración
export const updateConfig = async (req, res) => {
  try {
    const { clave, valor } = req.body;

    if (!clave) {
      return res.status(400).json({
        success: false,
        message: 'La clave es requerida'
      });
    }

    // Obtener tipo de la configuración
    const [configRows] = await pool.execute(
      'SELECT tipo FROM Configuracion WHERE clave = ?',
      [clave]
    );

    if (configRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    const tipo = configRows[0].tipo;
    let valorFinal = valor;

    // Validar y convertir según el tipo
    if (tipo === 'number') {
      valorFinal = parseFloat(valor);
      if (isNaN(valorFinal)) {
        return res.status(400).json({
          success: false,
          message: 'El valor debe ser un número'
        });
      }
      valorFinal = valorFinal.toString();
    } else if (tipo === 'boolean') {
      valorFinal = (valor === true || valor === 'true' || valor === '1') ? '1' : '0';
    } else if (tipo === 'json') {
      valorFinal = typeof valor === 'string' ? valor : JSON.stringify(valor);
    } else {
      valorFinal = String(valor);
    }

    await pool.execute(
      'UPDATE Configuracion SET valor = ? WHERE clave = ?',
      [valorFinal, clave]
    );

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en updateConfig:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar múltiples configuraciones
export const updateMultipleConfig = async (req, res) => {
  try {
    const { configs } = req.body; // Array de { clave, valor }

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de configuraciones'
      });
    }

    const updates = [];
    for (const config of configs) {
      const { clave, valor } = config;
      
      if (!clave) continue;

      // Obtener tipo
      const [configRows] = await pool.execute(
        'SELECT tipo FROM Configuracion WHERE clave = ?',
        [clave]
      );

      if (configRows.length === 0) continue;

      const tipo = configRows[0].tipo;
      let valorFinal = valor;

      if (tipo === 'number') {
        valorFinal = parseFloat(valor);
        if (isNaN(valorFinal)) continue;
        valorFinal = valorFinal.toString();
      } else if (tipo === 'boolean') {
        valorFinal = (valor === true || valor === 'true' || valor === '1') ? '1' : '0';
      } else if (tipo === 'json') {
        valorFinal = typeof valor === 'string' ? valor : JSON.stringify(valor);
      } else {
        valorFinal = String(valor);
      }

      await pool.execute(
        'UPDATE Configuracion SET valor = ? WHERE clave = ?',
        [valorFinal, clave]
      );
    }

    res.json({
      success: true,
      message: 'Configuraciones actualizadas exitosamente'
    });
  } catch (error) {
    console.error('Error en updateMultipleConfig:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuraciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear nueva configuración
export const createConfig = async (req, res) => {
  try {
    const { clave, valor, tipo, descripcion } = req.body;

    if (!clave || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Clave y tipo son requeridos'
      });
    }

    let valorFinal = valor || '';
    
    // Validar y convertir según el tipo
    if (tipo === 'number') {
      valorFinal = parseFloat(valor);
      if (isNaN(valorFinal)) {
        return res.status(400).json({
          success: false,
          message: 'El valor debe ser un número'
        });
      }
      valorFinal = valorFinal.toString();
    } else if (tipo === 'boolean') {
      valorFinal = (valor === true || valor === 'true' || valor === '1') ? '1' : '0';
    } else if (tipo === 'json') {
      valorFinal = typeof valor === 'string' ? valor : JSON.stringify(valor);
    } else {
      valorFinal = String(valor || '');
    }

    await pool.execute(
      `INSERT INTO Configuracion (clave, valor, tipo, descripcion) 
       VALUES (?, ?, ?, ?)`,
      [clave, valorFinal, tipo, descripcion || '']
    );

    res.status(201).json({
      success: true,
      message: 'Configuración creada exitosamente'
    });
  } catch (error) {
    console.error('Error en createConfig:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una configuración con esta clave'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verificar y crear trigger de sincronización de Accesos
export const setupAccesosTrigger = async (req, res) => {
  try {
    const triggerExists = await verifyTrigger();
    
    if (!triggerExists) {
      console.log('🔄 Creando trigger...');
      await createTrigger();
    }
    
    res.json({
      success: true,
      message: 'Trigger verificado y activo',
      triggerExists: await verifyTrigger()
    });
  } catch (error) {
    console.error('Error en setupAccesosTrigger:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar trigger',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Sincronizar tabla Accesos con datos existentes
export const syncAccesos = async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronización de tabla Accesos...');
    const result = await syncAccesosTable();
    
    res.json({
      success: true,
      message: 'Sincronización completada',
      data: result
    });
  } catch (error) {
    console.error('Error en syncAccesos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar tabla Accesos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

