# Instrucciones para Insertar Programas de Formación

Este documento explica cómo insertar los programas de formación en la base de datos.

## Archivos Disponibles

1. **`insertProgramasFormacion.sql`** - Script SQL para ejecutar directamente en MySQL
2. **`insertProgramasFormacion.js`** - Script JavaScript para ejecutar desde Node.js

## Opción 1: Ejecutar Script SQL (Recomendado)

### Usando MySQL Workbench o MySQL Command Line:

1. Abre MySQL Workbench o tu cliente MySQL preferido
2. Conéctate a la base de datos `control_acceso_sena`
3. Abre el archivo `insertProgramasFormacion.sql`
4. Ejecuta el script completo

### Usando línea de comandos:

```bash
mysql -u tu_usuario -p control_acceso_sena < insertProgramasFormacion.sql
```

## Opción 2: Ejecutar Script JavaScript

### Desde la terminal en el directorio del backend:

```bash
cd control-acceso-sena/backend
node src/utils/insertProgramasFormacion.js
```

### O usando npm script (si está configurado):

```bash
npm run insert-programas
```

## Programas Incluidos

### Programas Técnicos (28 programas)
- Duración: 12 meses
- Incluye programas en:
  - Gestión Administrativa
  - Contabilidad y Finanzas
  - Recursos Humanos
  - Comercio y Ventas
  - Tecnología Multimedia
  - Desarrollo de Software
  - Construcción
  - Mecánica y Mantenimiento
  - Y más...

### Programas Tecnológicos (23 programas)
- Duración: 24 meses
- Incluye programas en:
  - Gestión Empresarial
  - Gestión Financiera
  - Desarrollo de Software
  - Mantenimiento Industrial
  - Biotecnología
  - Logística
  - Y más...

## Características del Script

- ✅ Usa `ON DUPLICATE KEY UPDATE` para evitar duplicados
- ✅ Si un programa ya existe, se actualiza con la información más reciente
- ✅ Todos los programas se insertan con estado 'activo'
- ✅ Códigos únicos generados automáticamente
- ✅ Áreas de conocimiento categorizadas

## Verificación

Después de ejecutar el script, puedes verificar los programas insertados con:

```sql
-- Ver todos los programas
SELECT * FROM Programas_Formacion ORDER BY nivel, nombre_programa;

-- Contar programas por nivel
SELECT nivel, COUNT(*) as total 
FROM Programas_Formacion 
GROUP BY nivel;

-- Ver programas técnicos
SELECT codigo_programa, nombre_programa, area_conocimiento 
FROM Programas_Formacion 
WHERE nivel = 'Técnico' 
ORDER BY nombre_programa;

-- Ver programas tecnológicos
SELECT codigo_programa, nombre_programa, area_conocimiento 
FROM Programas_Formacion 
WHERE nivel = 'Tecnológico' 
ORDER BY nombre_programa;
```

## Notas Importantes

- El script es idempotente: puedes ejecutarlo múltiples veces sin problemas
- Los códigos de programa son únicos y se generan automáticamente
- Si necesitas modificar algún programa, puedes hacerlo directamente en la base de datos o actualizar el script

## Solución de Problemas

### Error: "Table doesn't exist"
Asegúrate de que la tabla `Programas_Formacion` existe. Ejecuta primero el script `catalogSchema.sql` o `schema.sql`.

### Error: "Duplicate entry"
Esto es normal si el programa ya existe. El script actualizará la información existente.

### Error de conexión
Verifica que la base de datos esté corriendo y que las credenciales sean correctas.







