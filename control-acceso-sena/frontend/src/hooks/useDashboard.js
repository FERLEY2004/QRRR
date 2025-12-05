// useDashboard Hook - Hook personalizado para dashboard
import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, accessAPI, reportsAPI } from '../services/api';

const useDashboard = () => {
  const [data, setData] = useState({
    metrics: null,
    people: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Cargar todas las datos en paralelo usando Promise.allSettled para que no falle completamente si una falla
      // Usar reportsAPI.getCurrentPeople() que utiliza ReportService
      const results = await Promise.allSettled([
        dashboardAPI.getMetrics().catch(err => {
          console.error('Error fetching metrics:', err);
          return { success: false, data: null };
        }),
        reportsAPI.getCurrentPeople().catch(err => {
          console.error('Error fetching people from reports:', err);
          // Fallback al método antiguo si falla
          return accessAPI.getCurrentPeople().catch(altErr => {
            console.error('Error fetching people (fallback):', altErr);
            return { success: false, people: [] };
          });
        }),
        dashboardAPI.getAlerts({ limit: 100 }).catch(err => {
          console.error('Error fetching alerts:', err);
          return { success: false, data: [] };
        })
      ]);

      // Procesar resultados, usando valores por defecto si fallaron
      const metricsResponse = results[0].status === 'fulfilled' ? results[0].value : { success: false, data: null };
      const peopleResponse = results[1].status === 'fulfilled' ? results[1].value : { success: false, people: [], data: [] };
      const alertsResponse = results[2].status === 'fulfilled' ? results[2].value : { success: false, data: [] };

      // Normalizar datos de personas: mapear nombre_completo a nombre para compatibilidad
      let normalizedPeople = [];
      if (peopleResponse.success) {
        const peopleData = peopleResponse.people || peopleResponse.data || [];
        normalizedPeople = peopleData.map(person => ({
          ...person,
          // Si viene nombre_completo pero no nombre, usar nombre_completo como nombre
          nombre: person.nombre || person.nombre_completo || 'Sin nombre',
          nombre_completo: person.nombre_completo || person.nombre || 'Sin nombre'
        }));
      }

      setData({
        metrics: metricsResponse.success ? metricsResponse.data : null,
        people: normalizedPeople,
        alerts: alertsResponse.success ? (alertsResponse.data || []) : []
      });
      
      console.log('📊 [FRONTEND] Datos finales del dashboard:', {
        metrics: metricsResponse.success ? 'OK' : 'ERROR',
        people_count: normalizedPeople.length,
        alerts_count: alertsResponse.success ? (alertsResponse.data?.length || 0) : 0
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial
    fetchData();

    // Polling cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh: fetchData
  };
};

export default useDashboard;











