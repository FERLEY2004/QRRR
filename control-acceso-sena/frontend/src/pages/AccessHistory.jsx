// AccessHistory - Historial de accesos
import React, { useState, useCallback, useRef } from 'react';
import { useReports } from '../hooks/useReports.js';
import AdvancedFilters from '../components/reports/AdvancedFilters.jsx';
import DataTable from '../components/reports/DataTable.jsx';
import ExportButtons from '../components/reports/ExportButtons.jsx';

const AccessHistory = () => {
  const initialFilters = {
    fecha_desde: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0]
  };

  const [filters, setFilters] = useState(initialFilters);
  const { data, loading, error, updateFilters, refresh } = useReports('access-history', initialFilters);
  const filtersRef = useRef(initialFilters);

  const handleFilterChange = useCallback((newFilters) => {
    // Usar setTimeout para evitar actualizar durante el renderizado
    setTimeout(() => {
      const updatedFilters = { ...filtersRef.current, ...newFilters };
      filtersRef.current = updatedFilters;
      setFilters(updatedFilters);
      updateFilters(updatedFilters);
    }, 0);
  }, [updateFilters]);

  const handlePageChange = (page) => {
    updateFilters({ ...filters, page });
  };

  const columns = [
    { key: 'documento', label: 'Documento' },
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'rol', label: 'Rol' },
    { key: 'tipo_acceso', label: 'Tipo' },
    { key: 'fecha_entrada', label: 'Fecha Entrada' },
    { key: 'fecha_salida', label: 'Fecha Salida' },
    { key: 'duracion_minutos', label: 'Duración (min)' },
    { key: 'estado', label: 'Estado' },
    { key: 'registrado_por', label: 'Registrado Por' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Historial de Accesos</h1>
              <p className="text-gray-600">Consulta el historial completo de accesos al sistema</p>
            </div>
            <ExportButtons
              reportType="access-history"
              filters={filters}
              data={data}
            />
          </div>
        </div>

        {/* Filtros */}
        <AdvancedFilters
          onFilter={handleFilterChange}
          availableFilters={['fecha_desde', 'fecha_hasta', 'documento', 'rol', 'tipo_acceso']}
          initialFilters={filters}
        />

        {/* Resumen */}
        {data && data.pagination && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de registros</p>
                <p className="text-2xl font-bold text-gray-800">{data.pagination.total}</p>
              </div>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Actualizar
              </button>
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <DataTable
            data={data?.data || []}
            columns={columns}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
            loading={loading}
            emptyMessage="No hay registros de acceso para los filtros seleccionados"
          />
        </div>
      </div>
    </div>
  );
};

export default AccessHistory;










