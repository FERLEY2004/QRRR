// Export Controller - Controlador de exportación de reportes
import { PDFGenerator } from '../services/PDFGenerator.js';
import { ExcelExporter } from '../services/ExcelExporter.js';
import { ReportService } from '../services/ReportService.js';
import { SearchService } from '../services/SearchService.js';
import { createSecurityLog } from './auditController.js';

/**
 * HU8 - Exportar reporte a PDF
 */
export const exportToPDF = async (req, res) => {
  try {
    const { reportType, filters, data } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de reporte requerido'
      });
    }

    // Si no se proporcionan datos, obtenerlos del servicio
    let reportData = data;
    if (!reportData) {
      switch (reportType) {
        case 'current-people':
          reportData = await ReportService.getCurrentPeople(filters || {});
          break;
        case 'weekly':
          reportData = await ReportService.getWeeklyAccess(filters || {});
          break;
        case 'zones':
          // Función eliminada - retornar error
          return res.status(400).json({
            success: false,
            message: 'Reporte de ocupación por zonas ha sido eliminado'
          });
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de reporte no válido'
          });
      }
    }

    // Generar estructura PDF
    const pdfStructure = PDFGenerator.generateAccessReport(reportData, filters || {});

    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Exportación PDF - ${reportType}`,
      detalles: { reportType, filters },
      exito: true
    });

    // Retornar estructura (el frontend puede usar una librería para generar el PDF)
    res.json({
      success: true,
      data: pdfStructure,
      message: 'Estructura PDF generada. Use una librería del frontend para generar el archivo PDF.'
    });
  } catch (error) {
    console.error('Error en exportToPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * HU8 - Exportar reporte a Excel
 */
export const exportToExcel = async (req, res) => {
  try {
    const { reportType, filters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de reporte requerido'
      });
    }

    // Obtener datos según el tipo de reporte
    let reportData;
    switch (reportType) {
      case 'current-people':
        reportData = await ReportService.getCurrentPeople(filters || {});
        break;
      case 'weekly':
        reportData = await ReportService.getWeeklyAccess(filters || {});
        break;
      case 'zones':
        // Función eliminada - retornar error
        return res.status(400).json({
          success: false,
          message: 'Reporte de ocupación por zonas ha sido eliminado'
        });
      case 'access-history':
        reportData = await ReportService.getAccessHistory(filters || {}, { page: 1, limit: 10000 });
        break;
      case 'users':
        reportData = await SearchService.searchUsers(filters || {}, { page: 1, limit: 10000 });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        });
    }

    // Generar Excel
    const workbook = ExcelExporter.exportToExcel(reportData, reportType);
    const buffer = ExcelExporter.generateExcelBuffer(workbook);
    const fileName = ExcelExporter.generateFileName(reportType);

    await createSecurityLog({
      tipo: 'generacion_reporte',
      id_usuario: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      accion: `Exportación Excel - ${reportType}`,
      detalles: { reportType, filters },
      exito: true
    });

    // Enviar archivo Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error en exportToExcel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};







