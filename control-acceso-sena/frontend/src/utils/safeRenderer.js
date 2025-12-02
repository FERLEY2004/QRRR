// Safe Renderer Utilities - Utilidades para renderizar datos de forma segura
// Previene errores de "Objects are not valid as a React child"

/**
 * Convierte cualquier valor a string de forma segura para renderizar en React
 * @param {any} value - Valor a convertir
 * @param {string} fallback - Valor por defecto si el valor no es válido
 * @returns {string} - String seguro para renderizar
 */
export const renderSafe = (value, fallback = 'N/A') => {
  // Valores nulos o undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Si es un objeto (pero no array ni Date), no renderizar directamente
  if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    console.warn('Intento de renderizar objeto directamente:', value);
    return fallback;
  }

  // Si es array, convertir a string
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(item => renderSafe(item, '')).join(', ') : fallback;
  }

  // Si es Date, formatear
  if (value instanceof Date) {
    return value.toLocaleString();
  }

  // Para otros tipos, convertir a string
  return String(value);
};

/**
 * Obtiene un campo específico de un objeto de forma segura
 * @param {object} obj - Objeto del cual obtener el campo
 * @param {string} field - Nombre del campo
 * @param {string} fallback - Valor por defecto
 * @returns {string} - Valor del campo convertido a string
 */
export const getSafeField = (obj, field, fallback = 'N/A') => {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  const value = obj[field];
  return renderSafe(value, fallback);
};

/**
 * Renderiza el nombre completo de un usuario
 * @param {object} user - Objeto usuario
 * @returns {string} - Nombre completo
 */
export const renderFullName = (user) => {
  if (!user || typeof user !== 'object') {
    return 'Nombre no disponible';
  }

  const nombres = getSafeField(user, 'nombres', '');
  const apellidos = getSafeField(user, 'apellidos', '');

  const fullName = `${nombres} ${apellidos}`.trim();
  return fullName || 'Nombre no disponible';
};

/**
 * Renderiza datos de usuario de forma segura
 * @param {object} user - Objeto usuario
 * @param {boolean} showAllFields - Mostrar todos los campos
 * @returns {object} - Objeto con campos renderizados
 */
export const renderUserData = (user, showAllFields = false) => {
  if (!user || typeof user !== 'object') {
    return {
      documento: 'N/A',
      nombre: 'Usuario no válido',
      email: 'N/A',
      rol: 'N/A'
    };
  }

  const basicFields = {
    documento: getSafeField(user, 'documento'),
    nombre: renderFullName(user),
    rol: getSafeField(user, 'rol')
  };

  if (showAllFields) {
    return {
      ...basicFields,
      email: getSafeField(user, 'email'),
      programa: getSafeField(user, 'programa'),
      ficha: getSafeField(user, 'ficha'),
      tipo_documento: getSafeField(user, 'tipo_documento')
    };
  }

  return basicFields;
};

/**
 * Renderiza un error de validación de forma segura
 * @param {object} error - Objeto error
 * @returns {object} - Objeto con campos renderizados
 */
export const renderError = (error) => {
  if (!error || typeof error !== 'object') {
    return {
      row: 'N/A',
      message: 'Error desconocido',
      field: 'N/A'
    };
  }

  // Manejar el caso donde error.row podría ser un objeto de usuario completo
  let rowNumber = 'N/A';
  if (error.row !== null && error.row !== undefined) {
    // Si error.row es un número, usarlo directamente
    if (typeof error.row === 'number') {
      rowNumber = String(error.row);
    }
    // Si error.row es un objeto (usuario completo), intentar extraer el número de fila
    else if (typeof error.row === 'object') {
      // Buscar si hay un campo 'row' o 'rowIndex' en el objeto
      if (error.row.row !== undefined) {
        rowNumber = renderSafe(error.row.row, 'N/A');
      } else if (error.rowIndex !== undefined) {
        rowNumber = renderSafe(error.rowIndex, 'N/A');
      } else {
        // Si no hay número de fila, usar el documento como identificador
        const documento = getSafeField(error.row, 'documento', '');
        rowNumber = documento !== 'N/A' ? `Doc: ${documento}` : 'N/A';
      }
    }
    // Si es string, usarlo directamente
    else {
      rowNumber = String(error.row);
    }
  }

  return {
    row: rowNumber,
    message: renderSafe(error.message, 'Error desconocido'),
    field: renderSafe(error.field, 'N/A')
  };
};

