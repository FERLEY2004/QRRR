# 📊 Documentación API de Reportes y Consultas

## Endpoints de Reportes

### HU9 - Personas Actualmente Dentro
```
GET /api/reports/current-people
```

**Query Parameters:**
- `rol` (opcional): Filtrar por rol (aprendiz, instructor, administrativo, visitante)
- `zona` (opcional): Filtrar por zona

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "documento": "123456789",
      "tipo_documento": "CC",
      "nombre_completo": "Juan Pérez García",
      "rol": "Aprendiz",
      "zona": "Bloque Principal",
      "fecha_entrada": "2024-01-15T08:30:00Z",
      "tiempo_dentro": "02:15:30",
      "tiempo_segundos": 8130
    }
  ],
  "total": 45,
  "timestamp": "2024-01-15T10:45:00Z"
}
```

### HU11 - Estadísticas por Rol
```
GET /api/reports/access-by-role?fecha=2024-01-15&fecha_hasta=2024-01-15
```

**Query Parameters:**
- `fecha` (opcional): Fecha desde (YYYY-MM-DD)
- `fecha_hasta` (opcional): Fecha hasta (YYYY-MM-DD)
- `rol` (opcional): Filtrar por rol específico

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "rol": "Aprendiz",
      "total_accesos": 125,
      "entradas": 67,
      "salidas": 58,
      "actualmente_dentro": 9,
      "tiempo_promedio_minutos": 245,
      "fuera_horario": 3
    }
  ],
  "periodo": {
    "fecha_desde": "2024-01-15",
    "fecha_hasta": "2024-01-15"
  },
  "generated_at": "2024-01-15T23:59:00Z"
}
```

### HU27 - Reportes Semanales
```
GET /api/reports/weekly-access?fecha_desde=2024-01-08&fecha_hasta=2024-01-15
```

**Query Parameters:**
- `fecha_desde` (opcional): Fecha inicio (YYYY-MM-DD)
- `fecha_hasta` (opcional): Fecha fin (YYYY-MM-DD)
- `rol` (opcional): Filtrar por rol

### HU20 - Ocupación por Zonas
```
GET /api/reports/zone-occupation?zona=Área de Formación
```

**Query Parameters:**
- `zona` (opcional): Filtrar por zona específica

### HU7 - Flujos Predictivos
```
GET /api/reports/predictive-flows?fecha_desde=2024-01-08&fecha_hasta=2024-01-15&dias=7
```

### Historial de Accesos
```
GET /api/reports/access-history?fecha_desde=2024-01-01&fecha_hasta=2024-01-15&page=1&limit=50
```

## Endpoints de Búsqueda

### HU26 - Búsqueda de Usuarios
```
GET /api/search/users?q=maria&role=aprendiz&page=1&limit=50
```

**Query Parameters:**
- `q` o `query`: Búsqueda general (documento, nombre, email)
- `documento`: Filtrar por documento
- `nombre`: Filtrar por nombre
- `role` o `rol`: Filtrar por rol
- `estado`: Filtrar por estado
- `email`: Filtrar por email
- `page`: Página (default: 1)
- `limit`: Resultados por página (default: 50)

### HU12 - Búsqueda de Accesos
```
GET /api/search/access?documento=123456789&fecha=2024-01-15
```

### HU33 - Búsqueda de Visitantes
```
GET /api/search/visitors?empresa=nombre&estado=activo
```

## Endpoints de Exportación

### HU8 - Exportar a Excel
```
POST /api/export/excel
Content-Type: application/json

{
  "reportType": "current-people",
  "filters": {
    "rol": "aprendiz"
  }
}
```

**Tipos de reporte disponibles:**
- `current-people`
- `access-by-role`
- `weekly-access`
- `zones`
- `access-history`
- `users`

### HU8 - Exportar a PDF
```
POST /api/export/pdf
Content-Type: application/json

{
  "reportType": "current-people",
  "filters": {},
  "data": null  // Opcional: datos pre-cargados
}
```

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token en el header:
```
Authorization: Bearer <token>
```

Algunos endpoints requieren rol `admin`:
- `/api/export/*` - Exportación
- `/api/reports/daily`, `/api/reports/weekly`, etc. - Reportes administrativos

## Ejemplos de Uso

### Obtener personas dentro
```javascript
const response = await fetch('/api/reports/current-people?rol=aprendiz', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Buscar usuarios
```javascript
const response = await fetch('/api/search/users?q=maria&role=aprendiz&page=1&limit=25', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const results = await response.json();
```

### Exportar a Excel
```javascript
const response = await fetch('/api/export/excel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reportType: 'access-by-role',
    filters: { fecha: '2024-01-15' }
  })
});
const blob = await response.blob();
// Descargar archivo...
```










