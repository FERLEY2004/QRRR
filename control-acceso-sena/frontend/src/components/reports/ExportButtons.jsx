// ExportButtons - Botones de exportación PDF/Excel
import React, { useState } from 'react';
import { exportAPI } from '../../services/api.js';

const ExportButtons = ({ reportType, filters = {}, data = null, onExportStart, onExportComplete, onExportError }) => {
  const [exporting, setExporting] = useState({ pdf: false, excel: false });

  const generatePDF = async (reportData, reportType, filters) => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    const primaryColor = '#1D4ED8';
    const secondaryColor = '#6B7280';
    const margin = 40;

    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.text('Reporte de Accesos - Sistema Control de Acceso SENA', margin, 40);
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, margin, 60);

    let cursorY = 80;

    const filterEntries = Object.entries(filters || {}).filter(([key, value]) => value !== undefined && value !== null && value !== '');
    if (filterEntries.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text('Filtros aplicados', margin, cursorY);
      cursorY += 16;
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor);
      filterEntries.forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        doc.text(`${label}: ${value}`, margin, cursorY);
        cursorY += 14;
      });
      cursorY += 6;
    }

    if (!reportData || !reportData.data || reportData.data.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor('#000');
      doc.text('No hay datos para mostrar en este reporte', margin, cursorY + 20);
    } else {
      const rows = reportData.data.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => {
          normalized[key] = row[key];
        });
        return normalized;
      });

      const columns = Object.keys(rows[0] || {}).map(key => ({
        header: key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        dataKey: key
      }));

      const autoTableResult = autoTable(doc, {
        startY: cursorY,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey] ?? '')),
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: '#ffffff',
          halign: 'left',
          fontSize: 9
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'middle'
        },
        columnStyles: columns.reduce((acc, col, index) => {
          acc[index] = { cellWidth: col.header.length > 12 ? 'auto' : 'wrap' };
          return acc;
        }, {}),
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFontSize(10);
            doc.setTextColor(secondaryColor);
            doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.width - margin - 50, doc.internal.pageSize.height - 20);
          }
        }
      });

      if (reportData.pagination?.total && reportData.pagination.total > rows.length) {
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor);
        const finalY = autoTableResult?.finalY || doc.previousAutoTable?.finalY || cursorY;
        doc.text(`Mostrando ${rows.length} de ${reportData.pagination.total} registros`, margin, finalY + 16);
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`reporte_${reportType}_${timestamp}.pdf`);
  };

  const handleExport = async (format) => {
    if (!reportType) {
      alert('Tipo de reporte no especificado');
      return;
    }

    setExporting(prev => ({ ...prev, [format]: true }));
    if (onExportStart) onExportStart(format);

    try {
      if (format === 'excel') {
        await exportAPI.exportToExcel(reportType, filters);
        if (onExportComplete) onExportComplete(format);
      } else if (format === 'pdf') {
        // Si tenemos datos, usarlos directamente, sino obtenerlos del backend
        let reportData = data;
        if (!reportData) {
          const result = await exportAPI.exportToPDF(reportType, filters, data);
          reportData = result.data || result;
        }
        
        await generatePDF(reportData, reportType, filters);
        if (onExportComplete) onExportComplete(format);
      }
    } catch (error) {
      console.error(`Error exportando a ${format}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Error al exportar a ${format}`;
      alert(errorMessage);
      if (onExportError) onExportError(format, error);
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  return (
    <div className="export-buttons flex gap-3">
      <button
        onClick={() => handleExport('excel')}
        disabled={exporting.excel}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting.excel ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar Excel</span>
          </>
        )}
      </button>

      <button
        onClick={() => handleExport('pdf')}
        disabled={exporting.pdf}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting.pdf ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Exportar PDF</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExportButtons;










