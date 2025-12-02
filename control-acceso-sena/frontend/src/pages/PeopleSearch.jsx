// PeopleSearch - Búsqueda avanzada de usuarios
import React, { useState, useCallback, useRef } from 'react';
import { useSearch } from '../hooks/useSearch.js';
import AdvancedFilters from '../components/reports/AdvancedFilters.jsx';
import DataTable from '../components/reports/DataTable.jsx';

const PeopleSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading, error, filters, pagination, updateFilters, performSearch, changePage, clearFilters } = useSearch('users');
  
  // Refs para mantener valores actuales sin causar re-renders
  const filtersRef = useRef(filters);
  const searchQueryRef = useRef(searchQuery);
  
  filtersRef.current = filters;
  searchQueryRef.current = searchQuery;

  const handleSearch = useCallback(() => {
    const currentFilters = filtersRef.current;
    const currentQuery = searchQueryRef.current;
    
    if (!currentQuery.trim() && Object.keys(currentFilters).length === 0) {
      // Si no hay búsqueda ni filtros, no hacer nada
      return;
    }
    
    const searchFilters = currentQuery.trim() 
      ? { ...currentFilters, query: currentQuery.trim() }
      : { ...currentFilters };
    
    // Remover query vacío si existe
    if (searchFilters.query === '') {
      delete searchFilters.query;
    }
    
    updateFilters(searchFilters);
    performSearch(searchFilters, 1);
  }, [updateFilters, performSearch]);

  const handleFilterChange = useCallback((newFilters) => {
    const currentFilters = filtersRef.current;
    const currentQuery = searchQueryRef.current;
    
    const updatedFilters = { ...currentFilters, ...newFilters };
    // Mantener query si existe
    if (currentQuery.trim()) {
      updatedFilters.query = currentQuery.trim();
    }
    updateFilters(updatedFilters);
    performSearch(updatedFilters, 1);
  }, [updateFilters, performSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    clearFilters();
  };

  const columns = [
    { key: 'documento', label: 'Documento' },
    { key: 'nombre_completo', label: 'Nombre Completo' },
    { key: 'email', label: 'Email' },
    { key: 'programa', label: 'Programa' },
    { key: 'ficha', label: 'Ficha' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'rol', label: 'Rol' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha_registro', label: 'Fecha Registro' },
    { key: 'ultimo_acceso', label: 'Último Acceso' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Búsqueda de Usuarios</h1>
          <p className="text-gray-600">Busca usuarios por documento, nombre, email o cualquier campo</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar por documento, nombre, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            {(searchQuery || Object.keys(filters).length > 0) && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filtros avanzados */}
        <AdvancedFilters
          onFilter={handleFilterChange}
          availableFilters={['rol', 'estado', 'documento', 'nombre', 'email']}
          initialFilters={filters}
        />

        {/* Resultados */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Resultados de Búsqueda
              </h2>
              {pagination && (
                <span className="text-sm text-gray-600">
                  {pagination.total} resultado{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <DataTable
              data={results.data || []}
              columns={columns}
              pagination={pagination}
              onPageChange={changePage}
              loading={loading}
              emptyMessage="No se encontraron usuarios con los criterios de búsqueda"
            />
          </div>
        )}

        {!results && !loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Ingresa un término de búsqueda para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleSearch;


