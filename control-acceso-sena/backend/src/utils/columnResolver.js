import pool from '../utils/dbPool.js';

let registrosIdFieldCache = null;

/**
 * Devuelve dinámicamente el nombre de columna que almacena el identificador
 * del registro de ingreso/salida. Puede llamarse `id_registro` o
 * `id_registro_entrada_salida` según la base de datos.
 */
export async function getRegistroIdField() {
  if (registrosIdFieldCache) {
    return registrosIdFieldCache;
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'registros_entrada_salida'
       AND COLUMN_NAME IN ('id_registro', 'id_registro_entrada_salida')`
  );

  const columns = rows.map((row) => row.COLUMN_NAME);
  if (columns.includes('id_registro_entrada_salida')) {
    registrosIdFieldCache = 'id_registro_entrada_salida';
  } else if (columns.includes('id_registro')) {
    registrosIdFieldCache = 'id_registro';
  } else {
    registrosIdFieldCache = 'id_registro_entrada_salida';
  }

  return registrosIdFieldCache;
}





