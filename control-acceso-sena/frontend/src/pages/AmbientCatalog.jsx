// AmbientCatalog - Catálogo de ambientes
import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../services/api.js';

const AmbientCatalog = () => {
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    bloque: '',
    estado: 'activo',
    search: ''
  });
  const [selectedAmbient, setSelectedAmbient] = useState(null);
  const [occupation, setOccupation] = useState(null);
  const [loadingOccupation, setLoadingOccupation] = useState(false);

  useEffect(() => {
    loadAmbientes();
  }, [filters]);

  const loadAmbientes = async () => {
    try {
      setLoading(true);
      const result = await catalogAPI.getAllAmbientes(filters);
      if (result.success) {
        setAmbientes(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando ambientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAmbientClick = async (ambient) => {
    setSelectedAmbient(ambient);
    setLoadingOccupation(true);
    try {
      const result = await catalogAPI.getAmbientOccupation(ambient.codigo_ambiente);
      if (result.success) {
        setOccupation(result.data);
      }
    } catch (error) {
      console.error('Error cargando ocupación:', error);
    } finally {
      setLoadingOccupation(false);
    }
  };

  const getTipoColor = (tipo) => {
    const colors = {
      aula: 'bg-blue-100 text-blue-700',
      laboratorio: 'bg-green-100 text-green-700',
      taller: 'bg-orange-100 text-orange-700',
      oficina: 'bg-gray-100 text-gray-700',
      auditorio: 'bg-purple-100 text-purple-700',
      biblioteca: 'bg-yellow-100 text-yellow-700',
      cafeteria: 'bg-pink-100 text-pink-700',
      sala_reuniones: 'bg-indigo-100 text-indigo-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  const getOccupancyColor = (porcentaje) => {
    if (porcentaje >= 90) return 'bg-red-500';
    if (porcentaje >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🏫 Catálogo de Ambientes - CBI Palmira
          </h1>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="aula">Aula</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="taller">Taller</option>
                <option value="oficina">Oficina</option>
                <option value="auditorio">Auditorio</option>
                <option value="biblioteca">Biblioteca</option>
                <option value="cafeteria">Cafetería</option>
                <option value="sala_reuniones">Sala de Reuniones</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bloque
              </label>
              <input
                type="text"
                value={filters.bloque}
                onChange={(e) => handleFilterChange('bloque', e.target.value)}
                placeholder="Ej: Bloque A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Código o nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de ambientes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Cargando ambientes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ambientes.map((ambient) => (
                <div
                  key={ambient.id_ambiente}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleAmbientClick(ambient)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {ambient.codigo_ambiente}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getTipoColor(ambient.tipo_ambiente)}`}>
                      {ambient.tipo_ambiente}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {ambient.nombre_ambiente}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Bloque:</span> {ambient.bloque}
                    </p>
                    <p>
                      <span className="font-medium">Piso:</span> {ambient.piso}
                    </p>
                    <p>
                      <span className="font-medium">Capacidad:</span> {ambient.capacidad} personas
                    </p>
                  </div>
                  {ambient.equipamiento && ambient.equipamiento.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Equipamiento:</p>
                      <div className="flex flex-wrap gap-1">
                        {ambient.equipamiento.slice(0, 3).map((eq, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {eq}
                          </span>
                        ))}
                        {ambient.equipamiento.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{ambient.equipamiento.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && ambientes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron ambientes con los filtros seleccionados.
            </div>
          )}
        </div>

        {/* Panel de ocupación del ambiente seleccionado */}
        {selectedAmbient && occupation && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Ocupación - {selectedAmbient.nombre_ambiente}
              </h2>
              <button
                onClick={() => {
                  setSelectedAmbient(null);
                  setOccupation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingOccupation ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información del ambiente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Capacidad Total</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {occupation.ambiente.capacidad}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Ocupación Actual</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {occupation.ocupacion.actual}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">Disponibilidad</p>
                    <p className="text-2xl font-bold text-green-800">
                      {occupation.ocupacion.disponibilidad}
                    </p>
                  </div>
                </div>

                {/* Barra de ocupación */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Porcentaje de Ocupación
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {occupation.ocupacion.porcentaje}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${getOccupancyColor(occupation.ocupacion.porcentaje)}`}
                      style={{ width: `${Math.min(occupation.ocupacion.porcentaje, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Información del Ambiente</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Código:</span> {occupation.ambiente.codigo}</p>
                      <p><span className="font-medium">Tipo:</span> {occupation.ambiente.tipo}</p>
                      <p><span className="font-medium">Bloque:</span> {occupation.ambiente.bloque}</p>
                      <p><span className="font-medium">Piso:</span> {occupation.ambiente.piso}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Equipamiento</h3>
                    {occupation.ambiente.equipamiento && occupation.ambiente.equipamiento.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {occupation.ambiente.equipamiento.map((eq, idx) => (
                          <li key={idx}>{eq}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No hay equipamiento registrado</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbientCatalog;


