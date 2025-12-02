#!/usr/bin/env node
/**
 * Script ejecutable para sincronización de Excel a Base de Datos
 * 
 * Uso:
 *   node sync.js [ruta_al_archivo_excel]
 * 
 * Ejemplo:
 *   node sync.js "uploads/Reporte de Juicios Evaluativos_3066232 (1).xlsx"
 */

import { syncExcelToDatabase } from './src/utils/syncExcelToDB.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener argumentos de línea de comandos
const inputFile = process.argv[2] || null;

console.log('\n🔄 Sistema de Sincronización Excel -> Base de Datos');
console.log('='.repeat(80));
console.log('');

// Ejecutar sincronización
syncExcelToDatabase(inputFile)
  .then(result => {
    if (result.success) {
      console.log('\n✅ Sincronización completada exitosamente');
      console.log(`📁 Archivos generados:`);
      console.log(`   - Log: ${result.logFilePath}`);
      console.log(`   - Reporte CSV: ${result.reportFilePath}`);
      console.log(`   - Excel: ${result.excelOutputPath}`);
      process.exit(0);
    } else {
      console.error('\n❌ La sincronización falló');
      console.error(`Error: ${result.error}`);
      if (result.errorLogPath) {
        console.error(`Log de error: ${result.errorLogPath}`);
      }
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error fatal en sincronización:', error);
    process.exit(1);
  });










