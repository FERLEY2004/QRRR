// Hook para búsqueda avanzada
import { useState, useCallback, useRef, useEffect } from 'react';
import { searchAPI } from '../services/api.js';

export const useSearch = (searchType = 'users') => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });
  
  // Usar refs para mantener valores actuales sin causar re-renders
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  
  // Sincronizar refs cuando cambian los valores (usar useEffect para evitar problemas)
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const performSearch = useCallback(async (searchFilters = null, page = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar los filtros pasados, o los del estado actual, o los del ref como último recurso
      const activeFilters = searchFilters !== null 
        ? searchFilters 
        : (filtersRef.current || {});
      const activePage = page !== null 
        ? page 
        : (paginationRef.current?.page || 1);
      const activeLimit = paginationRef.current?.limit || 50;
      
      let result;
      
      switch (searchType) {
        case 'users':
          result = await searchAPI.searchUsers(activeFilters, { page: activePage, limit: activeLimit });
          break;
        case 'access':
          result = await searchAPI.searchAccess(activeFilters, { page: activePage, limit: activeLimit });
          break;
        case 'visitors':
          result = await searchAPI.searchVisitors(activeFilters, { page: activePage, limit: activeLimit });
          break;
        default:
          throw new Error(`Tipo de búsqueda desconocido: ${searchType}`);
      }
      
      setResults(result);
      setPagination(prev => ({ ...prev, page: activePage }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error en la búsqueda');
      console.error('Error en búsqueda:', err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const changePage = useCallback((newPage) => {
    // Usar los filtros actuales del ref
    performSearch(filtersRef.current, newPage);
  }, [performSearch]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination({ page: 1, limit: 50 });
    setResults(null);
    setError(null);
    filtersRef.current = {};
    paginationRef.current = { page: 1, limit: 50 };
  }, []);

  return {
    results,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    performSearch,
    changePage,
    clearFilters
  };
};




