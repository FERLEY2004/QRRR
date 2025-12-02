-- =====================================================
-- INSERCIÓN DE PROGRAMAS DE FORMACIÓN - CBI PALMIRA
-- Sistema de Control de Acceso SENA
-- =====================================================

USE control_acceso_sena;

-- =====================================================
-- PROGRAMAS TÉCNICOS (12 meses)
-- =====================================================

INSERT INTO Programas_Formacion 
(codigo_programa, nombre_programa, nivel, duracion_meses, area_conocimiento, estado)
VALUES
-- Programas Administrativos y Comerciales
('TEC-AA-001', 'Asistencia Administrativa', 'Técnico', 12, 'Gestión Administrativa', 'activo'),
('TEC-AOA-001', 'Asistencia en Organización de Archivos', 'Técnico', 12, 'Gestión Documental', 'activo'),
('TEC-COCF-001', 'Contabilización de Operaciones Comerciales y Financieras', 'Técnico', 12, 'Contabilidad y Finanzas', 'activo'),
('TEC-NPS-001', 'Nómina y Prestaciones Sociales', 'Técnico', 12, 'Recursos Humanos', 'activo'),
('TEC-OCR-001', 'Operaciones Comerciales en Retail', 'Técnico', 12, 'Comercio y Ventas', 'activo'),
('TEC-PEL-001', 'Peluquería', 'Técnico', 12, 'Belleza y Estética', 'activo'),
('TEC-RH-001', 'Recursos Humanos', 'Técnico', 12, 'Recursos Humanos', 'activo'),
('TEC-SCF-001', 'Servicios Comerciales y Financieros', 'Técnico', 12, 'Servicios Financieros', 'activo'),

-- Programas Tecnológicos y Científicos
('TEC-AMQ-001', 'Análisis de Muestras Químicas', 'Técnico', 12, 'Química y Laboratorio', 'activo'),
('TEC-DIM-001', 'Diseño e Integración de Multimedia', 'Técnico', 12, 'Tecnología Multimedia', 'activo'),
('TEC-ICD-001', 'Integración de Contenidos Digitales', 'Técnico', 12, 'Contenidos Digitales', 'activo'),
('TEC-IOL-001', 'Integración de Operaciones Logísticas', 'Técnico', 12, 'Logística', 'activo'),
('TEC-MAM-001', 'Monitoreo Ambiental', 'Técnico', 12, 'Medio Ambiente', 'activo'),
('TEC-PBFI-001', 'Producción de Biocombustibles y Fermentaciones Industriales', 'Técnico', 12, 'Biotecnología', 'activo'),
('TEC-PS-001', 'Programación de Software', 'Técnico', 12, 'Desarrollo de Software', 'activo'),
('TEC-PAG-001', 'Proyectos Agropecuarios', 'Técnico', 12, 'Agropecuaria', 'activo'),
('TEC-SIS-001', 'Sistemas', 'Técnico', 12, 'Sistemas Informáticos', 'activo'),

-- Programas de Construcción y Mecánica
('TEC-CED-001', 'Construcción de Edificaciones', 'Técnico', 12, 'Construcción', 'activo'),
('TEC-CLIS-001', 'Construcciones Livianas Industrializadas en Seco', 'Técnico', 12, 'Construcción', 'activo'),
('TEC-DMEC-001', 'Dibujo Mecánico', 'Técnico', 12, 'Diseño Mecánico', 'activo'),
('TEC-EI-001', 'Electricista Industrial', 'Técnico', 12, 'Electricidad Industrial', 'activo'),
('TEC-ISERC-001', 'Instalación de Sistemas Eléctricos Residenciales y Comerciales', 'Técnico', 12, 'Instalaciones Eléctricas', 'activo'),
('TEC-MMD-001', 'Mantenimiento de Motores Diésel', 'Técnico', 12, 'Mantenimiento Mecánico', 'activo'),
('TEC-MVL-001', 'Mantenimiento de Vehículos Livianos', 'Técnico', 12, 'Mantenimiento Automotriz', 'activo'),
('TEC-MECEA-001', 'Mantenimiento Eléctrico y Control Electrónico de Automotores', 'Técnico', 12, 'Mecánica Automotriz', 'activo'),
('TEC-MMI-001', 'Mecánica de Maquinaria Industrial', 'Técnico', 12, 'Mecánica Industrial', 'activo'),
('TEC-SPMP-001', 'Soldadura de Productos Metálicos en Platina', 'Técnico', 12, 'Soldadura', 'activo')

ON DUPLICATE KEY UPDATE
nombre_programa = VALUES(nombre_programa),
nivel = VALUES(nivel),
duracion_meses = VALUES(duracion_meses),
area_conocimiento = VALUES(area_conocimiento),
estado = VALUES(estado),
fecha_actualizacion = NOW();

-- =====================================================
-- PROGRAMAS TECNOLÓGICOS (24 meses)
-- =====================================================

INSERT INTO Programas_Formacion 
(codigo_programa, nombre_programa, nivel, duracion_meses, area_conocimiento, estado)
VALUES
-- Programas de Gestión y Administración
('TECN-GBEF-001', 'Gestión Bancaria y de Entidades Financieras', 'Tecnológico', 24, 'Gestión Financiera', 'activo'),
('TECN-GADM-001', 'Gestión Administrativa', 'Tecnológico', 24, 'Gestión Administrativa', 'activo'),
('TECN-GEMP-001', 'Gestión Empresarial', 'Tecnológico', 24, 'Gestión Empresarial', 'activo'),
('TECN-GTH-001', 'Gestión del Talento Humano', 'Tecnológico', 24, 'Recursos Humanos', 'activo'),
('TECN-DV-001', 'Dirección de Ventas', 'Tecnológico', 24, 'Ventas y Marketing', 'activo'),
('TECN-GPDES-001', 'Gestión de Proyectos de Desarrollo Económico y Social', 'Tecnológico', 24, 'Gestión de Proyectos', 'activo'),
('TECN-GDOC-001', 'Gestión Documental', 'Tecnológico', 24, 'Gestión Documental', 'activo'),
('TECN-GCIF-001', 'Gestión Contable y de Información Financiera', 'Tecnológico', 24, 'Contabilidad', 'activo'),
('TECN-GTRF-001', 'Gestión de Tesorería y Recursos Financieros', 'Tecnológico', 24, 'Finanzas', 'activo'),

-- Programas Deportivos y de Actividad Física
('TECN-ED-001', 'Entrenamiento Deportivo', 'Tecnológico', 24, 'Deporte', 'activo'),
('TECN-AF-001', 'Actividad Física', 'Tecnológico', 24, 'Actividad Física', 'activo'),

-- Programas de Biotecnología y Medio Ambiente
('TECN-BCS-001', 'Biocomercio Sostenible', 'Tecnológico', 24, 'Biotecnología', 'activo'),
('TECN-CBI-001', 'Control de Bioprocesos Industriales', 'Tecnológico', 24, 'Biotecnología', 'activo'),
('TECN-PCA-001', 'Prevención y Control Ambiental', 'Tecnológico', 24, 'Medio Ambiente', 'activo'),

-- Programas de Tecnología y Desarrollo
('TECN-ADS-001', 'Análisis y Desarrollo de Software', 'Tecnológico', 24, 'Desarrollo de Software', 'activo'),
('TECN-MEII-001', 'Mantenimiento Electrónico e Instrumental Industrial', 'Tecnológico', 24, 'Electrónica Industrial', 'activo'),
('TECN-DMPI-001', 'Desarrollo y Modelado de Productos Industriales', 'Tecnológico', 24, 'Diseño Industrial', 'activo'),

-- Programas de Mantenimiento Industrial
('TECN-MMI-001', 'Mantenimiento Mecánico Industrial', 'Tecnológico', 24, 'Mantenimiento Industrial', 'activo'),
('TECN-MEI-001', 'Mantenimiento Electromecánico Industrial', 'Tecnológico', 24, 'Electromecánica', 'activo'),
('TECN-GMA-001', 'Gestión del Mantenimiento de Automotores', 'Tecnológico', 24, 'Gestión Automotriz', 'activo'),

-- Programas de Logística y Producción
('TECN-CPL-001', 'Coordinación de Procesos Logísticos', 'Tecnológico', 24, 'Logística', 'activo'),
('TECN-GPI-001', 'Gestión de la Producción Industrial', 'Tecnológico', 24, 'Producción Industrial', 'activo'),

-- Programas de Gestión Integral
('TECN-GICMSSO-001', 'Gestión Integrada de la Calidad, Medio Ambiente, Seguridad y Salud Ocupacional', 'Tecnológico', 24, 'Gestión Integral', 'activo')

ON DUPLICATE KEY UPDATE
nombre_programa = VALUES(nombre_programa),
nivel = VALUES(nivel),
duracion_meses = VALUES(duracion_meses),
area_conocimiento = VALUES(area_conocimiento),
estado = VALUES(estado),
fecha_actualizacion = NOW();

-- =====================================================
-- RESUMEN DE INSERCIÓN
-- =====================================================
-- Total de programas técnicos: 27
-- Total de programas tecnológicos: 23
-- Total general: 50 programas
-- =====================================================

-- Verificar inserción
SELECT 
  nivel,
  COUNT(*) as total,
  GROUP_CONCAT(nombre_programa ORDER BY nombre_programa SEPARATOR ', ') as programas
FROM Programas_Formacion
WHERE estado = 'activo'
GROUP BY nivel
ORDER BY nivel;

