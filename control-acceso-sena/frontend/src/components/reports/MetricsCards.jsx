// MetricsCards - Tarjetas de métricas
import React from 'react';
import MetricCard from '../MetricCard.jsx';

const MetricsCards = ({ data, metrics = [] }) => {
  if (!data || !metrics.length) return null;

  const getMetricValue = (metric) => {
    switch (metric.key) {
      case 'total':
        return data.total || data.data?.length || 0;
      case 'activos':
        return data.data?.filter(item => item.estado === 'activo').length || 0;
      case 'inactivos':
        return data.data?.filter(item => item.estado === 'inactivo').length || 0;
      case 'entradas':
        return data.data?.reduce((sum, item) => sum + (item.entradas || 0), 0) || 0;
      case 'salidas':
        return data.data?.reduce((sum, item) => sum + (item.salidas || 0), 0) || 0;
      default:
        return data[metric.key] || 0;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, idx) => (
        <MetricCard
          key={idx}
          title={metric.title}
          value={getMetricValue(metric)}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
};

export default MetricsCards;










