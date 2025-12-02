// Hook para manejar reportes
import { useState, useEffect, useCallback, useRef } from 'react';
import { reportsAPI } from '../services/api.js';

export const useReports = (reportType, initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const filtersRef = useRef(initialFilters);
  const reportTypeRef = useRef(reportType);

  const loadReport = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      const filtersToUse = currentFilters || filtersRef.current;
      
      switch (reportTypeRef.current) {
        case 'current-people':
          result = await reportsAPI.getCurrentPeople(filtersToUse);
          break;
        case 'predictive-flows':
          result = await reportsAPI.getPredictiveFlows(filtersToUse);
          break;
        case 'access-history':
          result = await reportsAPI.getAccessHistory(filtersToUse);
          break;
        default:
          throw new Error(`Tipo de reporte desconocido: ${reportTypeRef.current}`);
      }
      
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar reporte');
      console.error('Error cargando reporte:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reportTypeRef.current = reportType;
    filtersRef.current = filters;
    loadReport();
  }, [reportType, filters, loadReport]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    loadReport(filters);
  }, [loadReport, filters]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    loadReport
  };
};







