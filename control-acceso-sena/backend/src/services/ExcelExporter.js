// Excel Exporter - Exportador de reportes a Excel
import * as XLSX from 'xlsx';

export class ExcelExporter {
  /**
   * Exportar datos a Excel
   */
  static exportToExcel(data, reportType, options = {}) {
    const workbook = XLSX.utils.book_new();

    // Crear hoja principal
    const worksheetData = this.formatDataForExcel(data, reportType);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Aplicar estilos y formato
    this.applyExcelStyles(worksheet, reportType);

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    // Agregar hoja de resumen si hay datos de resumen
    if (data.summary) {
      const summaryData = this.formatSummaryForExcel(data.summary);
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    }

    return workbook;
  }

  /**
   * Formatear datos según el tipo de reporte
   */
  static formatDataForExcel(data, reportType) {
    const rows = [];
    
    // Obtener headers según tipo de reporte
    const headers = this.getHeaders(reportType);
    rows.push(headers);

    // Obtener datos
    const dataRows = Array.isArray(data.data) ? data.data : data;
    
    // Formatear cada fila
    dataRows.forEach(item => {
      const row = this.formatRow(item, reportType);
      rows.push(row);
    });

    return rows;
  }

  /**
   * Obtener headers según tipo de reporte
   */
  static getHeaders(reportType) {
    const headers = {
      'access': ['Documento', 'Tipo Documento', 'Nombre Completo', 'Rol', 'Tipo Acceso', 'Fecha Entrada', 'Fecha Salida', 'Duración (min)', 'Estado', 'Registrado Por'],
      'users': ['Documento', 'Tipo Documento', 'Nombre Completo', 'Email', 'Teléfono', 'Rol', 'Estado', 'Fecha Registro', 'Último Acceso'],
      'zones': ['Zona', 'Ocupación Actual', 'Capacidad Total', 'Porcentaje Ocupación (%)'],
      'current-people': ['Documento', 'Tipo Documento', 'Nombre Completo', 'Rol', 'Zona', 'Fecha Entrada', 'Tiempo Dentro'],
      'weekly': ['Fecha', 'Día Semana', 'Rol', 'Total Accesos', 'Entradas', 'Salidas', 'Personas Únicas']
    };

    return headers[reportType] || headers['access'];
  }

  /**
   * Formatear una fila según el tipo de reporte
   */
  static formatRow(item, reportType) {
    switch (reportType) {
      case 'access':
      case 'access-history':
        return [
          item.documento || '',
          item.tipo_documento || '',
          item.nombre_completo || '',
          item.rol || '',
          item.tipo_acceso || '',
          item.fecha_entrada ? new Date(item.fecha_entrada).toLocaleString('es-CO') : '',
          item.fecha_salida ? new Date(item.fecha_salida).toLocaleString('es-CO') : '',
          item.duracion_minutos || 0,
          item.estado || '',
          item.registrado_por || ''
        ];

      case 'users':
        return [
          item.documento || '',
          item.tipo_documento || '',
          item.nombre_completo || '',
          item.email || '',
          item.telefono || '',
          item.rol || '',
          item.estado || '',
          item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString('es-CO') : '',
          item.ultimo_acceso ? new Date(item.ultimo_acceso).toLocaleString('es-CO') : ''
        ];

      case 'zones':
        return [
          item.zona || '',
          item.ocupacion_actual || 0,
          item.capacidad_total || 0,
          item.porcentaje_ocupacion || 0
        ];

      case 'current-people':
        return [
          item.documento || '',
          item.tipo_documento || '',
          item.nombre_completo || '',
          item.rol || '',
          item.zona || '',
          item.fecha_entrada ? new Date(item.fecha_entrada).toLocaleString('es-CO') : '',
          item.tiempo_dentro || ''
        ];

      case 'weekly':
        return [
          item.fecha || '',
          item.dia_semana || '',
          item.rol || '',
          item.total_accesos || 0,
          item.entradas || 0,
          item.salidas || 0,
          item.personas_unicas || 0
        ];

      default:
        return Object.values(item);
    }
  }

  /**
   * Formatear resumen para Excel
   */
  static formatSummaryForExcel(summary) {
    const rows = [
      ['RESUMEN DEL REPORTE'],
      [''],
      ['Total Registros', summary.total || 0],
      ['Fecha Desde', summary.periodo?.fecha_desde || 'N/A'],
      ['Fecha Hasta', summary.periodo?.fecha_hasta || 'N/A'],
      ['Generado', new Date().toLocaleString('es-CO')]
    ];

    if (summary.metricas) {
      rows.push(['']);
      rows.push(['MÉTRICAS']);
      Object.entries(summary.metricas).forEach(([key, value]) => {
        rows.push([key, value]);
      });
    }

    return rows;
  }

  /**
   * Aplicar estilos básicos (XLSX tiene limitaciones, esto es básico)
   */
  static applyExcelStyles(worksheet, reportType) {
    // Nota: XLSX tiene limitaciones para estilos avanzados
    // Para estilos más complejos, usar exceljs u otra librería
    // Por ahora solo ajustamos el ancho de columnas
    const colWidths = this.getColumnWidths(reportType);
    worksheet['!cols'] = colWidths.map(width => ({ wch: width }));
  }

  /**
   * Obtener anchos de columna según tipo de reporte
   */
  static getColumnWidths(reportType) {
    const widths = {
      'access': [15, 12, 30, 15, 12, 20, 20, 15, 12, 20],
      'users': [15, 12, 30, 25, 15, 15, 12, 15, 20],
      'zones': [25, 18, 18, 20],
      'current-people': [15, 12, 30, 15, 25, 20, 15],
      'weekly': [15, 15, 15, 15, 12, 12, 18]
    };

    return widths[reportType] || widths['access'];
  }

  /**
   * Generar buffer de Excel para descarga
   */
  static generateExcelBuffer(workbook) {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generar nombre de archivo con timestamp
   */
  static generateFileName(reportType, prefix = 'reporte') {
    const timestamp = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}_${reportType}_${timestamp}_${time}.xlsx`;
  }
}








