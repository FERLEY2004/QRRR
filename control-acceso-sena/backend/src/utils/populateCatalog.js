// Script para poblar el catálogo de programas y ambientes CBI Palmira
import pool from '../utils/dbPool.js';

const PROGRAMAS_TECNICOS = [
  { codigo: "TAE001", nombre: "Asistencia Administrativa", nivel: "Técnico", duracion: 12, area: "Gestión Administrativa" },
  { codigo: "TAE002", nombre: "Asistencia en Organización de Archivos", nivel: "Técnico", duracion: 12, area: "Gestión Documental" },
  { codigo: "TCF001", nombre: "Contabilización de Operaciones Comerciales y Financieras", nivel: "Técnico", duracion: 12, area: "Contabilidad y Finanzas" },
  { codigo: "TRH001", nombre: "Nómina y Prestaciones Sociales", nivel: "Técnico", duracion: 12, area: "Recursos Humanos" },
  { codigo: "TCO001", nombre: "Operaciones Comerciales en Retail", nivel: "Técnico", duracion: 12, area: "Comercio y Ventas" },
  { codigo: "TBE001", nombre: "Peluquería", nivel: "Técnico", duracion: 12, area: "Belleza y Estética" },
  { codigo: "TRH002", nombre: "Recursos Humanos", nivel: "Técnico", duracion: 12, area: "Recursos Humanos" },
  { codigo: "TCF002", nombre: "Servicios Comerciales y Financieros", nivel: "Técnico", duracion: 12, area: "Servicios Financieros" },
  { codigo: "TQU001", nombre: "Análisis de Muestras Químicas", nivel: "Técnico", duracion: 12, area: "Química y Laboratorio" },
  { codigo: "TTI001", nombre: "Diseño e Integración de Multimedia", nivel: "Técnico", duracion: 12, area: "Tecnología Multimedia" },
  { codigo: "TTI002", nombre: "Integración de Contenidos Digitales", nivel: "Técnico", duracion: 12, area: "Contenidos Digitales" },
  { codigo: "TLO001", nombre: "Integración de Operaciones Logísticas", nivel: "Técnico", duracion: 12, area: "Logística" },
  { codigo: "TAM001", nombre: "Monitoreo Ambiental", nivel: "Técnico", duracion: 12, area: "Medio Ambiente" },
  { codigo: "TBI001", nombre: "Producción de Biocombustibles y Fermentaciones Industriales", nivel: "Técnico", duracion: 12, area: "Biotecnología" },
  { codigo: "TAD001", nombre: "Programación de Software", nivel: "Técnico", duracion: 12, area: "Desarrollo de Software" },
  { codigo: "TAG001", nombre: "Proyectos Agropecuarios", nivel: "Técnico", duracion: 12, area: "Agropecuaria" },
  { codigo: "TTI003", nombre: "Sistemas", nivel: "Técnico", duracion: 12, area: "Sistemas Informáticos" },
  { codigo: "TCO002", nombre: "Construcción de Edificaciones", nivel: "Técnico", duracion: 12, area: "Construcción" },
  { codigo: "TCO003", nombre: "Construcciones Livianas Industrializadas en Seco", nivel: "Técnico", duracion: 12, area: "Construcción" },
  { codigo: "TME001", nombre: "Dibujo Mecánico", nivel: "Técnico", duracion: 12, area: "Diseño Mecánico" },
  { codigo: "TEL001", nombre: "Electricista Industrial", nivel: "Técnico", duracion: 12, area: "Electricidad Industrial" },
  { codigo: "TEL002", nombre: "Instalación de Sistemas Eléctricos Residenciales y Comerciales", nivel: "Técnico", duracion: 12, area: "Instalaciones Eléctricas" },
  { codigo: "TME002", nombre: "Mantenimiento de Motores Diésel", nivel: "Técnico", duracion: 12, area: "Mantenimiento Mecánico" },
  { codigo: "TME003", nombre: "Mantenimiento de Vehículos Livianos", nivel: "Técnico", duracion: 12, area: "Mantenimiento Automotriz" },
  { codigo: "TME004", nombre: "Mantenimiento Eléctrico y Control Electrónico de Automotores", nivel: "Técnico", duracion: 12, area: "Mecánica Automotriz" },
  { codigo: "TME005", nombre: "Mecánica de Maquinaria Industrial", nivel: "Técnico", duracion: 12, area: "Mecánica Industrial" },
  { codigo: "TSO001", nombre: "Soldadura de Productos Metálicos en Plana (placa metálica)", nivel: "Técnico", duracion: 12, area: "Soldadura" }
];

const PROGRAMAS_TECNOLOGICOS = [
  { codigo: "TNG001", nombre: "Gestión Bancaria y de Entidades Financieras", nivel: "Tecnológico", duracion: 24, area: "Gestión Financiera" },
  { codigo: "TNG002", nombre: "Gestión Administrativa", nivel: "Tecnológico", duracion: 24, area: "Gestión Administrativa" },
  { codigo: "TNG003", nombre: "Gestión Empresarial", nivel: "Tecnológico", duracion: 24, area: "Gestión Empresarial" },
  { codigo: "TNG004", nombre: "Gestión del Talento Humano", nivel: "Tecnológico", duracion: 24, area: "Recursos Humanos" },
  { codigo: "TNG005", nombre: "Dirección de Ventas", nivel: "Tecnológico", duracion: 24, area: "Ventas y Marketing" },
  { codigo: "TNG006", nombre: "Gestión de Proyectos de Desarrollo Económico y Social", nivel: "Tecnológico", duracion: 24, area: "Gestión de Proyectos" },
  { codigo: "TND001", nombre: "Entrenamiento Deportivo", nivel: "Tecnológico", duracion: 24, area: "Deporte" },
  { codigo: "TNB001", nombre: "Biocomercio Sostenible", nivel: "Tecnológico", duracion: 24, area: "Biotecnología" },
  { codigo: "TNG007", nombre: "Gestión Documental", nivel: "Tecnológico", duracion: 24, area: "Gestión Documental" },
  { codigo: "TNG008", nombre: "Gestión Contable y de Información Financiera", nivel: "Tecnológico", duracion: 24, area: "Contabilidad" },
  { codigo: "TNG009", nombre: "Gestión de Tesorería y Recursos Financieros", nivel: "Tecnológico", duracion: 24, area: "Finanzas" },
  { codigo: "TND002", nombre: "Actividad Física", nivel: "Tecnológico", duracion: 24, area: "Actividad Física" },
  { codigo: "TNG010", nombre: "Gestión Integrada de la Calidad, Medio Ambiente, Seguridad y Salud Ocupacional", nivel: "Tecnológico", duracion: 24, area: "Gestión Integral" },
  { codigo: "TNG011", nombre: "Gestión de la Producción Industrial", nivel: "Tecnológico", duracion: 24, area: "Producción Industrial" },
  { codigo: "TNL001", nombre: "Coordinación de Procesos Logísticos", nivel: "Tecnológico", duracion: 24, area: "Logística" },
  { codigo: "TNB002", nombre: "Control de Bioprocesos Industriales", nivel: "Tecnológico", duracion: 24, area: "Biotecnología" },
  { codigo: "TNA001", nombre: "Prevención y Control Ambiental", nivel: "Tecnológico", duracion: 24, area: "Medio Ambiente" },
  { codigo: "TNA002", nombre: "Análisis y Desarrollo de Software", nivel: "Tecnológico", duracion: 24, area: "Desarrollo de Software" },
  { codigo: "TNE001", nombre: "Mantenimiento Electrónico e Instrumental Industrial", nivel: "Tecnológico", duracion: 24, area: "Electrónica Industrial" },
  { codigo: "TND003", nombre: "Desarrollo y Modelado de Productos Industriales", nivel: "Tecnológico", duracion: 24, area: "Diseño Industrial" },
  { codigo: "TNM001", nombre: "Mantenimiento Mecánico Industrial", nivel: "Tecnológico", duracion: 24, area: "Mantenimiento Industrial" },
  { codigo: "TNM002", nombre: "Mantenimiento Electromecánico Industrial", nivel: "Tecnológico", duracion: 24, area: "Electromecánica" },
  { codigo: "TNG012", nombre: "Gestión del Mantenimiento de Automotores", nivel: "Tecnológico", duracion: 24, area: "Gestión Automotriz" }
];

const AMBIENTES_CBI = [
  // Bloques Administrativos
  { codigo: "ADM-101", nombre: "Oficina Administración", tipo: "oficina", capacidad: 8, bloque: "Bloque Administrativo", piso: 1, equipamiento: ["Computadores", "Impresora", "Teléfono"] },
  { codigo: "ADM-102", nombre: "Sala de Juntas", tipo: "sala_reuniones", capacidad: 20, bloque: "Bloque Administrativo", piso: 1, equipamiento: ["Proyector", "Pizarra", "Sistema de Audio"] },
  
  // Aulas de Clase - Bloque A
  { codigo: "A-201", nombre: "Aula 201 - Gestión Administrativa", tipo: "aula", capacidad: 35, bloque: "Bloque A", piso: 2, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  { codigo: "A-202", nombre: "Aula 202 - Contabilidad y Finanzas", tipo: "aula", capacidad: 35, bloque: "Bloque A", piso: 2, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  { codigo: "A-203", nombre: "Aula 203 - Recursos Humanos", tipo: "aula", capacidad: 35, bloque: "Bloque A", piso: 2, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  { codigo: "A-204", nombre: "Aula 204 - Comercio y Ventas", tipo: "aula", capacidad: 35, bloque: "Bloque A", piso: 2, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  { codigo: "A-301", nombre: "Aula 301 - General", tipo: "aula", capacidad: 40, bloque: "Bloque A", piso: 3, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  { codigo: "A-302", nombre: "Aula 302 - General", tipo: "aula", capacidad: 40, bloque: "Bloque A", piso: 3, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  
  // Laboratorios de Tecnología - Bloque B
  { codigo: "B-101", nombre: "Laboratorio de Software 1", tipo: "laboratorio", capacidad: 25, bloque: "Bloque B", piso: 1, equipamiento: ["25 Computadores", "Servidor", "Red LAN", "Proyector", "Software Desarrollo"] },
  { codigo: "B-102", nombre: "Laboratorio de Software 2", tipo: "laboratorio", capacidad: 25, bloque: "Bloque B", piso: 1, equipamiento: ["25 Computadores", "Servidor", "Red LAN", "Proyector", "Software Multimedia"] },
  { codigo: "B-103", nombre: "Laboratorio de Redes", tipo: "laboratorio", capacidad: 20, bloque: "Bloque B", piso: 1, equipamiento: ["Rack de Redes", "Switches", "Routers", "Cableado Estructurado", "Herramientas"] },
  { codigo: "B-201", nombre: "Laboratorio de Sistemas", tipo: "laboratorio", capacidad: 25, bloque: "Bloque B", piso: 2, equipamiento: ["25 Computadores", "Servidor", "Red LAN", "Proyector"] },
  
  // Talleres Mecánicos - Bloque C
  { codigo: "C-001", nombre: "Taller de Mecánica Automotriz", tipo: "taller", capacidad: 15, bloque: "Bloque C", piso: 0, equipamiento: ["Elevador", "Herramientas Manuales", "Scanner Diagóstico", "Bancos de Trabajo"] },
  { codigo: "C-002", nombre: "Taller de Soldadura", tipo: "taller", capacidad: 12, bloque: "Bloque C", piso: 0, equipamiento: ["Máquinas de Soldar", "Careta de Soldar", "Guantes", "Delantal", "Extractor de Aire"] },
  { codigo: "C-003", nombre: "Taller de Electricidad Industrial", tipo: "taller", capacidad: 15, bloque: "Bloque C", piso: 0, equipamiento: ["Tableros Eléctricos", "Multímetros", "Herramientas Eléctricas", "Bancos de Prueba"] },
  { codigo: "C-004", nombre: "Taller de Mantenimiento Mecánico", tipo: "taller", capacidad: 15, bloque: "Bloque C", piso: 0, equipamiento: ["Herramientas Manuales", "Bancos de Trabajo", "Equipos de Medición"] },
  
  // Laboratorios de Biotecnología - Bloque D
  { codigo: "D-101", nombre: "Laboratorio de Biotecnología 1", tipo: "laboratorio", capacidad: 18, bloque: "Bloque D", piso: 1, equipamiento: ["Microscopios", "Centrífuga", "Autoclave", "Campana de Flujo", "Equipo de Fermentación"] },
  { codigo: "D-102", nombre: "Laboratorio de Química Analítica", tipo: "laboratorio", capacidad: 16, bloque: "Bloque D", piso: 1, equipamiento: ["Espectrofotómetro", "PH-metro", "Balanza Analítica", "Hornos", "Campana de Extracción"] },
  { codigo: "D-103", nombre: "Laboratorio de Bioprocesos", tipo: "laboratorio", capacidad: 18, bloque: "Bloque D", piso: 1, equipamiento: ["Equipo de Fermentación", "Reactores", "Biorreactores", "Sistemas de Control"] },
  
  // Aulas Especializadas - Bloque E
  { codigo: "E-101", nombre: "Aula de Multimedia", tipo: "aula", capacidad: 20, bloque: "Bloque E", piso: 1, equipamiento: ["Computadores Mac", "Tabletas Gráficas", "Software Adobe", "Cámaras", "Estudio de Grabación"] },
  { codigo: "E-102", nombre: "Sala de Diseño Industrial", tipo: "aula", capacidad: 18, bloque: "Bloque E", piso: 1, equipamiento: ["Software CAD/CAM", "Impresora 3D", "Escáner 3D", "Mesas de Dibujo"] },
  { codigo: "E-201", nombre: "Aula de Logística", tipo: "aula", capacidad: 30, bloque: "Bloque E", piso: 2, equipamiento: ["Proyector", "Pizarra", "Computador", "Internet"] },
  
  // Espacios Comunes
  { codigo: "COM-001", nombre: "Auditorio Principal", tipo: "auditorio", capacidad: 150, bloque: "Bloque Central", piso: 1, equipamiento: ["Sistema de Sonido", "Proyector 4K", "Pantalla Grande", "Micrófonos", "Aire Acondicionado"] },
  { codigo: "COM-002", nombre: "Biblioteca", tipo: "biblioteca", capacidad: 60, bloque: "Bloque Central", piso: 2, equipamiento: ["Estanterías", "Mesas de Estudio", "Computadores", "Zona WiFi", "Fotocopiadora"] },
  { codigo: "COM-003", nombre: "Cafetería", tipo: "cafeteria", capacidad: 80, bloque: "Bloque Central", piso: 0, equipamiento: ["Mesas", "Sillas", "Mostrador", "Microondas", "Refrigeradores"] }
];

/**
 * Poblar catálogo de programas de formación
 */
async function populatePrograms() {
  try {
    console.log('📚 Poblando catálogo de programas de formación...');
    
    const allPrograms = [...PROGRAMAS_TECNICOS, ...PROGRAMAS_TECNOLOGICOS];
    let inserted = 0;
    let updated = 0;

    for (const programa of allPrograms) {
      try {
        const [result] = await pool.execute(
          `INSERT INTO Programas_Formacion 
           (codigo_programa, nombre_programa, nivel, duracion_meses, area_conocimiento, estado)
           VALUES (?, ?, ?, ?, ?, 'activo')
           ON DUPLICATE KEY UPDATE
           nombre_programa = VALUES(nombre_programa),
           nivel = VALUES(nivel),
           duracion_meses = VALUES(duracion_meses),
           area_conocimiento = VALUES(area_conocimiento),
           fecha_actualizacion = NOW()`,
          [
            programa.codigo,
            programa.nombre,
            programa.nivel,
            programa.duracion,
            programa.area
          ]
        );

        if (result.affectedRows > 0) {
          if (result.insertId) {
            inserted++;
          } else {
            updated++;
          }
        }
      } catch (error) {
        console.error(`Error insertando programa ${programa.codigo}:`, error.message);
      }
    }

    console.log(`✅ Programas procesados: ${inserted} insertados, ${updated} actualizados`);
    return { inserted, updated, total: allPrograms.length };
  } catch (error) {
    console.error('❌ Error poblando programas:', error);
    throw error;
  }
}

/**
 * Poblar catálogo de ambientes
 */
async function populateAmbientes() {
  try {
    console.log('🏫 Poblando catálogo de ambientes...');
    
    let inserted = 0;
    let updated = 0;

    for (const ambiente of AMBIENTES_CBI) {
      try {
        const equipamientoJSON = JSON.stringify(ambiente.equipamiento || []);
        
        const [result] = await pool.execute(
          `INSERT INTO Ambientes 
           (codigo_ambiente, nombre_ambiente, tipo_ambiente, capacidad, bloque, piso, equipamiento, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')
           ON DUPLICATE KEY UPDATE
           nombre_ambiente = VALUES(nombre_ambiente),
           tipo_ambiente = VALUES(tipo_ambiente),
           capacidad = VALUES(capacidad),
           bloque = VALUES(bloque),
           piso = VALUES(piso),
           equipamiento = VALUES(equipamiento),
           fecha_actualizacion = NOW()`,
          [
            ambiente.codigo,
            ambiente.nombre,
            ambiente.tipo,
            ambiente.capacidad,
            ambiente.bloque,
            ambiente.piso,
            equipamientoJSON
          ]
        );

        if (result.affectedRows > 0) {
          if (result.insertId) {
            inserted++;
          } else {
            updated++;
          }
        }
      } catch (error) {
        console.error(`Error insertando ambiente ${ambiente.codigo}:`, error.message);
      }
    }

    console.log(`✅ Ambientes procesados: ${inserted} insertados, ${updated} actualizados`);
    return { inserted, updated, total: AMBIENTES_CBI.length };
  } catch (error) {
    console.error('❌ Error poblando ambientes:', error);
    throw error;
  }
}

/**
 * Función principal
 */
export async function populateCatalog() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🎓 POBLACIÓN DEL CATÁLOGO CBI PALMIRA');
    console.log('='.repeat(80));
    console.log('');

    // Poblar programas
    const programsResult = await populatePrograms();
    console.log('');

    // Poblar ambientes
    const ambientesResult = await populateAmbientes();
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ CATÁLOGO POBLADO EXITOSAMENTE');
    console.log('='.repeat(80));
    console.log(`📚 Programas: ${programsResult.inserted} nuevos, ${programsResult.updated} actualizados`);
    console.log(`🏫 Ambientes: ${ambientesResult.inserted} nuevos, ${ambientesResult.updated} actualizados`);
    console.log('');

    return {
      success: true,
      programs: programsResult,
      ambientes: ambientesResult
    };
  } catch (error) {
    console.error('❌ Error en población del catálogo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('populateCatalog.js')) {
  populateCatalog()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        console.error('❌ Error poblando catálogo');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}










