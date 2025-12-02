// AdvancedFilters - Componente de filtros avanzados
import React, { useState, useEffect, useRef } from 'react';

const AdvancedFilters = ({ onFilter, availableFilters = [], initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    fecha_desde: initialFilters.fecha_desde || '',
    fecha_hasta: initialFilters.fecha_hasta || '',
    rol: initialFilters.rol || '',
    programa: initialFilters.programa || '',
    ficha: initialFilters.ficha || '',
    zona: initialFilters.zona || '',
    estado: initialFilters.estado || '',
    documento: initialFilters.documento || '',
    nombre: initialFilters.nombre || '',
    tipo_acceso: initialFilters.tipo_acceso || '',
    empresa: initialFilters.empresa || '',
    ...initialFilters
  });

  // Ref para rastrear si es la primera carga
  const isInitialMount = useRef(true);
  const onFilterRef = useRef(onFilter);
  const userInteractionRef = useRef(false);
  
  // Mantener referencia actualizada de onFilter sin causar re-renders
  useEffect(() => {
    onFilterRef.current = onFilter;
  }, [onFilter]);

  // Sincronizar con initialFilters solo en el primer render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // No llamar onFilter en el primer render
      return;
    }
  }, []);

  // Notificar cambios cuando los filtros cambian (solo después de interacción del usuario)
  useEffect(() => {
    if (isInitialMount.current || !userInteractionRef.current) {
      return;
    }

    const activeFilters = Object.entries(filters)
      .filter(([k, v]) => v !== null && v !== undefined && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    // Usar setTimeout para diferir la llamada hasta después del renderizado
    const timeoutId = setTimeout(() => {
      onFilterRef.current(activeFilters);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    userInteractionRef.current = true;
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    userInteractionRef.current = true;
    const cleared = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
    setFilters(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);

  return (
    <div className="advanced-filters bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filtros Avanzados</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtros de fecha */}
        {(availableFilters.includes('fecha_desde') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {(availableFilters.includes('fecha_hasta') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Filtro de rol */}
        {(availableFilters.includes('rol') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={filters.rol}
              onChange={(e) => handleFilterChange('rol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="APRENDIZ">Aprendiz</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="VISITANTE">Visitante</option>
              <option value="GUARDA">Guarda</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
        )}

        {/* Filtro de estado */}
        {(availableFilters.includes('estado') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        )}

        {/* Filtro de documento */}
        {(availableFilters.includes('documento') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento
            </label>
            <input
              type="text"
              placeholder="Buscar por documento..."
              value={filters.documento}
              onChange={(e) => handleFilterChange('documento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Filtro de nombre */}
        {(availableFilters.includes('nombre') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.nombre}
              onChange={(e) => handleFilterChange('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Filtro de tipo de acceso */}
        {(availableFilters.includes('tipo_acceso') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Acceso
            </label>
            <select
              value={filters.tipo_acceso}
              onChange={(e) => handleFilterChange('tipo_acceso', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
        )}

        {/* Filtro de zona */}
        {(availableFilters.includes('zona') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona/Ambiente
            </label>
            <select
              value={filters.zona}
              onChange={(e) => handleFilterChange('zona', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todas</option>
              <option value="Área de Formación">Área de Formación</option>
              <option value="Área Administrativa">Área Administrativa</option>
              <option value="Área de Visitantes">Área de Visitantes</option>
              <option value="Bloque Principal">Bloque Principal</option>
            </select>
          </div>
        )}

        {/* Filtro de empresa (para visitantes) */}
        {(availableFilters.includes('empresa') || availableFilters.length === 0) && (
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa/Contacto
            </label>
            <input
              type="text"
              placeholder="Buscar por empresa..."
              value={filters.empresa}
              onChange={(e) => handleFilterChange('empresa', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;




