# 📥 Sistema de Importación Masiva Actualizado

## ✅ Campos Implementados

### Campos Base (Obligatorios)
- ✅ `documento` - Documento único
- ✅ `nombres` - Nombres
- ✅ `apellidos` - Apellidos
- ✅ `email` - Email
- ✅ `rol` - Rol (aprendiz, instructor, administrativo)
- ✅ `tipo_documento` - Tipo de documento
- ✅ `estado` - Estado (activo, inactivo, suspendido)

### Campos Comunes (Opcionales)
- ✅ `rh` - Grupo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
- ✅ `telefono` - Teléfono

### Campos para APRENDICES
- ✅ `programa_formacion` - Programa de formación
- ✅ `ficha` - Código de ficha
- ✅ `jornada` - Jornada (diurna, nocturna, mixta)
- ✅ `ambiente_asignado` - Ambiente asignado
- ✅ `fecha_inicio_formacion` - Fecha inicio formación
- ✅ `fecha_fin_formacion` - Fecha fin formación

### Campos para INSTRUCTORES
- ✅ `ambientes_clase` - Ambientes de clase (separados por comas)
- ✅ `fichas_atiende` - Fichas que atiende (separadas por comas)
- ✅ `areas_formacion` - Áreas de formación (separadas por comas)
- ✅ `horarios_clase` - Horarios de clase
- ✅ `tipo_contrato` - Tipo de contrato (planta, contrato, catedra)

### Campos para ADMINISTRATIVOS
- ✅ `ambiente_trabajo` - Ambiente de trabajo
- ✅ `dependencia` - Dependencia
- ✅ `horario_oficina` - Horario de oficina
- ✅ `cargo` - Cargo

---

## 🗃️ Actualizaciones en Base de Datos

### Script SQL: `importSchemaUpdate.sql`

```sql
-- Agregar campos a Personas
ALTER TABLE Personas 
ADD COLUMN rh VARCHAR(10),
ADD COLUMN fecha_inicio_formacion DATE,
ADD COLUMN fecha_fin_formacion DATE,
ADD COLUMN cargo VARCHAR(100),
ADD COLUMN tipo_contrato ENUM('planta', 'contrato', 'catedra');
```

---

## 🔧 Backend Actualizado

### Validador de Datos (`dataValidator.js`)

✅ Validación de campos por rol:
- **Aprendices**: ficha, programa_formacion, jornada, fechas
- **Instructores**: tipo_contrato, ambientes_clase, fichas_atiende
- **Administrativos**: cargo, ambiente_trabajo, dependencia
- **Todos**: Validación de RH (grupo sanguíneo)

### Procesador por Lotes (`BatchProcessor.js`)

✅ Procesamiento mejorado:
- Creación automática de fichas si no existen
- Asignación de ambientes según rol
- Procesamiento de múltiples ambientes para instructores
- Manejo de arrays separados por comas

**Nuevo método**: `processRoleSpecificData()`
- Asigna ambientes a aprendices
- Asigna múltiples ambientes a instructores
- Asigna ambiente de trabajo a administrativos

---

## 🎨 Frontend Actualizado

### Componente de Mapeo (`MappingStep.jsx`)

✅ Interfaz mejorada:
- Campos organizados por categorías
- Colores diferenciados por rol:
  - 🔵 Azul para Aprendices
  - 🟣 Púrpura para Instructores
  - 🟢 Verde para Administrativos
- Agrupación visual clara

---

## 📊 Estructura del Excel

### Ejemplo de Columnas

| documento | nombres | apellidos | email | rol | rh | programa_formacion | ficha | jornada | ambiente_asignado |
|-----------|---------|-----------|-------|-----|----|-------------------|-------|---------|-------------------|
| 123456789 | María | García López | maria@sena.edu.co | aprendiz | O+ | Tecnología en Desarrollo Software | 2557842 | diurna | Bloque A - Aula 301 |

### Para Instructores

| documento | nombres | apellidos | rol | ambientes_clase | fichas_atiende | tipo_contrato |
|-----------|---------|-----------|-----|-----------------|----------------|---------------|
| 987654321 | Juan | Pérez | instructor | Bloque A-301,Bloque B-205 | 2557842,2557843 | planta |

### Para Administrativos

| documento | nombres | apellidos | rol | ambiente_trabajo | dependencia | cargo |
|-----------|---------|-----------|-----|------------------|-------------|-------|
| 456789123 | Ana | López | administrativo | Oficina de Bienestar | Recursos Humanos | Analista de RH |

---

## 🔄 Flujo de Importación

1. **Cargar Archivo** → Subir Excel/CSV
2. **Mapear Columnas** → Asignar columnas del archivo a campos del sistema
3. **Validar Datos** → Validación automática por rol
4. **Procesar** → Inserción/actualización en BD
5. **Resultados** → Reporte de éxito/errores

---

## ✅ Validaciones Implementadas

### Por Campo:
- ✅ Documento: Formato numérico (6-12 dígitos)
- ✅ Email: Formato válido
- ✅ RH: Valores permitidos (A+, A-, B+, B-, AB+, AB-, O+, O-)
- ✅ Ficha: Formato numérico (6-8 dígitos)
- ✅ Jornada: Valores permitidos (diurna, nocturna, mixta)
- ✅ Tipo Contrato: Valores permitidos (planta, contrato, catedra)
- ✅ Fechas: Formato válido (YYYY-MM-DD)

### Por Rol:
- ✅ Aprendices: Validación de ficha, programa, jornada
- ✅ Instructores: Validación de ambientes y fichas (arrays)
- ✅ Administrativos: Validación de ambiente y dependencia

---

## 🚀 Cómo Usar

### 1. Ejecutar Actualización SQL

```sql
SOURCE backend/src/utils/importSchemaUpdate.sql;
```

### 2. Preparar Archivo Excel

- Incluir todas las columnas necesarias según el rol
- Separar múltiples valores por comas (para instructores)
- Formato de fechas: YYYY-MM-DD

### 3. Importar desde el Sistema

1. Ir a **Administración → Importar Datos**
2. Cargar archivo Excel
3. Mapear columnas (los campos están organizados por categoría)
4. Validar datos
5. Ejecutar importación

---

## 📝 Notas Importantes

1. **Fichas**: Se crean automáticamente si no existen
2. **Ambientes**: Se buscan por nombre o código, deben existir en la BD
3. **Arrays**: Valores múltiples separados por comas (ej: "Ambiente1,Ambiente2")
4. **Actualización**: Si el documento ya existe, se actualiza en lugar de insertar
5. **Asignaciones**: Se crean automáticamente según el rol

---

**Fecha de Actualización**: Enero 2024  
**Versión**: 2.0.0  
**Estado**: COMPLETO Y FUNCIONAL










