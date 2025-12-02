// Security Scanner Job - Verificación periódica de alertas
import AlertService from '../services/AlertService.js';
import FraudDetectionService from '../services/FraudDetectionService.js';
import SystemHealthService from '../services/SystemHealthService.js';

let isRunning = false;

export const runSecurityScan = async () => {
  if (isRunning) {
    console.log('⚠️  Security scan ya está en ejecución, omitiendo...');
    return;
  }

  isRunning = true;
  console.log('🔍 Iniciando verificación de seguridad...');

  try {
    // Verificar accesos fuera de horario
    const offScheduleAlerts = await AlertService.checkOffScheduleAccess();
    console.log(`✅ Accesos fuera de horario: ${offScheduleAlerts.length} alertas creadas`);

    // Verificar visitantes próximos a expirar
    const expiringVisitors = await AlertService.checkExpiringVisitors();
    console.log(`✅ Visitantes próximos a expirar: ${expiringVisitors.length} alertas creadas`);

    // Detectar intentos fraudulentos
    const fraudAttempts = await FraudDetectionService.detectFailedLoginAttempts();
    console.log(`✅ Intentos fraudulentos: ${fraudAttempts.length} alertas creadas`);

    // Detectar comportamiento sospechoso
    const suspiciousBehavior = await FraudDetectionService.detectSuspiciousBehavior();
    console.log(`✅ Comportamiento sospechoso: ${suspiciousBehavior.length} alertas creadas`);

    // Verificar salud del sistema
    const healthCheck = await SystemHealthService.checkSystemHealth();
    console.log(`✅ Salud del sistema: ${healthCheck.alertsCreated.length} alertas creadas`);

    const totalAlerts = offScheduleAlerts.length + 
                       expiringVisitors.length + 
                       fraudAttempts.length + 
                       suspiciousBehavior.length + 
                       healthCheck.alertsCreated.length;

    console.log(`✅ Verificación de seguridad completada. Total: ${totalAlerts} alertas creadas`);
  } catch (error) {
    console.error('❌ Error en verificación de seguridad:', error);
  } finally {
    isRunning = false;
  }
};

// Ejecutar cada 5 minutos
export const startSecurityScanner = () => {
  console.log('🚀 Iniciando scanner de seguridad (cada 5 minutos)');
  
  // Ejecutar inmediatamente
  runSecurityScan();
  
  // Luego cada 5 minutos
  setInterval(() => {
    runSecurityScan();
  }, 5 * 60 * 1000); // 5 minutos
};

















