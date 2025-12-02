// Script para insertar programas de formación - CBI Palmira
import pool from '../utils/dbPool.js';

const PROGRAMAS_TECNICOS = [
  // Programas Administrativos y Comerciales
  { codigo: 'TEC-AA-001', nombre: 'Asistencia Administrativa', nivel: 'Técnico', duracion: 12, area: 'Gestión Administrativa' },
  { codigo: 'TEC-AOA-001', nombre: 'Asistencia en Organización de Archivos', nivel: 'Técnico', duracion: 12, area: 'Gestión Documental' },
  { codigo: 'TEC-COCF-001', nombre: 'Contabilización de Operaciones Comerciales y Financieras', nivel: 'Técnico', duracion: 12, area: 'Contabilidad y Finanzas' },
  { codigo: 'TEC-NPS-001', nombre: 'Nómina y Prestaciones Sociales', nivel: 'Técnico', duracion: 12, area: 'Recursos Humanos' },
  { codigo: 'TEC-OCR-001', nombre: 'Operaciones Comerciales en Retail', nivel: 'Técnico', duracion: 12, area: 'Comercio y Ventas' },
  { codigo: 'TEC-PEL-001', nombre: 'Peluquería', nivel: 'Técnico', duracion: 12, area: 'Belleza y Estética' },
  { codigo: 'TEC-RH-001', nombre: 'Recursos Humanos', nivel: 'Técnico', duracion: 12, area: 'Recursos Humanos' },
  { codigo: 'TEC-SCF-001', nombre: 'Servicios Comerciales y Financieros', nivel: 'Técnico', duracion: 12, area: 'Servicios Financieros' },
  
  // Programas Tecnológicos y Científicos
  { codigo: 'TEC-AMQ-001', nombre: 'Análisis de Muestras Químicas', nivel: 'Técnico', duracion: 12, area: 'Química y Laboratorio' },
  { codigo: 'TEC-DIM-001', nombre: 'Diseño e Integración de Multimedia', nivel: 'Técnico', duracion: 12, area: 'Tecnología Multimedia' },
  { codigo: 'TEC-ICD-001', nombre: 'Integración de Contenidos Digitales', nivel: 'Técnico', duracion: 12, area: 'Contenidos Digitales' },
  { codigo: 'TEC-IOL-001', nombre: 'Integración de Operaciones Logísticas', nivel: 'Técnico', duracion: 12, area: 'Logística' },
  { codigo: 'TEC-MAM-001', nombre: 'Monitoreo Ambiental', nivel: 'Técnico', duracion: 12, area: 'Medio Ambiente' },
  { codigo: 'TEC-PBFI-001', nombre: 'Producción de Biocombustibles y Fermentaciones Industriales', nivel: 'Técnico', duracion: 12, area: 'Biotecnología' },
  { codigo: 'TEC-PS-001', nombre: 'Programación de Software', nivel: 'Técnico', duracion: 12, area: 'Desarrollo de Software' },
  { codigo: 'TEC-PAG-001', nombre: 'Proyectos Agropecuarios', nivel: 'Técnico', duracion: 12, area: 'Agropecuaria' },
  { codigo: 'TEC-SIS-001', nombre: 'Sistemas', nivel: 'Técnico', duracion: 12, area: 'Sistemas Informáticos' },
  
  // Programas de Construcción y Mecánica
  { codigo: 'TEC-CED-001', nombre: 'Construcción de Edificaciones', nivel: 'Técnico', duracion: 12, area: 'Construcción' },
  { codigo: 'TEC-CLIS-001', nombre: 'Construcciones Livianas Industrializadas en Seco', nivel: 'Técnico', duracion: 12, area: 'Construcción' },
  { codigo: 'TEC-DMEC-001', nombre: 'Dibujo Mecánico', nivel: 'Técnico', duracion: 12, area: 'Diseño Mecánico' },
  { codigo: 'TEC-EI-001', nombre: 'Electricista Industrial', nivel: 'Técnico', duracion: 12, area: 'Electricidad Industrial' },
  { codigo: 'TEC-ISERC-001', nombre: 'Instalación de Sistemas Eléctricos Residenciales y Comerciales', nivel: 'Técnico', duracion: 12, area: 'Instalaciones Eléctricas' },
  { codigo: 'TEC-MMD-001', nombre: 'Mantenimiento de Motores Diésel', nivel: 'Técnico', duracion: 12, area: 'Mantenimiento Mecánico' },
  { codigo: 'TEC-MVL-001', nombre: 'Mantenimiento de Vehículos Livianos', nivel: 'Técnico', duracion: 12, area: 'Mantenimiento Automotriz' },
  { codigo: 'TEC-MECEA-001', nombre: 'Mantenimiento Eléctrico y Control Electrónico de Automotores', nivel: 'Técnico', duracion: 12, area: 'Mecánica Automotriz' },
  { codigo: 'TEC-MMI-001', nombre: 'Mecánica de Maquinaria Industrial', nivel: 'Técnico', duracion: 12, area: 'Mecánica Industrial' },
  { codigo: 'TEC-SPMP-001', nombre: 'Soldadura de Productos Metálicos en Plaina (placa metálica)', nivel: 'Técnico', duracion: 12, area: 'Soldadura' }
];

const PROGRAMAS_TECNOLOGICOS = [
  // Programas de Gestión y Administración
  { codigo: 'TECN-GBEF-001', nombre: 'Gestión Bancaria y de Entidades Financieras', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Financiera' },
  { codigo: 'TECN-GADM-001', nombre: 'Gestión Administrativa', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Administrativa' },
  { codigo: 'TECN-GEMP-001', nombre: 'Gestión Empresarial', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Empresarial' },
  { codigo: 'TECN-GTH-001', nombre: 'Gestión del Talento Humano', nivel: 'Tecnológico', duracion: 24, area: 'Recursos Humanos' },
  { codigo: 'TECN-DV-001', nombre: 'Dirección de Ventas', nivel: 'Tecnológico', duracion: 24, area: 'Ventas y Marketing' },
  { codigo: 'TECN-GPDES-001', nombre: 'Gestión de Proyectos de Desarrollo Económico y Social', nivel: 'Tecnológico', duracion: 24, area: 'Gestión de Proyectos' },
  { codigo: 'TECN-GDOC-001', nombre: 'Gestión Documental', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Documental' },
  { codigo: 'TECN-GCIF-001', nombre: 'Gestión Contable y de Información Financiera', nivel: 'Tecnológico', duracion: 24, area: 'Contabilidad' },
  { codigo: 'TECN-GTRF-001', nombre: 'Gestión de Tesorería y Recursos Financieros', nivel: 'Tecnológico', duracion: 24, area: 'Finanzas' },
  { codigo: 'TECN-GICMSSO-001', nombre: 'Gestión Integrada de la Calidad, Medio Ambiente, Seguridad y Salud Ocupacional', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Integral' },
  { codigo: 'TECN-GPI-001', nombre: 'Gestión de la Producción Industrial', nivel: 'Tecnológico', duracion: 24, area: 'Producción Industrial' },
  { codigo: 'TECN-GMA-001', nombre: 'Gestión del Mantenimiento de Automotores', nivel: 'Tecnológico', duracion: 24, area: 'Gestión Automotriz' },
  
  // Programas Deportivos y de Actividad Física
  { codigo: 'TECN-ED-001', nombre: 'Entrenamiento Deportivo', nivel: 'Tecnológico', duracion: 24, area: 'Deporte' },
  { codigo: 'TECN-AF-001', nombre: 'Actividad Física', nivel: 'Tecnológico', duracion: 24, area: 'Actividad Física' },
  
  // Programas de Biotecnología y Medio Ambiente
  { codigo: 'TECN-BCS-001', nombre: 'Biocomercio Sostenible', nivel: 'Tecnológico', duracion: 24, area: 'Biotecnología' },
  { codigo: 'TECN-CBI-001', nombre: 'Control de Bioprocesos Industriales', nivel: 'Tecnológico', duracion: 24, area: 'Biotecnología' },
  { codigo: 'TECN-PCA-001', nombre: 'Prevención y Control Ambiental', nivel: 'Tecnológico', duracion: 24, area: 'Medio Ambiente' },
  
  // Programas de Tecnología y Desarrollo
  { codigo: 'TECN-ADS-001', nombre: 'Análisis y Desarrollo de Software', nivel: 'Tecnológico', duracion: 24, area: 'Desarrollo de Software' },
  { codigo: 'TECN-MEII-001', nombre: 'Mantenimiento Electrónico e Instrumental Industrial', nivel: 'Tecnológico', duracion: 24, area: 'Electrónica Industrial' },
  { codigo: 'TECN-DMPI-001', nombre: 'Desarrollo y Modelado de Productos Industriales', nivel: 'Tecnológico', duracion: 24, area: 'Diseño Industrial' },
  
  // Programas de Mantenimiento Industrial
  { codigo: 'TECN-MMI-001', nombre: 'Mantenimiento Mecánico Industrial', nivel: 'Tecnológico', duracion: 24, area: 'Mantenimiento Industrial' },
  { codigo: 'TECN-MEI-001', nombre: 'Mantenimiento Electromecánico Industrial', nivel: 'Tecnológico', duracion: 24, area: 'Electromecánica' },
  
  // Programas de Logística
  { codigo: 'TECN-CPL-001', nombre: 'Coordinación de Procesos Logísticos', nivel: 'Tecnológico', duracion: 24, area: 'Logística' }
];

/**
 * Insertar programas de formación en la base de datos
 */
async function insertProgramas() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📚 INSERCIÓN DE PROGRAMAS DE FORMACIÓN - CBI PALMIRA');
    console.log('='.repeat(80));
    console.log('');
    
    const allPrograms = [...PROGRAMAS_TECNICOS, ...PROGRAMAS_TECNOLOGICOS];
    let inserted = 0;
    let updated = 0;
    let errors = 0;

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
            console.log(`✅ Insertado: ${programa.codigo} - ${programa.nombre}`);
          } else {
            updated++;
            console.log(`🔄 Actualizado: ${programa.codigo} - ${programa.nombre}`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error insertando ${programa.codigo}:`, error.message);
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ INSERCIÓN COMPLETADA');
    console.log('='.repeat(80));
    console.log(`📊 Resumen:`);
    console.log(`   - Programas técnicos: ${PROGRAMAS_TECNICOS.length}`);
    console.log(`   - Programas tecnológicos: ${PROGRAMAS_TECNOLOGICOS.length}`);
    console.log(`   - Total: ${allPrograms.length} programas`);
    console.log(`   - Insertados: ${inserted}`);
    console.log(`   - Actualizados: ${updated}`);
    console.log(`   - Errores: ${errors}`);
    console.log('');

    return {
      success: errors === 0,
      inserted,
      updated,
      errors,
      total: allPrograms.length
    };
  } catch (error) {
    console.error('❌ Error fatal insertando programas:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('insertProgramasFormacion.js')) {
  insertProgramas()
    .then(result => {
      if (result.success) {
        console.log('✅ Proceso completado exitosamente');
        process.exit(0);
      } else {
        console.error(`❌ Proceso completado con ${result.errors} errores`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { insertProgramas, PROGRAMAS_TECNICOS, PROGRAMAS_TECNOLOGICOS };







