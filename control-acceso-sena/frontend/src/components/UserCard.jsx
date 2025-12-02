// User Card Component
import React from 'react';

const UserCard = ({ person, action }) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-4">
        {person.foto ? (
          <img
            src={person.foto}
            alt={person.nombre}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
            <span className="text-2xl font-bold text-blue-600">
              {person.nombre?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{person.nombre}</h3>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Documento:</span> {person.documento}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Rol:</span> {person.rol || 'N/A'}
          </p>
          {person.tipo_documento && (
            <p className="text-xs text-gray-500 mt-1">
              Tipo: {person.tipo_documento}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          action === 'entrada' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {action === 'entrada' ? '✓ ENTRADA' : '← SALIDA'}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
