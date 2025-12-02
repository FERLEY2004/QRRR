// Performance Monitor - Monitoreo de rendimiento del scanner
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      averageScanTime: 0,
      errors: [],
      scanTimes: []
    };

    this.startTime = Date.now();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  recordScan(result) {
    this.metrics.totalScans++;

    if (result.success) {
      this.metrics.successfulScans++;
    } else {
      this.metrics.failedScans++;
      this.metrics.errors.push({
        error: result.error || result.message,
        code: result.code,
        timestamp: new Date().toISOString()
      });
    }

    // Calcular promedio móvil del tiempo de escaneo
    if (result.processingTime !== undefined) {
      this.metrics.scanTimes.push(result.processingTime);
      
      // Mantener solo los últimos 100 tiempos para el promedio
      if (this.metrics.scanTimes.length > 100) {
        this.metrics.scanTimes.shift();
      }
      
      // Calcular promedio
      const sum = this.metrics.scanTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageScanTime = sum / this.metrics.scanTimes.length;
    }
  }

  getPerformanceReport() {
    const uptime = Date.now() - this.startTime;
    const successRate = this.metrics.totalScans > 0
      ? (this.metrics.successfulScans / this.metrics.totalScans) * 100
      : 0;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      uptime: this.formatUptime(uptime),
      scansPerMinute: this.calculateScansPerMinute(),
      sessionId: this.sessionId,
      minScanTime: this.metrics.scanTimes.length > 0 
        ? Math.min(...this.metrics.scanTimes) 
        : 0,
      maxScanTime: this.metrics.scanTimes.length > 0 
        ? Math.max(...this.metrics.scanTimes) 
        : 0
    };
  }

  calculateScansPerMinute() {
    const uptimeMinutes = (Date.now() - this.startTime) / (1000 * 60);
    if (uptimeMinutes === 0) return 0;
    return Math.round((this.metrics.totalScans / uptimeMinutes) * 100) / 100;
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  reset() {
    this.metrics = {
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      averageScanTime: 0,
      errors: [],
      scanTimes: []
    };
    this.startTime = Date.now();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportMetrics() {
    return {
      report: this.getPerformanceReport(),
      rawMetrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

export default PerformanceMonitor;
















