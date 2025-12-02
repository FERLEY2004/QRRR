// CurrentPeopleList Component - Lista de personas dentro
import React, { useState } from 'react';

const CurrentPeopleList = ({ people = [], loading = false, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredPeople = people.filter(person => {
    const nombre = person.nombre || person.nombre_completo || 'Sin nombre';
    const matchesSearch = 
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.documento?.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || person.rol === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const roles = [...new Set(people.map(p => p.rol).filter(Boolean))];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Personas Dentro</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {roles.length > 0 && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos los roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Actualizar
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>{searchTerm || filterRole !== 'all' ? 'No se encontraron resultados' : 'No hay personas dentro del establecimiento'}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPeople.map((person) => (
            <div
              key={person.id || person.id_persona}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              {person.foto ? (
                <img
                  src={person.foto}
                  alt={person.nombre || person.nombre_completo || 'Persona'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                  <span className="text-lg font-bold text-blue-600">
                    {(person.nombre || person.nombre_completo || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {person.nombre || person.nombre_completo || 'Sin nombre'}
                </p>
                <p className="text-sm text-gray-600">
                  {person.documento} • {person.rol || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  Entrada: {formatTime(person.fecha_entrada)}
                </p>
              </div>
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                DENTRO
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredPeople.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Mostrando {filteredPeople.length} de {people.length} personas
        </div>
      )}
    </div>
  );
};

export default CurrentPeopleList;















