// DataTable - Tabla de datos con paginación y ordenamiento
import React, { useState } from 'react';

const DataTable = ({ 
  data = [], 
  columns = [], 
  pagination = null,
  onPageChange = null,
  onSort = null,
  loading = false,
  emptyMessage = 'No hay datos disponibles'
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (column) => {
    if (!onSort) return;
    
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort(column, newDirection);
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Formatear fechas
    if (column.includes('fecha') || column.includes('Fecha')) {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        return value || '-';
      }
    }
    
    // Formatear duración en minutos
    if (column.includes('duracion') || column.includes('duración') || column.includes('Duración')) {
      if (value === null || value === undefined) return '-';
      const minutes = parseInt(value);
      if (isNaN(minutes)) return '-';
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    
    // Formatear números
    if (typeof value === 'number') {
      return value.toLocaleString('es-CO');
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Si no se proporcionan columnas, inferirlas del primer objeto
  const tableColumns = columns.length > 0 
    ? columns 
    : Object.keys(data[0] || {}).map(key => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableColumns.map((col, idx) => {
                const columnKey = typeof col === 'string' ? col : col.key;
                const columnLabel = typeof col === 'string' ? col : col.label;
                const isSorted = sortColumn === columnKey;
                
                return (
                  <th
                    key={idx}
                    onClick={() => onSort && handleSort(columnKey)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      onSort ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {columnLabel}
                      {onSort && isSorted && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {tableColumns.map((col, colIdx) => {
                  const columnKey = typeof col === 'string' ? col : col.key;
                  const value = row[columnKey];
                  
                  return (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCellValue(value, columnKey)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de <span className="font-medium">{pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.page - 2 && page <= pagination.page + 2)
                  ) {
                    return (
                      <button
                        key={idx}
                        onClick={() => onPageChange && onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === pagination.page - 3 || page === pagination.page + 3) {
                    return <span key={idx} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;








