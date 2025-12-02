// Dashboard Controller
import pool from '../utils/dbPool.js';
import Access from '../models/Access.js';
import Person from '../models/Person.js';
import AlertService from '../services/AlertService.js';
import { ReportService } from '../services/ReportService.js';
import { getRegistroIdField } from '../utils/columnResolver.js';
import { createSecurityLog } from './auditController.js';

  // Obtener todas las métricas del dashboard
export const getMetrics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Personas actualmente dentro (vista v_personas_dentro)
    let totalInside = 0;
    try {
      const [insideRows] = await pool.execute(`
        SELECT COUNT(*) as personas_dentro
        FROM v_personas_dentro
      `);
      totalInside = insideRows[0]?.personas_dentro || 0;
    } catch (error) {
      console.warn('⚠️  Error obteniendo personas dentro desde v_personas_dentro, usando fallback:', error.message);
      try {
        const insideRows = await Person.getCurrentPeople();
        totalInside = insideRows?.length || 0;
      } catch (fallbackError) {
        console.warn('⚠️  Error obteniendo personas dentro manualmente, usando 0:', fallbackError.message);
        totalInside = 0;
      }
    }

    // Estadísticas del día - con manejo de errores
    let dailyStats = { total_registros: 0, entradas: 0, salidas: 0 };
    try {
      dailyStats = await Access.getDailyStats(today);
    } catch (error) {
      console.warn('⚠️  Error obteniendo estadísticas del día, usando valores por defecto:', error.message);
      dailyStats = { total_registros: 0, entradas: 0, salidas: 0 };
    }

    // Visitantes activos (últimas 24 horas) - probar ambos nombres de tabla
    let activeVisitors = 0;
    try {
      // Intentar con Visitantes (mayúscula) primero
      try {
        const [visitorRows] = await pool.execute(
          `SELECT COUNT(*) as count 
           FROM Visitantes 
           WHERE estado = 'activo' 
           AND fecha_inicio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );
        activeVisitors = visitorRows[0]?.count || 0;
      } catch (error) {
        // Si falla, intentar con visitantes (minúscula)
        if (error.code === 'ER_NO_SUCH_TABLE') {
          const [visitorRows] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM visitantes 
             WHERE estado = 'activo' 
             AND fecha_inicio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
          );
          activeVisitors = visitorRows[0]?.count || 0;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.warn('⚠️  Error obteniendo visitantes activos, usando 0:', error.message);
      activeVisitors = 0;
    }

    // Accesos recientes para detectar alertas (fuera de horario) - con manejo de errores
    let outOfScheduleAccess = 0;
    try {
      const [recentAccessRows] = await pool.execute(
        `SELECT COUNT(*) as count
         FROM registros_entrada_salida
         WHERE DATE(fecha_hora) = ?
         AND HOUR(fecha_hora) NOT BETWEEN 6 AND 22
         AND tipo = 'ENTRADA'`,
        [today]
      );
      outOfScheduleAccess = recentAccessRows[0]?.count || 0;
    } catch (error) {
      console.warn('⚠️  Error obteniendo accesos fuera de horario, usando 0:', error.message);
      outOfScheduleAccess = 0;
    }

    // Alertas pendientes dinamicas
    let pendingAlerts = 0;
    try {
      const dynamicAlerts = await AlertService.generateAlerts();
      pendingAlerts = dynamicAlerts.length;
    } catch (error) {
      console.warn('⚠️  No se pudieron generar alertas dinámicas, usando heurística:', error.message);
      // fallback: usar accesos fuera de horario detectados
      pendingAlerts = outOfScheduleAccess;
    }

    // Obtener estadísticas adicionales usando ReportService.getAccessHistory
    let statsLast7Days = {
      total_accesos: 0,
      personas_unicas: 0,
      tiempo_promedio_minutos: 0
    };
    
    try {
      const fechaInicio7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const accessHistory = await ReportService.getAccessHistory(
        { fecha_desde: fechaInicio7dias, fecha_hasta: today },
        { limit: 1000, page: 1 }
      );
      
      if (accessHistory.success && accessHistory.data) {
        const accesos = accessHistory.data;
        const personasUnicas = new Set(accesos.map(a => a.documento)).size;
        const duraciones = accesos
          .filter(a => a.duracion_minutos !== null && a.duracion_minutos !== undefined)
          .map(a => parseInt(a.duracion_minutos) || 0);
        const tiempoPromedio = duraciones.length > 0
          ? Math.round(duraciones.reduce((sum, d) => sum + d, 0) / duraciones.length)
          : 0;
        
        statsLast7Days = {
          total_accesos: accesos.length,
          personas_unicas: personasUnicas,
          tiempo_promedio_minutos: tiempoPromedio
        };
      }
    } catch (error) {
      console.warn('⚠️  Error obteniendo estadísticas de 7 días, usando valores por defecto:', error.message);
    }

    // Estadísticas de ayer para comparación
    let yesterdayStats = { total: 0, entradas: 0, salidas: 0 };
    try {
      yesterdayStats = await Access.getDailyStats(yesterday);
    } catch (error) {
      console.warn('⚠️  Error obteniendo estadísticas de ayer:', error.message);
    }

    // Calcular tendencias
    const todayTotal = dailyStats.total_registros || 0;
    const yesterdayTotal = yesterdayStats.total_registros || 0;
    const trendAccess = yesterdayTotal > 0
      ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        currentPeople: totalInside,
        todayAccess: {
          total: dailyStats.total_registros || 0,
          entradas: dailyStats.entradas || 0,
          salidas: dailyStats.salidas || 0
        },
        yesterdayAccess: {
          total: yesterdayStats.total_registros || 0,
          entradas: yesterdayStats.entradas || 0,
          salidas: yesterdayStats.salidas || 0
        },
        trendAccess, // Porcentaje de cambio respecto a ayer
        statsLast7Days,
        activeVisitors,
        pendingAlerts,
        outOfScheduleAccess,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en getMetrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const alerts = await AlertService.generateAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error en getAlerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    AlertService.markResolved(alertId);
    await createSecurityLog({
      tipo: 'operacion_admin',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Resolución manual de alerta: ${alertId}`,
      detalles: { alertId },
      exito: true
    });
    res.json({
      success: true,
      message: 'Alerta marcada como resuelta'
    });
  } catch (error) {
    console.error('Error en resolveAlert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver la alerta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Endpoint de diagnóstico - Verificar estadísticas de accesos
export const getAccessStats = async (req, res) => {
  try {
    console.log('🔍 [BACKEND] Verificando estadísticas de accesos');
    
    // Verificar tabla Accesos
    let accesosStats = {
      total_registros: 0,
      primer_registro: null,
      ultimo_registro: null,
      ultimas_24h: 0
    };
    
    try {
      const [statsRows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_registros,
          MIN(fecha_entrada) as primer_registro,
          MAX(fecha_entrada) as ultimo_registro,
          COUNT(CASE WHEN fecha_entrada >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as ultimas_24h
        FROM Accesos
      `);
      
      if (statsRows && statsRows[0]) {
        accesosStats = {
          total_registros: parseInt(statsRows[0].total_registros) || 0,
          primer_registro: statsRows[0].primer_registro,
          ultimo_registro: statsRows[0].ultimo_registro,
          ultimas_24h: parseInt(statsRows[0].ultimas_24h) || 0
        };
      }
    } catch (error) {
      console.error('❌ Error verificando tabla Accesos:', error.message);
    }
    
    // Verificar tabla registros_entrada_salida
    let registrosStats = {
      total_registros: 0,
      primer_registro: null,
      ultimo_registro: null,
      ultimas_24h: 0
    };
    
    try {
      const [registrosRows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_registros,
          MIN(fecha_hora) as primer_registro,
          MAX(fecha_hora) as ultimo_registro,
          COUNT(CASE WHEN fecha_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as ultimas_24h
        FROM registros_entrada_salida
      `);
      
      if (registrosRows && registrosRows[0]) {
        registrosStats = {
          total_registros: parseInt(registrosRows[0].total_registros) || 0,
          primer_registro: registrosRows[0].primer_registro,
          ultimo_registro: registrosRows[0].ultimo_registro,
          ultimas_24h: parseInt(registrosRows[0].ultimas_24h) || 0
        };
      }
    } catch (error) {
      console.error('❌ Error verificando tabla registros_entrada_salida:', error.message);
    }
    
    // Obtener últimos 5 registros de Accesos con JOIN a Personas
    let recentAccesos = [];
    try {
      const [recentRows] = await pool.execute(`
        SELECT 
          a.id_acceso,
          a.tipo_acceso,
          a.fecha_entrada,
          p.id_persona,
          p.documento,
          p.nombres,
          p.apellidos,
          p.nombre
        FROM Accesos a
        LEFT JOIN Personas p ON a.id_persona = p.id_persona
        ORDER BY a.fecha_entrada DESC
        LIMIT 5
      `);
      recentAccesos = recentRows || [];
    } catch (error) {
      console.error('❌ Error obteniendo registros recientes de Accesos:', error.message);
    }
    
    const idColumn = await getRegistroIdField();
    const fullNameExpr = "CONCAT(p.nombres, ' ', p.apellidos)";
    // Obtener últimos 5 registros de registros_entrada_salida con JOIN a Personas
    let recentRegistros = [];
    try {
      const [recentRegRows] = await pool.execute(`
        SELECT 
          r.${idColumn} as id_registro,
          r.tipo,
          r.fecha_hora,
          p.id_persona,
          p.documento,
          p.nombres,
          p.apellidos,
          COALESCE(
            ${fullNameExpr},
            p.nombres,
            p.apellidos,
            'Sin nombre'
          ) as nombre_completo
        FROM registros_entrada_salida r
        LEFT JOIN Personas p ON r.id_persona = p.id_persona
        ORDER BY r.fecha_hora DESC
        LIMIT 5
      `);
      recentRegistros = recentRegRows || [];
    } catch (error) {
      console.error('❌ Error obteniendo registros recientes de registros_entrada_salida:', error.message);
    }
    
    res.json({
      success: true,
      accesos: accesosStats,
      registros_entrada_salida: registrosStats,
      recent_accesos: recentAccesos,
      recent_registros: recentRegistros,
      database_time: new Date().toISOString(),
      message: `Accesos: ${accesosStats.total_registros} total, ${accesosStats.ultimas_24h} últimas 24h | Registros: ${registrosStats.total_registros} total, ${registrosStats.ultimas_24h} últimas 24h`
    });
    
  } catch (error) {
    console.error('❌ Error en getAccessStats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Obtener accesos recientes - Versión mejorada con diagnóstico y manejo robusto de errores
export const getRecentAccess = async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n🔍 [${requestId}] ========== INICIO getRecentAccess ==========`);
    
    // 1. Validar y procesar parámetros
    const limit = parseInt(req.query.limit) || 20;
    const safeLimit = Math.floor(Math.min(Math.max(1, limit), 100));
    
    console.log(`📊 [${requestId}] Parámetros recibidos:`, {
      limit: req.query.limit,
      safeLimit,
      tipo: typeof safeLimit
    });
    
    // 2. Diagnóstico inicial: Verificar estructura de tablas
    console.log(`📋 [${requestId}] Verificando estructura de tablas...`);
    
    let accesosCount = 0;
    let registrosCount = 0;
    let accesosStructure = null;
    let registrosStructure = null;
    
    // Verificar tabla Accesos
    try {
      const [countAccesos] = await pool.execute('SELECT COUNT(*) as total FROM Accesos');
      accesosCount = parseInt(countAccesos[0]?.total) || 0;
      
      const [structureAccesos] = await pool.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Accesos'
        ORDER BY ORDINAL_POSITION
      `);
      accesosStructure = structureAccesos.map(col => col.COLUMN_NAME);
      
      console.log(`✅ [${requestId}] Tabla Accesos: ${accesosCount} registros`);
      console.log(`   Columnas: ${accesosStructure.join(', ')}`);
    } catch (error) {
      console.error(`❌ [${requestId}] Error verificando tabla Accesos:`, {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState
      });
    }
    
    // Verificar tabla registros_entrada_salida
    try {
      const [countRegistros] = await pool.execute('SELECT COUNT(*) as total FROM registros_entrada_salida');
      registrosCount = parseInt(countRegistros[0]?.total) || 0;
      
      const [structureRegistros] = await pool.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registros_entrada_salida'
        ORDER BY ORDINAL_POSITION
      `);
      registrosStructure = structureRegistros.map(col => col.COLUMN_NAME);
      
      console.log(`✅ [${requestId}] Tabla registros_entrada_salida: ${registrosCount} registros`);
      console.log(`   Columnas: ${registrosStructure.join(', ')}`);
    } catch (error) {
      console.error(`❌ [${requestId}] Error verificando tabla registros_entrada_salida:`, {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState
      });
    }
    
    // 3. Leer datos de las tablas usando nombres correctos de columnas
    let rows = [];
    let sourceTable = null;
    
    // Estrategia: Leer de registros_entrada_salida primero (tabla principal - circuito abierto)
    // Luego intentar Accesos como respaldo (tabla de compatibilidad)
    if (registrosCount > 0) {
      console.log(`📊 [${requestId}] Intentando leer de tabla registros_entrada_salida primero (${registrosCount} registros disponibles)...`);
      
      try {
        // Verificar registros huérfanos
        try {
          const [orphanCheck] = await pool.execute(`
            SELECT COUNT(*) as total_sin_persona
            FROM registros_entrada_salida r
            LEFT JOIN Personas p ON r.id_persona = p.id_persona
            WHERE p.id_persona IS NULL
          `);
          const orphanCount = parseInt(orphanCheck[0]?.total_sin_persona) || 0;
          if (orphanCount > 0) {
            console.warn(`⚠️  [${requestId}] ${orphanCount} registros en registros_entrada_salida sin Persona válida`);
          }
        } catch (checkError) {
          console.warn(`⚠️  [${requestId}] Error verificando registros huérfanos:`, checkError.message);
        }
        
        // Consulta SQL usando nombres correctos de columnas según schema.sql
        // Tabla registros_entrada_salida: id_registro_entrada_salida, id_persona, tipo, fecha_hora
        // IMPORTANTE: Usar LEFT JOIN para incluir TODOS los registros, incluso sin persona asociada
        const querySQL = `
          SELECT 
            r.id_registro_entrada_salida as id_acceso,
            r.tipo as tipo_acceso,
            r.fecha_hora as evento_fecha,
            r.fecha_hora as fecha_entrada,
            NULL as fecha_salida,
            'activo' as estado,
            r.id_persona,
            CASE 
              WHEN p.id_persona IS NOT NULL THEN
                COALESCE(
                  NULLIF(TRIM(CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))), ''),
                  p.nombre,
                  NULLIF(TRIM(CONCAT(COALESCE(p.nombres, ''), COALESCE(p.apellidos, ''))), ''),
                  'Sin nombre'
                )
              ELSE CONCAT('Persona ID: ', COALESCE(r.id_persona, 'N/A'))
            END as persona_nombre,
            COALESCE(
              NULLIF(p.documento, ''),
              CONCAT('Persona ', COALESCE(r.id_persona, 'N/A'))
            ) as documento,
            COALESCE(
              NULLIF(p.rol, ''),
              'sin rol'
            ) as rol,
            'Sistema' as registrado_por,
            LOWER(COALESCE(r.tipo, 'ENTRADA')) as evento_tipo
          FROM registros_entrada_salida r
          LEFT JOIN Personas p ON r.id_persona = p.id_persona
          ORDER BY r.fecha_hora DESC
          LIMIT ?
        `;
        
        console.log(`📝 [${requestId}] Ejecutando consulta SQL en tabla registros_entrada_salida...`);
        const [queryRows] = await pool.execute(querySQL, [safeLimit]);
        rows = queryRows || [];
        
        if (rows.length > 0) {
          sourceTable = 'registros_entrada_salida';
          console.log(`✅ [${requestId}] Datos obtenidos de tabla registros_entrada_salida: ${rows.length} registros`);
          console.log(`📋 [${requestId}] Primer registro:`, JSON.stringify(rows[0], null, 2));
        } else {
          console.warn(`⚠️  [${requestId}] Consulta a registros_entrada_salida retornó 0 filas aunque hay ${registrosCount} registros`);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error leyendo de registros_entrada_salida:`, {
          message: error.message,
          code: error.code,
          sqlState: error.sqlState,
          stack: error.stack
        });
        rows = [];
      }
    }
    
    // Si no hay datos en registros_entrada_salida, intentar leer de Accesos (tabla de compatibilidad)
    if (rows.length === 0 && accesosCount > 0) {
      console.log(`📊 [${requestId}] Intentando leer de tabla Accesos (${accesosCount} registros disponibles)...`);
      
      try {
        // Verificar registros huérfanos (sin Persona)
        try {
          const [orphanCheck] = await pool.execute(`
            SELECT COUNT(*) as total_sin_persona
            FROM Accesos a
            LEFT JOIN Personas p ON a.id_persona = p.id_persona
            WHERE p.id_persona IS NULL
          `);
          const orphanCount = parseInt(orphanCheck[0]?.total_sin_persona) || 0;
          if (orphanCount > 0) {
            console.warn(`⚠️  [${requestId}] ${orphanCount} registros en Accesos sin Persona válida (se mostrarán con datos básicos)`);
          }
        } catch (checkError) {
          console.warn(`⚠️  [${requestId}] Error verificando registros huérfanos:`, checkError.message);
        }
        
        // Consulta SQL usando nombres correctos de columnas según schema.sql
        // Tabla Accesos: id_acceso, id_persona, tipo_acceso, fecha_entrada, fecha_salida, estado
        // IMPORTANTE: Usar LEFT JOIN para incluir TODOS los accesos, incluso sin persona asociada
        // NOTA: Removemos WHERE para incluir TODOS los registros, incluso si fecha_entrada es NULL
        const querySQL = `
          SELECT 
            a.id_acceso,
            a.tipo_acceso,
            a.fecha_entrada as evento_fecha,
            a.fecha_entrada,
            a.fecha_salida,
            a.estado,
            a.id_persona,
            CASE 
              WHEN p.id_persona IS NOT NULL THEN
                COALESCE(
                  NULLIF(TRIM(CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))), ''),
                  p.nombre,
                  NULLIF(TRIM(CONCAT(COALESCE(p.nombres, ''), COALESCE(p.apellidos, ''))), ''),
                  'Sin nombre'
                )
              ELSE CONCAT('Persona ID: ', COALESCE(a.id_persona, 'N/A'))
            END as persona_nombre,
            COALESCE(
              NULLIF(p.documento, ''),
              CONCAT('Persona ', COALESCE(a.id_persona, 'N/A'))
            ) as documento,
            COALESCE(
              NULLIF(p.rol, ''),
              'sin rol'
            ) as rol,
            'Sistema' as registrado_por,
            LOWER(COALESCE(a.tipo_acceso, 'entrada')) as evento_tipo
          FROM Accesos a
          LEFT JOIN Personas p ON a.id_persona = p.id_persona
          ORDER BY a.fecha_entrada DESC, a.id_acceso DESC
          LIMIT ?
        `;
        
        console.log(`📝 [${requestId}] Ejecutando consulta SQL en tabla Accesos...`);
        const [queryRows] = await pool.execute(querySQL, [safeLimit]);
        rows = queryRows || [];
        
        if (rows.length > 0) {
          sourceTable = 'Accesos';
          console.log(`✅ [${requestId}] Datos obtenidos de tabla Accesos: ${rows.length} registros`);
          console.log(`📋 [${requestId}] Primer registro:`, JSON.stringify(rows[0], null, 2));
        } else {
          console.warn(`⚠️  [${requestId}] Consulta a Accesos retornó 0 filas aunque hay ${accesosCount} registros`);
          
          // Diagnóstico detallado
          try {
            const [rawRows] = await pool.execute(`
              SELECT id_acceso, id_persona, tipo_acceso, fecha_entrada 
              FROM Accesos 
              ORDER BY fecha_entrada DESC 
              LIMIT 5
            `);
            console.log(`📋 [${requestId}] Muestra de registros raw de Accesos:`, JSON.stringify(rawRows, null, 2));
            
            if (rawRows && rawRows.length > 0) {
              const idsPersonas = rawRows.map(r => r.id_persona).filter(id => id !== null && id !== undefined);
              if (idsPersonas.length > 0) {
                const placeholders = idsPersonas.map(() => '?').join(',');
                const [personasCheck] = await pool.execute(
                  `SELECT id_persona FROM Personas WHERE id_persona IN (${placeholders})`,
                  idsPersonas
                );
                console.log(`📋 [${requestId}] Personas encontradas: ${personasCheck.length} de ${idsPersonas.length}`);
                
                if (personasCheck.length < idsPersonas.length) {
                  const personasEncontradas = personasCheck.map(p => p.id_persona);
                  const personasNoEncontradas = idsPersonas.filter(id => !personasEncontradas.includes(id));
                  console.warn(`⚠️  [${requestId}] Personas NO encontradas en BD: ${personasNoEncontradas.join(', ')}`);
                }
              } else {
                console.warn(`⚠️  [${requestId}] Todos los registros de Accesos tienen id_persona NULL`);
              }
            }
          } catch (diagError) {
            console.error(`❌ [${requestId}] Error en diagnóstico:`, diagError.message);
          }
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error leyendo de Accesos:`, {
          message: error.message,
          code: error.code,
          sqlState: error.sqlState,
          stack: error.stack
        });
        // Continuar para intentar leer de registros_entrada_salida
      }
    }
    
    // Verificar si ambas tablas están vacías
    if (rows.length === 0 && accesosCount === 0 && registrosCount === 0) {
      console.warn(`⚠️  [${requestId}] Ambas tablas (Accesos y registros_entrada_salida) están vacías`);
    }

    // 4. Procesar y transformar datos
    console.log(`🔄 [${requestId}] Procesando ${rows.length} registros...`);
    
    const accesses = rows.map((access, index) => {
      try {
        // Asegurar que tenemos al menos un campo de fecha
        const fechaEvento = access.evento_fecha || access.fecha_entrada || access.fecha_hora;
        let fueraHorario = false;
        
        if (fechaEvento) {
          try {
            const fecha = new Date(fechaEvento);
            if (!isNaN(fecha.getTime())) {
              const hora = fecha.getHours();
              fueraHorario = hora < 6 || hora > 22;
            }
          } catch (e) {
            console.warn(`⚠️  [${requestId}] Error procesando fecha en registro ${index + 1}:`, e.message);
          }
        }
        
        // Normalizar tipo de acceso: ENTRADA/SALIDA -> entrada/salida
        let tipoNormalizado = (access.evento_tipo || access.tipo_acceso || 'entrada').toLowerCase();
        // Limpiar y normalizar el tipo - manejar diferentes variaciones
        if (tipoNormalizado.includes('entrada') || tipoNormalizado === 'entrada' || tipoNormalizado === 'ENTRADA') {
          tipoNormalizado = 'entrada';
        } else if (tipoNormalizado.includes('salida') || tipoNormalizado === 'salida' || tipoNormalizado === 'SALIDA') {
          tipoNormalizado = 'salida';
        } else {
          // Por defecto, si no se puede determinar, usar 'entrada'
          tipoNormalizado = 'entrada';
        }
        
        // Asegurar que todos los campos requeridos tengan valores válidos
        const personaNombre = access.persona_nombre || `Persona ID: ${access.id_persona || 'N/A'}`;
        const documento = access.documento || `Persona ${access.id_persona || 'N/A'}`;
        const rol = access.rol || 'sin rol';
        const idRegistro = access.id_acceso || access.id_registro_entrada_salida || index;
        
        return {
          id_registro: idRegistro,
          persona_nombre: personaNombre,
          documento: documento,
          tipo: tipoNormalizado,
          fecha_entrada: access.fecha_entrada ? new Date(access.fecha_entrada).toISOString() : null,
          fecha_salida: access.fecha_salida ? new Date(access.fecha_salida).toISOString() : null,
          fecha_evento: fechaEvento ? new Date(fechaEvento).toISOString() : null,
          metodo_acceso: 'qr',
          fuera_horario: fueraHorario,
          rol: rol,
          registrado_por: access.registrado_por || 'Sistema',
          id_persona: access.id_persona || null
        };
      } catch (error) {
        console.error(`❌ [${requestId}] Error procesando registro ${index + 1}:`, error.message);
        console.error(`❌ [${requestId}] Datos del registro problemático:`, JSON.stringify(access, null, 2));
        return null;
      }
    }).filter(access => access !== null); // Filtrar registros con error
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ [${requestId}] Procesamiento completado:`);
    console.log(`   - Registros obtenidos: ${rows.length}`);
    console.log(`   - Registros procesados: ${accesses.length}`);
    console.log(`   - Tabla fuente: ${sourceTable || 'ninguna'}`);
    console.log(`   - Tiempo de procesamiento: ${processingTime}ms`);
    
    if (accesses.length > 0) {
      console.log(`📋 [${requestId}] Primer acceso procesado:`, JSON.stringify(accesses[0], null, 2));
    }
    
    // 5. Enviar respuesta - Asegurar que siempre devolvemos un array, incluso si está vacío
    const response = {
      success: true,
      data: accesses || [], // Asegurar que siempre sea un array
      metadata: {
        total: accesses.length || 0,
        source_table: sourceTable || 'ninguna',
        processing_time_ms: processingTime,
        request_id: requestId,
        accesos_count: accesosCount,
        registros_count: registrosCount,
        diagnostic: {
          accesos_table_exists: accesosCount >= 0,
          registros_table_exists: registrosCount >= 0,
          rows_found: rows.length,
          accesses_processed: accesses.length
        }
      }
    };
    
    if (accesses.length === 0) {
      console.warn(`⚠️  [${requestId}] NO SE ENCONTRARON ACCESOS:`);
      console.warn(`   - Tabla Accesos: ${accesosCount} registros`);
      console.warn(`   - Tabla registros_entrada_salida: ${registrosCount} registros`);
      console.warn(`   - Filas obtenidas de consulta: ${rows.length}`);
      console.warn(`   - Accesos procesados: ${accesses.length}`);
      
      if (accesosCount === 0 && registrosCount === 0) {
        console.warn(`   ⚠️  Ambas tablas están vacías. ¿Hay datos en la base de datos?`);
      } else if (rows.length === 0 && (accesosCount > 0 || registrosCount > 0)) {
        console.warn(`   ⚠️  Hay ${accesosCount + registrosCount} registros en las tablas pero la consulta retornó 0 filas`);
        console.warn(`   ⚠️  Posible problema con los JOINs o filtros en la consulta SQL`);
      }
    }
    
    console.log(`📤 [${requestId}] Enviando respuesta con ${accesses.length} accesos`);
    console.log(`✅ [${requestId}] ========== FIN getRecentAccess (${processingTime}ms) ==========\n`);
    
    res.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`\n❌ [${requestId}] ========== ERROR en getRecentAccess ==========`);
    console.error(`❌ [${requestId}] Mensaje:`, error.message);
    console.error(`❌ [${requestId}] Código:`, error.code);
    console.error(`❌ [${requestId}] SQL State:`, error.sqlState);
    console.error(`❌ [${requestId}] Stack:`, error.stack);
    console.error(`❌ [${requestId}] Tiempo antes del error: ${processingTime}ms`);
    console.error(`❌ [${requestId}] ============================================\n`);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener accesos recientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        stack: error.stack
      } : undefined,
      request_id: requestId
    });
  }
};

