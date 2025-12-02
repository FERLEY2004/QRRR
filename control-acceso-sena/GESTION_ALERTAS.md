# 📋 Guía de Gestión de Alertas

Esta guía explica cómo gestionar las alertas del sistema de control de acceso SENA.

## 📌 Índice

1. [Tipos de Alertas](#tipos-de-alertas)
2. [Gestión desde el Frontend](#gestión-desde-el-frontend)
3. [Gestión desde la API](#gestión-desde-la-api)
4. [Verificación en Base de Datos](#verificación-en-base-de-datos)
5. [Crear Alertas Manualmente](#crear-alertas-manualmente)
6. [Scripts de Diagnóstico](#scripts-de-diagnóstico)

---

## 🚨 Tipos de Alertas

El sistema genera automáticamente los siguientes tipos de alertas:

| Tipo | Descripción | Severidad |
|------|-------------|-----------|
| `acceso_fuera_horario` | Acceso fuera del horario permitido (antes de las 6 AM o después de las 10 PM) | Media |
| `intento_fraudulento` | Múltiples intentos fallidos de login desde la misma IP | Alta/Crítica |
| `qr_expirado` | Visitante próximo a expirar (menos de 1 hora) | Baja |
| `documento_no_registrado` | Intento de acceso con documento no registrado | Media |
| `comportamiento_sospechoso` | Múltiples accesos rápidos de la misma persona | Alta |
| `sistema` | Alertas del sistema (BD grande, muchas alertas pendientes, etc.) | Variable |
| `seguridad` | Alertas de seguridad generales | Variable |

### Niveles de Severidad

- **Crítica** 🔴: Requiere atención inmediata
- **Alta** 🟡: Requiere atención pronto
- **Media** 🟠: Requiere atención normal
- **Baja** 🔵: Informativa

---

## 🖥️ Gestión desde el Frontend

### Ver Alertas en el Dashboard

1. **Inicia sesión** como administrador o guarda
2. Ve al **Dashboard** principal
3. Las alertas se muestran automáticamente en el panel de alertas
4. Puedes **filtrar por severidad** usando el selector

### Ver Alertas en el Panel de Administración

1. Ve a `/admin` (solo administradores)
2. Las alertas se muestran en tiempo real
3. Puedes filtrar por:
   - Tipo de alerta
   - Severidad
   - Estado (leída/no leída)

### Marcar Alertas como Leídas

1. Haz clic en el botón **✓** verde en cualquier alerta no leída
2. La alerta se marcará como leída y se actualizará automáticamente

### Eliminar Alertas

1. Haz clic en el botón **🗑️** rojo en cualquier alerta
2. Confirma la eliminación haciendo clic en **✓** (o cancela con **✕**)
3. La alerta se eliminará permanentemente de la base de datos

**Nota:** Puedes eliminar cualquier alerta, ya sea leída o no leída. Se recomienda eliminar solo las alertas que ya han sido atendidas.

---

## 🔌 Gestión desde la API

### Endpoints Disponibles

#### 1. Obtener Alertas

```http
GET /api/security/alerts
```

**Parámetros de consulta:**
- `tipo`: Filtrar por tipo de alerta
- `severidad`: Filtrar por severidad (critica, alta, media, baja)
- `leida`: Filtrar por estado (true/false)
- `limit`: Límite de resultados (default: 50)
- `offset`: Offset para paginación (default: 0)

**Ejemplo:**
```bash
# Obtener todas las alertas no leídas de severidad alta
curl -X GET "http://localhost:4000/api/security/alerts?severidad=alta&leida=false" \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id_alerta": 1,
      "tipo": "acceso_fuera_horario",
      "severidad": "media",
      "titulo": "Acceso fuera de horario",
      "mensaje": "Juan Pérez (123456789) ingresó fuera del horario permitido a las 23:30:00",
      "id_persona": 5,
      "id_acceso": 123,
      "leida": false,
      "fecha_creacion": "2024-01-15T23:30:00.000Z",
      "metadata": {
        "hora_acceso": "23:30:00",
        "rol": "aprendiz"
      }
    }
  ]
}
```

#### 2. Marcar Alerta como Leída

```http
POST /api/security/alerts/:id/read
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:4000/api/security/alerts/1/read" \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Alerta marcada como leída"
}
```

#### 3. Eliminar Alerta

```http
DELETE /api/security/alerts/:id
```

**Ejemplo:**
```bash
curl -X DELETE "http://localhost:4000/api/security/alerts/1" \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Alerta eliminada exitosamente"
}
```

#### 4. Eliminar Alertas Leídas Antiguas (Solo Admin)

```http
DELETE /api/security/alerts/old/read?days=30
```

**Parámetros:**
- `days`: Días de antigüedad (default: 30). Elimina alertas leídas de hace más de X días.

**Ejemplo:**
```bash
# Eliminar alertas leídas de hace más de 30 días
curl -X DELETE "http://localhost:4000/api/security/alerts/old/read?days=30" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"

# Eliminar todas las alertas leídas
curl -X DELETE "http://localhost:4000/api/security/alerts/old/read" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "15 alertas eliminadas",
  "deletedCount": 15
}
```

#### 5. Obtener Estadísticas de Alertas

```http
GET /api/security/alerts/stats
```

**Ejemplo:**
```bash
curl -X GET "http://localhost:4000/api/security/alerts/stats" \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pendientes": 45,
    "criticas_pendientes": 5,
    "altas_pendientes": 12,
    "hoy": 8,
    "porTipo": [
      { "tipo": "acceso_fuera_horario", "cantidad": 20 },
      { "tipo": "intento_fraudulento", "cantidad": 5 }
    ],
    "porSeveridad": [
      { "severidad": "alta", "cantidad": 12 },
      { "severidad": "media", "cantidad": 25 }
    ]
  }
}
```

#### 6. Ejecutar Verificación Inmediata de Alertas

```http
POST /api/security/alerts/check-now
```

**Requiere:** Rol de administrador

**Ejemplo:**
```bash
curl -X POST "http://localhost:4000/api/security/alerts/check-now" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Verificación completada",
  "data": {
    "offScheduleAlerts": 3,
    "expiringVisitors": 1,
    "fraudAttempts": 0,
    "suspiciousBehavior": 2,
    "total": 6
  }
}
```

---

## 🗄️ Verificación en Base de Datos

### Consultas SQL Útiles

#### Ver todas las alertas
```sql
SELECT * FROM Alertas ORDER BY fecha_creacion DESC LIMIT 50;
```

#### Ver alertas no leídas
```sql
SELECT * FROM Alertas WHERE leida = FALSE ORDER BY fecha_creacion DESC;
```

#### Contar alertas por tipo
```sql
SELECT tipo, COUNT(*) as cantidad 
FROM Alertas 
WHERE leida = FALSE 
GROUP BY tipo;
```

#### Contar alertas por severidad
```sql
SELECT severidad, COUNT(*) as cantidad 
FROM Alertas 
WHERE leida = FALSE 
GROUP BY severidad;
```

#### Ver alertas críticas pendientes
```sql
SELECT * FROM Alertas 
WHERE severidad = 'critica' AND leida = FALSE 
ORDER BY fecha_creacion DESC;
```

#### Ver alertas de hoy
```sql
SELECT * FROM Alertas 
WHERE DATE(fecha_creacion) = CURDATE() 
ORDER BY fecha_creacion DESC;
```

#### Marcar alerta como leída manualmente
```sql
UPDATE Alertas 
SET leida = TRUE, fecha_lectura = NOW(), id_usuario_lectura = 1 
WHERE id_alerta = 123;
```

#### Eliminar alerta manualmente
```sql
DELETE FROM Alertas WHERE id_alerta = 123;
```

#### Eliminar todas las alertas leídas antiguas
```sql
-- Eliminar alertas leídas de hace más de 30 días
DELETE FROM Alertas 
WHERE leida = TRUE 
AND fecha_lectura < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## ✏️ Crear Alertas Manualmente

### Desde el Código (Backend)

```javascript
import AlertService from './services/AlertService.js';

// Crear una alerta simple
const alertId = await AlertService.createAlert({
  tipo: 'sistema',
  severidad: 'media',
  titulo: 'Mantenimiento programado',
  mensaje: 'El sistema estará en mantenimiento el próximo domingo',
  metadata: {
    fecha_mantenimiento: '2024-01-21',
    duracion_horas: 2
  }
});

console.log(`Alerta creada con ID: ${alertId}`);
```

### Desde la API (usando código)

```javascript
// Ejemplo usando fetch en el frontend
const crearAlerta = async () => {
  const response = await fetch('http://localhost:4000/api/security/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo: 'sistema',
      severidad: 'baja',
      titulo: 'Notificación del sistema',
      mensaje: 'Esta es una alerta de prueba'
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

**Nota:** Actualmente no hay un endpoint POST para crear alertas manualmente desde la API. Esto se puede agregar si es necesario.

### Desde SQL Directo

```sql
INSERT INTO Alertas (tipo, severidad, titulo, mensaje, metadata)
VALUES (
  'sistema',
  'baja',
  'Alerta de prueba',
  'Esta es una alerta creada manualmente',
  '{"origen": "manual", "usuario": "admin"}'
);
```

---

## 🔧 Scripts de Diagnóstico

### Verificar Estado de la Tabla de Alertas

```bash
cd control-acceso-sena/backend
npm run check-alerts
```

Este script:
- ✅ Verifica que la tabla existe
- 📋 Muestra la estructura de la tabla
- 📊 Cuenta las alertas existentes
- 🧪 Crea una alerta de prueba
- ✅ Verifica que la inserción funciona

### Ver Logs del Servidor

Las alertas se crean automáticamente y los logs muestran:
- `📝 Creando alerta: [tipo] - [titulo]`
- `✅ Alerta creada exitosamente con ID: [id]`
- `❌ Error al crear alerta: [mensaje]` (si hay errores)

---

## 🔄 Alertas Automáticas

El sistema genera alertas automáticamente en los siguientes casos:

### 1. Scanner de Seguridad (cada 5 minutos)

- Accesos fuera de horario
- Visitantes próximos a expirar
- Intentos fraudulentos de login
- Comportamiento sospechoso

### 2. Verificación de Salud del Sistema

- Muchas alertas pendientes (>50)
- Base de datos muy grande (>1000 MB)
- Problemas de conexión a la BD

### 3. Detección de Fraudes

- Múltiples intentos fallidos de login desde la misma IP (≥3 en 15 minutos)
- Comportamiento sospechoso (≥5 accesos en ≤30 minutos)

---

## 📝 Mejoras Futuras Sugeridas

1. **Notificaciones en tiempo real** usando WebSockets
2. **Email/SMS** para alertas críticas
3. **Dashboard de alertas** más completo con gráficos
4. **Filtros avanzados** por fecha, persona, etc.
5. **Exportar alertas** a PDF/Excel
6. **Reglas personalizadas** para crear alertas
7. **Acciones automáticas** basadas en alertas (bloquear IP, etc.)

---

## 🆘 Solución de Problemas

### Las alertas no se están guardando

1. Verifica que la tabla existe:
   ```bash
   npm run check-alerts
   ```

2. Revisa los logs del servidor para errores

3. Verifica la conexión a la base de datos

4. Asegúrate de que el script de inicialización se ejecutó:
   ```bash
   node src/utils/initDB.js
   ```

### No veo alertas en el frontend

1. Verifica que el endpoint `/api/security/alerts` funciona
2. Revisa la consola del navegador para errores
3. Verifica que el token de autenticación es válido
4. Asegúrate de tener permisos de administrador o guarda

---

## 📚 Referencias

- **Servicio de Alertas**: `backend/src/services/AlertService.js`
- **Controlador de Seguridad**: `backend/src/controllers/securityController.js`
- **Rutas de Seguridad**: `backend/src/routes/security.js`
- **Componente de Alertas**: `frontend/src/components/AlertsPanel.jsx`

---

**Última actualización:** Enero 2024

