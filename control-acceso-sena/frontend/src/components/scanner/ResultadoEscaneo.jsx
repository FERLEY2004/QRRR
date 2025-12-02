// ResultadoEscaneo - Componente que muestra información combinada QR + BD
import React from 'react';

const DatosAprendiz = ({ datos }) => {
  if (!datos) return null;

  return (
    <div className="datos-aprendiz space-y-2">
      {datos.ficha && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Ficha:</span>
          <span className="text-gray-900">{datos.ficha}</span>
        </div>
      )}
      {datos.programa_formacion && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Programa:</span>
          <span className="text-gray-900">{datos.programa_formacion}</span>
        </div>
      )}
      {datos.ambiente_asignado && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Ambiente:</span>
          <span className="text-gray-900">{datos.ambiente_asignado}</span>
        </div>
      )}
      {datos.jornada && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Jornada:</span>
          <span className="text-gray-900 capitalize">{datos.jornada}</span>
        </div>
      )}
    </div>
  );
};

const DatosInstructor = ({ datos }) => {
  if (!datos) return null;

  return (
    <div className="datos-instructor space-y-3">
      {datos.ambientes_clase && datos.ambientes_clase.length > 0 && (
        <div>
          <span className="font-semibold text-gray-700 block mb-2">Ambientes de Clase:</span>
          <ul className="list-disc list-inside space-y-1">
            {datos.ambientes_clase.map((amb, idx) => (
              <li key={idx} className="text-gray-900">
                {amb.bloque} - {amb.nombre}
                {amb.horario && (
                  <span className="text-sm text-gray-600 ml-2">
                    ({Object.entries(amb.horario).map(([dia, horas]) => `${dia}: ${horas}`).join(', ')})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {datos.fichas_atiende && datos.fichas_atiende.length > 0 && (
        <div>
          <span className="font-semibold text-gray-700 block mb-2">Fichas que Atiende:</span>
          <div className="flex flex-wrap gap-2">
            {datos.fichas_atiende.map((ficha, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                {ficha}
              </span>
            ))}
          </div>
        </div>
      )}
      {datos.areas_formacion && datos.areas_formacion.length > 0 && (
        <div>
          <span className="font-semibold text-gray-700 block mb-2">Áreas de Formación:</span>
          <div className="flex flex-wrap gap-2">
            {datos.areas_formacion.map((area, idx) => (
              <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DatosAdministrativo = ({ datos }) => {
  if (!datos) return null;

  return (
    <div className="datos-administrativo space-y-2">
      {datos.ambiente_trabajo && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Ambiente:</span>
          <span className="text-gray-900">{datos.ambiente_trabajo}</span>
        </div>
      )}
      {datos.dependencia && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Dependencia:</span>
          <span className="text-gray-900">{datos.dependencia}</span>
        </div>
      )}
      {datos.horario_oficina && (
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Horario:</span>
          <span className="text-gray-900">{datos.horario_oficina}</span>
        </div>
      )}
    </div>
  );
};

const ResultadoEscaneo = ({ datosCarnet, datosInstitucionales, accesoPermitido, motivo_bloqueo, action }) => {
  if (!datosCarnet) return null;

  return (
    <div className={`resultado-escaneo rounded-lg shadow-lg p-6 mb-4 ${
      accesoPermitido 
        ? 'bg-green-50 border-2 border-green-500' 
        : 'bg-red-50 border-2 border-red-500'
    }`}>
      {/* Información del Carnet */}
      <div className="seccion-carnet mb-6 pb-4 border-b border-gray-300">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📇</span>
          Datos del Carnet
        </h3>
        <div className="datos-carnet grid grid-cols-2 gap-3">
          <div>
            <span className="font-semibold text-gray-700">Documento:</span>
            <span className="ml-2 text-gray-900">{datosCarnet.documento}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Nombre:</span>
            <span className="ml-2 text-gray-900">{datosCarnet.nombre_completo}</span>
          </div>
          {datosCarnet.rh && (
            <div>
              <span className="font-semibold text-gray-700">RH:</span>
              <span className="ml-2 text-gray-900">{datosCarnet.rh}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-gray-700">Rol:</span>
            <span className="ml-2 text-gray-900 capitalize">{datosCarnet.rol}</span>
          </div>
        </div>
      </div>

      {/* Información Institucional */}
      {datosInstitucionales && (
        <div className="seccion-institucional mb-6 pb-4 border-b border-gray-300">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🏫</span>
            Información Institucional
          </h3>
          {datosCarnet.rol === 'aprendiz' && (
            <DatosAprendiz datos={datosInstitucionales} />
          )}
          {datosCarnet.rol === 'instructor' && (
            <DatosInstructor datos={datosInstitucionales} />
          )}
          {datosCarnet.rol === 'administrativo' && (
            <DatosAdministrativo datos={datosInstitucionales} />
          )}
        </div>
      )}

      {/* Estado de Acceso */}
      <div className="estado-acceso text-center">
        {accesoPermitido ? (
          <div className="acceso-ok">
            <div className="text-6xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-700 mb-2">
              ACCESO PERMITIDO
            </div>
            {action && (
              <div className="text-lg text-green-600 capitalize">
                {action === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}
              </div>
            )}
          </div>
        ) : (
          <div className="acceso-denegado">
            <div className="text-6xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-700 mb-2">
              ACCESO DENEGADO
            </div>
            {motivo_bloqueo && (
              <div className="text-lg text-red-600 mt-2">
                {motivo_bloqueo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadoEscaneo;










