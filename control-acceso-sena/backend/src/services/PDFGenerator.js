// PDF Generator - Generador de reportes PDF
// Nota: Para producción, usar librerías como pdfkit o puppeteer
// Por ahora retornamos estructura de datos que puede ser procesada por el frontend

export class PDFGenerator {
  /**
   * Generar estructura de reporte PDF para accesos
   */
  static generateAccessReport(data, filters = {}) {
    return {
      title: 'Reporte de Accesos - Sistema Control de Acceso SENA',
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'Sistema Control Acceso SENA',
        filters_applied: filters
      },
      content: {
        header: this.generateHeader(),
        summary: this.generateSummary(data.summary || {}),
        details: this.generateDetails(data.details || data.data || []),
        filters: this.generateFiltersSection(filters)
      },
      styles: this.getReportStyles()
    };
  }

  /**
   * Generar estructura de reporte PDF para usuarios
   */
  static generateUserReport(users, filters = {}) {
    return {
      title: 'Reporte de Usuarios - Sistema Control de Acceso SENA',
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'Sistema Control Acceso SENA',
        filters_applied: filters
      },
      content: {
        header: this.generateHeader(),
        summary: {
          total_usuarios: users.length,
          activos: users.filter(u => u.estado === 'activo').length,
          inactivos: users.filter(u => u.estado === 'inactivo').length
        },
        details: users.map(user => ({
          documento: user.documento,
          nombre: user.nombre_completo,
          email: user.email,
          rol: user.rol,
          estado: user.estado,
          ultimo_acceso: user.ultimo_acceso
        })),
        filters: this.generateFiltersSection(filters)
      },
      styles: this.getReportStyles()
    };
  }

  /**
   * Generar estructura de reporte PDF para zonas
   */
  static generateZoneReport(zones, occupation) {
    return {
      title: 'Reporte de Ocupación por Zonas - Sistema Control de Acceso SENA',
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'Sistema Control Acceso SENA'
      },
      content: {
        header: this.generateHeader(),
        summary: {
          total_zonas: zones.length,
          ocupacion_total: occupation.total || 0,
          capacidad_total: occupation.capacity || 0
        },
        details: zones.map(zone => ({
          zona: zone.zona,
          ocupacion_actual: zone.ocupacion_actual,
          capacidad_total: zone.capacidad_total,
          porcentaje_ocupacion: zone.porcentaje_ocupacion
        }))
      },
      styles: this.getReportStyles()
    };
  }

  static generateHeader() {
    return {
      title: 'Sistema de Control de Acceso SENA',
      subtitle: 'Reporte Generado',
      logo: '/assets/logo-sena.png', // Ruta al logo
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO')
    };
  }

  static generateSummary(summary) {
    return {
      total_registros: summary.total || 0,
      periodo: summary.periodo || {},
      metricas: summary.metricas || {}
    };
  }

  static generateDetails(details) {
    return details.map(item => ({
      ...item,
      formatted: this.formatItem(item)
    }));
  }

  static generateFiltersSection(filters) {
    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ campo: key, valor: value }));

    return {
      tiene_filtros: activeFilters.length > 0,
      filtros: activeFilters
    };
  }

  static formatItem(item) {
    // Formatear item para visualización en PDF
    return {
      documento: item.documento || 'N/A',
      nombre: item.nombre_completo || item.nombre || 'N/A',
      fecha: item.fecha_entrada ? new Date(item.fecha_entrada).toLocaleString('es-CO') : 'N/A',
      estado: item.estado || 'N/A'
    };
  }

  static getReportStyles() {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      headerColor: '#0066CC',
      textColor: '#333333',
      borderColor: '#CCCCCC'
    };
  }
}










