// ReportsDashboard - Dashboard principal de reportes
import React, { useState } from 'react';
import { useReports } from '../hooks/useReports.js';
import AdvancedFilters from '../components/reports/AdvancedFilters.jsx';
import DataTable from '../components/reports/DataTable.jsx';
import ExportButtons from '../components/reports/ExportButtons.jsx';
import MetricCard from '../components/MetricCard.jsx';

const ReportsDashboard = () => {
  const [activeReport, setActiveReport] = useState('current-people');
  const [filters, setFilters] = useState({});

  const reportConfigs = {
    'current-people': {
      title: 'Personas Actualmente Dentro',
      endpoint: 'current-people',
      columns: [
        { key: 'documento', label: 'Documento' },
        { key: 'nombre_completo', label: 'Nombre Completo' },
        { key: 'rol', label: 'Rol' },
        { key: 'zona', label: 'Zona' },
        { key: 'fecha_entrada', label: 'Fecha Entrada' },
        { key: 'tiempo_dentro', label: 'Tiempo Dentro' }
      ],
      availableFilters: ['rol', 'zona']
    }
  };

  const { data, loading, error, updateFilters, refresh } = useReports(
    reportConfigs[activeReport]?.endpoint || 'current-people',
    filters
  );

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handlePageChange = (page) => {
    updateFilters({ ...filters, page });
  };

  const handleExport = (format) => {
    console.log(`Exportando a ${format}...`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reportes del Sistema</h1>
          <p className="text-gray-600">Consulta y analiza los datos de acceso del sistema</p>
        </div>

        {/* Selector de reportes */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(reportConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveReport(key);
                  setFilters({});
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeReport === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {config.title}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <AdvancedFilters
          onFilter={handleFilterChange}
          availableFilters={reportConfigs[activeReport]?.availableFilters || []}
          initialFilters={filters}
        />

        {/* Métricas resumen */}
        {data && data.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Registros"
              value={data.total || data.data.length}
              icon="📊"
            />
            {data.periodo && (
              <>
                <MetricCard
                  title="Desde"
                  value={new Date(data.periodo.fecha_desde).toLocaleDateString('es-CO')}
                  icon="📅"
                />
                <MetricCard
                  title="Hasta"
                  value={new Date(data.periodo.fecha_hasta).toLocaleDateString('es-CO')}
                  icon="📅"
                />
              </>
            )}
          </div>
        )}

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {reportConfigs[activeReport]?.title}
            </h2>
            <ExportButtons
              reportType={activeReport}
              filters={filters}
              data={data}
              onExportComplete={handleExport}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <DataTable
            data={data?.data || []}
            columns={reportConfigs[activeReport]?.columns || []}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
            loading={loading}
            emptyMessage={`No hay datos disponibles para ${reportConfigs[activeReport]?.title}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;


