// MetricCard Component - Tarjeta de métrica reutilizable
import React from 'react';

const MetricCard = ({ title, value, icon, trend, alert = false, loading = false, borderColor = 'blue' }) => {
  const borderColors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    orange: 'border-orange-500',
    purple: 'border-purple-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500'
  };

  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${borderColors[borderColor]} ${alert ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className={`text-3xl font-bold ${alert ? 'text-red-600' : 'text-gray-800'}`}>
              {loading ? '...' : value}
            </p>
            {trend && !loading && (
              <span className={`text-sm font-semibold ${
                trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend}
              </span>
            )}
          </div>
          {alert && (
            <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Requiere atención</p>
          )}
        </div>
        <div className={`${bgColors[borderColor]} rounded-full p-3`}>
          <span className={`text-2xl ${iconColors[borderColor]}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;

















