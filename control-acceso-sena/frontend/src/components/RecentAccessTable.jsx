// RecentAccessTable Component - Tabla de accesos recientes
import React, { useState } from 'react';

const RecentAccessTable = ({ accesses = [], loading = false }) => {
  const [filterType, setFilterType] = useState('all');

  // Debug: Log de accesos recibidos
  React.useEffect(() => {
    console.log('🔍 [RecentAccessTable] Accesos recibidos:', {
      total: accesses.length,
      primer_acceso: accesses[0] || null,
      muestra: accesses.slice(0, 3).map(a => ({
        persona_nombre: a.persona_nombre,
        documento: a.documento,
        tipo: a.tipo,
        fecha_evento: a.fecha_evento,
        fecha_entrada: a.fecha_entrada
      }))
    });
  }, [accesses]);

  const filteredAccesses = accesses.filter(access => {
    if (filterType === 'all') return true;
    const tipoNormalizado = (access.tipo || '').toLowerCase();
    if (filterType === 'entrada') {
      return tipoNormalizado === 'entrada';
    }
    if (filterType === 'salida') {
      return tipoNormalizado === 'salida';
    }
    return true;
  });

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-CO', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Accesos Recientes</h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Todos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando accesos...</p>
        </div>
      ) : filteredAccesses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-2">
            {accesses.length === 0 
              ? 'No hay accesos registrados' 
              : filterType === 'all' 
                ? 'No hay accesos que mostrar'
                : `No hay accesos de tipo "${filterType === 'entrada' ? 'entrada' : 'salida'}"`
            }
          </p>
          {accesses.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Los accesos aparecerán aquí después de que se escaneen códigos QR
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccesses.map((access, index) => {
                // Normalizar datos del acceso para asegurar que todos los campos estén presentes
                const personaNombre = access.persona_nombre || access.nombre || 'Sin nombre';
                const documento = access.documento || 'N/A';
                const tipo = (access.tipo || 'entrada').toLowerCase();
                const fechaEvento = access.fecha_evento || access.fecha_entrada || access.fecha_hora || null;
                
                return (
                <tr key={`${access.id_registro || access.id || index}-${tipo}-${fechaEvento || index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{personaNombre}</p>
                      <p className="text-xs text-gray-500">{documento}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tipo === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tipo === 'entrada' ? '✓ ENTRADA' : '← SALIDA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(fechaEvento)}
                    {access.fuera_horario && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">⚠️</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {access.fuera_horario ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Fuera de horario
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {filteredAccesses.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Mostrando {filteredAccesses.length} de {accesses.length} accesos
        </div>
      )}
    </div>
  );
};

export default RecentAccessTable;






