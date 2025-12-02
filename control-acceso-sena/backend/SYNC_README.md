# Sistema de Sincronización Excel -> Base de Datos

Sistema completo para sincronizar datos del archivo Excel "Reporte de Juicios Evaluativos" con la base de datos del sistema de control de acceso.

## 📋 Requerimientos

- Node.js 18+
- MySQL 8.0+
- Archivo Excel con las columnas requeridas
- Variables de entorno configuradas (`.env`)

## 🚀 Instalación

1. Asegúrate de tener todas las dependencias instaladas:
```bash
npm install
```

2. Configura las variables de entorno en el archivo `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=control_acceso_sena
```

3. Coloca el archivo Excel en el directorio `uploads/`:
   - Nombre esperado: `Reporte de Juicios Evaluativos_3066232 (1).xlsx`
   - O especifica la ruta completa al ejecutar el script

## 📊 Formato del Archivo Excel

El archivo Excel debe contener las siguientes columnas:

- **Número de Documento**: Documento de identidad de la persona
- **Nombre**: Nombre(s) de la persona
- **Apellidos**: Apellido(s) de la persona
- **Estado**: Estado actual (se traduce automáticamente)
  - `EN FORMACION` → `Activo`
  - `CANCELADO` → `Inactivo`

### Nota sobre Columnas

El sistema detecta automáticamente las columnas aunque tengan nombres ligeramente diferentes:
- Documento: "Número de Documento", "Documento", "Número Documento", etc.
- Nombre: "Nombre", "Nombres"
- Apellidos: "Apellidos", "Apellido"
- Estado: "Estado", "Estado Actual"

## 🔄 Uso

### Opción 1: Usando npm script (recomendado)

```bash
npm run sync-excel
```

Esto buscará el archivo en: `backend/uploads/Reporte de Juicios Evaluativos_3066232 (1).xlsx`

### Opción 2: Especificar ruta del archivo

```bash
npm run sync-excel "ruta/completa/al/archivo.xlsx"
```

### Opción 3: Usando el script ejecutable directo

```bash
node sync.js
```

O con ruta específica:

```bash
node sync.js "ruta/completa/al/archivo.xlsx"
```

## 📝 Lógica de Sincronización

El sistema procesa cada registro del Excel y lo sincroniza con la base de datos según los siguientes casos:

### CASO 1: Usuario ACTIVO en Excel pero NO en BD
- **Acción**: INSERTAR nuevo usuario en BD
- **Estado en BD**: `Activo`
- **Permiso**: `ACCESO PERMITIDO`

### CASO 2: Usuario ACTIVO en Excel y ACTIVO en BD
- **Acción**: MANTENER estado actual
- **Permiso**: `ACCESO PERMITIDO`

### CASO 3: Usuario INACTIVO en Excel pero ACTIVO en BD
- **Acción**: ACTUALIZAR estado a `Inactivo` en BD
- **Acción**: INHABILITAR acceso en el aplicativo (cerrar accesos activos)
- **Permiso**: `ACCESO DENEGADO`

### CASO 4: Usuario INACTIVO en Excel e INACTIVO en BD
- **Acción**: MANTENER estado actual
- **Permiso**: `ACCESO DENEGADO`

### CASO ADICIONAL: Usuario ACTIVO en Excel pero INACTIVO en BD
- **Acción**: REACTIVAR usuario (actualizar estado a `Activo`)
- **Permiso**: `ACCESO PERMITIDO`

## 📁 Archivos Generados

Después de ejecutar la sincronización, se generan los siguientes archivos en el directorio `backend/reports/`:

1. **Log_Sincronizacion_[fecha].txt**
   - Log detallado en formato texto con todas las operaciones realizadas
   - Incluye resumen y detalles de cada caso

2. **Reporte_Cambios_[fecha].csv**
   - Reporte en formato CSV con todos los cambios realizados
   - Incluye: Tipo, Documento, Nombre, Acción, Estados, Permiso, Errores

3. **Control_Acceso_Sincronizado_[fecha].xlsx**
   - Archivo Excel con múltiples hojas:
     - **Resumen**: Estadísticas generales
     - **Nuevos Usuarios**: Lista de usuarios agregados
     - **Usuarios Inhabilitados**: Lista de usuarios desactivados
     - **Datos Sincronizados**: Todos los registros procesados con su acción

## 🔍 Procesamiento de Datos

### Eliminación de Duplicados

El sistema elimina automáticamente los registros duplicados basándose en el número de documento, manteniendo solo el registro más reciente.

### Validación

- Se validan que los campos requeridos (documento, nombre, apellidos) no estén vacíos
- Se traducen los estados del Excel al formato de la BD
- Se registran errores para filas con problemas

## ⚠️ Consideraciones Importantes

1. **Backup**: Se recomienda hacer un backup de la base de datos antes de ejecutar la sincronización
2. **Accesos Activos**: Los usuarios que son inhabilitados tendrán sus accesos activos cerrados automáticamente
3. **Rol por Defecto**: Los nuevos usuarios se crean con el rol "aprendiz"
4. **Tipo de Documento**: Por defecto se usa "CC" (Cédula de Ciudadanía)

## 🐛 Solución de Problemas

### Error: "El archivo no existe"
- Verifica que el archivo esté en el directorio `uploads/`
- O proporciona la ruta completa al archivo como argumento

### Error: "Error de conexión a BD"
- Verifica las credenciales en el archivo `.env`
- Asegúrate de que MySQL esté corriendo
- Verifica que la base de datos `control_acceso_sena` exista

### Error: "No se pudieron detectar todas las columnas requeridas"
- Verifica que el Excel tenga las columnas: Documento, Nombre, Apellidos, Estado
- Los nombres pueden variar ligeramente, pero deben ser reconocibles

## 📊 Ejemplo de Salida

```
================================================================================
                    LOG DE SINCRONIZACIÓN - CONTROL DE ACCESO SENA
================================================================================

FECHA/HORA DE INICIO: 15/01/2024 10:30:00
FECHA/HORA DE FIN:    15/01/2024 10:32:15
DURACIÓN:             135 segundos

================================================================================
                              RESUMEN GENERAL
================================================================================

Total registros procesados:     1500
Nuevos usuarios agregados:      250
Usuarios reactivados:           15
Usuarios inhabilitados:         80
Usuarios mantenidos:            1150
Errores encontrados:            5
```

## 🔐 Seguridad

- El sistema registra todas las operaciones en logs
- Los cambios en la base de datos son auditables
- Se generan reportes detallados de todos los cambios realizados

## 📞 Soporte

Para problemas o preguntas sobre el sistema de sincronización, revisa:
1. Los logs generados en `backend/reports/`
2. La consola donde se ejecutó el script
3. Los mensajes de error específicos

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2024










