// Utilidades para generación de logs y reportes de sincronización
import fs from 'fs';

/**
 * Genera un archivo de log en formato texto
 */
export async function generateLog(filePath, startTime, endTime, duration, summary, logEntries) {
  const logContent = `
================================================================================
                    LOG DE SINCRONIZACIÓN - CONTROL DE ACCESO SENA
================================================================================

FECHA/HORA DE INICIO: ${startTime.toLocaleString('es-CO')}
FECHA/HORA DE FIN:    ${endTime.toLocaleString('es-CO')}
DURACIÓN:             ${duration} segundos

================================================================================
                              RESUMEN GENERAL
================================================================================

Total registros procesados:     ${summary.total}
Nuevos usuarios agregados:       ${summary.nuevos}
Usuarios reactivados:            ${summary.reactivados}
Usuarios inhabilitados:          ${summary.inhabilitados}
Usuarios mantenidos:             ${summary.mantenidos}
Errores encontrados:             ${summary.errores}

================================================================================
                         DETALLE DE OPERACIONES
================================================================================

${generateSection('NUEVOS USUARIOS AGREGADOS', logEntries.nuevos, (entry) => 
  `  - ${entry.documento} | ${entry.nombre} | ${entry.accion} | ${entry.permiso}`
)}

${generateSection('USUARIOS REACTIVADOS', logEntries.reactivados, (entry) => 
  `  - ${entry.documento} | ${entry.nombre} | ${entry.accion} | ${entry.estado_anterior} → ${entry.estado_nuevo} | ${entry.permiso}`
)}

${generateSection('USUARIOS INHABILITADOS', logEntries.inhabilitados, (entry) => 
  `  - ${entry.documento} | ${entry.nombre} | ${entry.accion} | ${entry.estado_anterior} → ${entry.estado_nuevo} | ${entry.permiso}`
)}

${generateSection('USUARIOS MANTENIDOS', logEntries.mantenidos, (entry) => 
  `  - ${entry.documento} | ${entry.nombre} | ${entry.estado} | ${entry.permiso}`
)}

${generateSection('ERRORES', logEntries.errores, (entry) => 
  `  - ${entry.documento || 'N/A'} | ${entry.nombre || 'N/A'} | ${entry.accion} | Error: ${entry.error}`
)}

================================================================================
                              FIN DEL LOG
================================================================================
`;

  fs.writeFileSync(filePath, logContent, 'utf8');
}

/**
 * Genera un archivo de reporte en formato CSV
 */
export async function generateReport(filePath, logEntries) {
  const csvLines = [];
  
  // Encabezado
  csvLines.push('Tipo,Documento,Nombre,Acción,Estado Anterior,Estado Nuevo,Permiso,Error');

  // Nuevos usuarios
  logEntries.nuevos.forEach(entry => {
    csvLines.push([
      'NUEVO',
      entry.documento,
      `"${entry.nombre}"`,
      entry.accion,
      '',
      entry.estado,
      entry.permiso,
      ''
    ].join(','));
  });

  // Usuarios reactivados
  logEntries.reactivados.forEach(entry => {
    csvLines.push([
      'REACTIVADO',
      entry.documento,
      `"${entry.nombre}"`,
      entry.accion,
      entry.estado_anterior,
      entry.estado_nuevo,
      entry.permiso,
      ''
    ].join(','));
  });

  // Usuarios inhabilitados
  logEntries.inhabilitados.forEach(entry => {
    csvLines.push([
      'INHABILITADO',
      entry.documento,
      `"${entry.nombre}"`,
      entry.accion,
      entry.estado_anterior,
      entry.estado_nuevo,
      entry.permiso,
      ''
    ].join(','));
  });

  // Usuarios mantenidos
  logEntries.mantenidos.forEach(entry => {
    csvLines.push([
      'MANTENIDO',
      entry.documento,
      `"${entry.nombre}"`,
      entry.accion,
      entry.estado,
      entry.estado,
      entry.permiso,
      ''
    ].join(','));
  });

  // Errores
  logEntries.errores.forEach(entry => {
    csvLines.push([
      'ERROR',
      entry.documento || '',
      `"${entry.nombre || ''}"`,
      entry.accion,
      '',
      '',
      '',
      `"${entry.error}"`
    ].join(','));
  });

  fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');
}

/**
 * Función auxiliar para generar secciones del log
 */
function generateSection(title, entries, formatter) {
  if (entries.length === 0) {
    return `${title}: Ninguno\n`;
  }

  let section = `${title} (${entries.length}):\n\n`;
  entries.forEach(entry => {
    section += formatter(entry) + '\n';
  });
  section += '\n';

  return section;
}










