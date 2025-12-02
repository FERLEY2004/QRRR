// PerformanceOverlay - Overlay de estadísticas de rendimiento
import React from 'react';

const PerformanceOverlay = ({ stats, isVisible = false, onToggle }) => {
  if (!stats) return null;

  return (
    <div className={`fixed top-4 right-4 z-40 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-black bg-opacity-75 text-white rounded-lg p-4 shadow-lg min-w-[250px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Rendimiento</h3>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2 text-xs">
          {/* Escaneos totales */}
          <div className="flex justify-between">
            <span className="text-gray-300">Total escaneos:</span>
            <span className="font-semibold">{stats.totalScans}</span>
          </div>

          {/* Tasa de éxito */}
          <div className="flex justify-between">
            <span className="text-gray-300">Tasa de éxito:</span>
            <span className={`font-semibold ${stats.successRate >= 90 ? 'text-green-400' : stats.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.successRate.toFixed(1)}%
            </span>
          </div>

          {/* Tiempo promedio */}
          <div className="flex justify-between">
            <span className="text-gray-300">Tiempo promedio:</span>
            <span className="font-semibold">{Math.round(stats.averageScanTime)}ms</span>
          </div>

          {/* Escaneos por minuto */}
          <div className="flex justify-between">
            <span className="text-gray-300">Escaneos/min:</span>
            <span className="font-semibold">{stats.scansPerMinute.toFixed(1)}</span>
          </div>

          {/* Tiempo activo */}
          <div className="flex justify-between">
            <span className="text-gray-300">Tiempo activo:</span>
            <span className="font-semibold">{stats.uptime}</span>
          </div>

          {/* Barra de progreso de éxito */}
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.successRate >= 90 ? 'bg-green-500' : 
                  stats.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Tiempo mínimo y máximo */}
          {stats.minScanTime > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Min:</span>
                <span className="text-green-400">{Math.round(stats.minScanTime)}ms</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Max:</span>
                <span className="text-red-400">{Math.round(stats.maxScanTime)}ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverlay;
















