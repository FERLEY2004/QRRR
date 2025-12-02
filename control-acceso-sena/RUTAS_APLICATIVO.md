# 📋 DOCUMENTACIÓN COMPLETA DE RUTAS - Sistema de Control de Acceso SENA

## 🔗 ÍNDICE
1. [Rutas del Backend (API)](#rutas-del-backend-api)
2. [Rutas del Frontend (React Router)](#rutas-del-frontend-react-router)
3. [Mapeo de Rutas Frontend-Backend](#mapeo-de-rutas-frontend-backend)
4. [Notas y Observaciones](#notas-y-observaciones)

---

## 🌐 RUTAS DEL BACKEND (API)

### Base URL: `http://localhost:4000/api` (o según configuración)

### 1. **Autenticación** (`/api/auth`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| POST | `/api/auth/login` | `login` | Iniciar sesión | ❌ Público |
| GET | `/api/auth/verify` | `verify` | Verificar token | ✅ Requerida |

### 2. **Dashboard** (`/api/dashboard`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/dashboard/metrics` | `getMetrics` | Obtener métricas consolidadas | ✅ Requerida |
| GET | `/api/dashboard/recent-access` | `getRecentAccess` | Obtener accesos recientes | ✅ Requerida |
| GET | `/api/dashboard/alerts` | `getAlerts` | Obtener alertas | ✅ Requerida |
| GET | `/api/dashboard/access-stats` | `getAccessStats` | Diagnóstico de accesos | ✅ Requerida |

### 3. **Accesos** (`/api/access`)
| Método | Ruta | Controlador | Descripción | Roles Permitidos |
|--------|------|-------------|-------------|------------------|
| POST | `/api/access/scan` | `scanQR` | Escanear QR y registrar entrada/salida | GUARDA, ADMIN |
| POST | `/api/access/scan-complete` | `scanComplete` | Completar escaneo | GUARDA, ADMIN |
| GET | `/api/access/current` | `getCurrentPeople` | Obtener personas actualmente dentro | ✅ Requerida |
| GET | `/api/access/stats/daily` | `getDailyStats` | Estadísticas diarias | ✅ Requerida |

### 4. **Visitantes** (`/api/visitors`)
| Método | Ruta | Controlador | Descripción | Roles Permitidos |
|--------|------|-------------|-------------|------------------|
| POST | `/api/visitors` | `createVisitor` | Crear nuevo visitante | GUARDA, ADMIN |
| GET | `/api/visitors` | `getVisitors` | Obtener lista de visitantes | ✅ Requerida |
| POST | `/api/visitors/:id/qr` | `generateVisitorQR` | Generar QR para visitante | GUARDA, ADMIN |

### 5. **Usuarios** (`/api/users`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/users` | `getUsers` | Obtener lista de usuarios | ✅ Requerida |
| POST | `/api/users` | `createUser` | Crear nuevo usuario | ✅ Requerida |
| PUT | `/api/users/:id` | `updateUser` | Actualizar usuario | ✅ Requerida |
| DELETE | `/api/users/:id` | `deleteUser` | Eliminar usuario | ✅ Requerida |

### 6. **Reportes** (`/api/reports`)
| Método | Ruta | Controlador | Descripción | Roles Permitidos |
|--------|------|-------------|-------------|------------------|
| GET | `/api/reports/daily` | `getDailyReport` | Reporte diario | ADMIN |
| GET | `/api/reports/weekly` | `getWeeklyReport` | Reporte semanal | ADMIN |
| GET | `/api/reports/visitors` | `getVisitorsReport` | Reporte de visitantes | ADMIN |
| GET | `/api/reports/role` | `getRoleReport` | Reporte por rol | ADMIN |
| POST | `/api/reports/export-csv` | `exportReportCSV` | Exportar reporte a CSV | ADMIN |
| GET | `/api/reports/current-people` | `getCurrentPeople` | Personas actualmente dentro | ✅ Requerida |
| GET | `/api/reports/access-by-role` | `getAccessByRole` | Accesos por rol | ✅ Requerida |
| GET | `/api/reports/weekly-access` | `getWeeklyAccess` | Accesos semanales | ✅ Requerida |
| GET | `/api/reports/predictive-flows` | `getPredictiveFlows` | Flujos predictivos | ✅ Requerida |
| GET | `/api/reports/access-history` | `getAccessHistory` | Historial de accesos | ✅ Requerida |
| GET | `/api/reports/program/:codigo/access` | `getAccessByProgram` | Accesos por programa | ✅ Requerida |

### 7. **Búsqueda** (`/api/search`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/search/users` | `searchUsers` | Buscar usuarios | ✅ Requerida |
| GET | `/api/search/access` | `searchAccess` | Buscar accesos | ✅ Requerida |
| GET | `/api/search/visitors` | `searchVisitors` | Buscar visitantes | ✅ Requerida |

### 8. **Catálogo** (`/api/catalog`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/catalog/programs` | `getAllPrograms` | Obtener todos los programas | ✅ Requerida |
| GET | `/api/catalog/programs/:codigo` | `getProgramByCode` | Obtener programa por código | ✅ Requerida |
| GET | `/api/catalog/fichas` | `getAllFichas` | Obtener todas las fichas | ✅ Requerida |
| GET | `/api/catalog/fichas/:codigo` | `getFichaByCode` | Obtener ficha por código | ✅ Requerida |
| GET | `/api/catalog/fichas/:codigo/students` | `getStudentsByFicha` | Estudiantes por ficha | ✅ Requerida |
| GET | `/api/catalog/ambientes` | `getAllAmbientes` | Obtener todos los ambientes | ✅ Requerida |
| GET | `/api/catalog/ambientes/:codigo` | `getAmbienteByCode` | Obtener ambiente por código | ✅ Requerida |
| GET | `/api/catalog/ambientes/tipo/:tipo` | `getAmbientesByType` | Ambientes por tipo | ✅ Requerida |
| GET | `/api/catalog/programs/:codigo/students` | `getStudentsByProgram` | Estudiantes por programa | ✅ Requerida |
| GET | `/api/catalog/programs/:codigo/access` | `getAccessByProgram` | Accesos por programa | ✅ Requerida |
| GET | `/api/catalog/ambientes/:codigo/occupation` | `getAmbientOccupation` | Ocupación del ambiente | ✅ Requerida |

### 9. **Analíticas** (`/api/analytics`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/analytics/current-occupancy` | `getCurrentOccupancy` | Ocupación actual | ✅ Requerida |
| GET | `/api/analytics/by-ficha/:ficha` | `getStatsByFicha` | Estadísticas por ficha | ✅ Requerida |
| GET | `/api/analytics/by-programa/:programa` | `getStatsByPrograma` | Estadísticas por programa | ✅ Requerida |
| GET | `/api/analytics/attendance-history/:documento` | `getAttendanceHistory` | Historial de asistencia | ✅ Requerida |
| GET | `/api/analytics/daily-stats` | `getDailyStats` | Estadísticas diarias | ✅ Requerida |

### 10. **Configuración** (`/api/config`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| GET | `/api/config` | `getConfig` | Obtener configuración | ✅ Requerida |
| PUT | `/api/config` | `updateConfig` | Actualizar configuración | ✅ Requerida |
| PUT | `/api/config/multiple` | `updateMultipleConfig` | Actualizar múltiples configs | ✅ Requerida |
| POST | `/api/config` | `createConfig` | Crear configuración | ✅ Requerida |
| POST | `/api/config/setup-accesos-trigger` | `setupAccesosTrigger` | Configurar trigger de Accesos | ✅ Requerida |
| POST | `/api/config/sync-accesos` | `syncAccesos` | Sincronizar Accesos | ✅ Requerida |

### 11. **Seguridad** (`/api/security`)
| Método | Ruta | Controlador | Descripción | Roles Permitidos |
|--------|------|-------------|-------------|------------------|
| GET | `/api/security/alerts` | `getAlerts` | Obtener alertas | ✅ Requerida |
| POST | `/api/security/alerts/:id/read` | `markAlertAsRead` | Marcar alerta como leída | ✅ Requerida |
| DELETE | `/api/security/alerts/:id` | `deleteAlert` | Eliminar alerta | ✅ Requerida |
| DELETE | `/api/security/alerts/old/read` | `deleteOldReadAlerts` | Eliminar alertas antiguas leídas | ADMIN |
| GET | `/api/security/alerts/stats` | `getAlertStats` | Estadísticas de alertas | ✅ Requerida |
| POST | `/api/security/alerts/check-now` | `checkAlertsNow` | Verificar alertas ahora | ADMIN |
| GET | `/api/security/system-health` | `getSystemHealth` | Salud del sistema | ✅ Requerida |
| GET | `/api/security/fraud-detection` | `detectFraud` | Detección de fraude | ADMIN |
| GET | `/api/security/suspicious-attempts` | `getSuspiciousAttempts` | Intentos sospechosos | ADMIN |
| GET | `/api/security/security-metrics` | `getSecurityMetrics` | Métricas de seguridad | ADMIN |
| GET | `/api/security/audit-logs` | `getAuditLogs` | Logs de auditoría | ADMIN |
| GET | `/api/security/security-logs` | `getSecurityLogs` | Logs de seguridad | ADMIN |
| GET | `/api/security/access-history` | `getAccessHistory` | Historial de accesos | ADMIN |

### 12. **Importación** (`/api/import`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| POST | `/api/import/upload` | `uploadFile` | Subir archivo para importar | ✅ Requerida |
| POST | `/api/import/validate` | `validateData` | Validar datos a importar | ✅ Requerida |
| POST | `/api/import/execute` | `executeImport` | Ejecutar importación | ✅ Requerida |
| GET | `/api/import/progress/:jobId` | `getImportProgress` | Progreso de importación | ✅ Requerida |
| GET | `/api/import/results/:jobId` | `getImportResults` | Resultados de importación | ✅ Requerida |

### 13. **Exportación** (`/api/export`)
| Método | Ruta | Controlador | Descripción | Autenticación |
|--------|------|-------------|-------------|---------------|
| POST | `/api/export/pdf` | `exportToPDF` | Exportar a PDF | ✅ Requerida |
| POST | `/api/export/excel` | `exportToExcel` | Exportar a Excel | ✅ Requerida |

### 14. **Health Check**
| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/health` | Verificar estado del servidor | ❌ Público |

---

## 🖥️ RUTAS DEL FRONTEND (React Router)

### Base URL: `http://localhost:5173` (o según configuración de Vite)

### 1. **Rutas Públicas**
| Ruta | Componente | Descripción | Protección |
|------|------------|-------------|------------|
| `/login` | `Login` | Página de inicio de sesión | ❌ Pública |
| `/` | `RootRedirect` | Redirige según estado de autenticación | ❌ Pública |

### 2. **Rutas Protegidas (Requieren Autenticación)**
| Ruta | Componente | Descripción | Requiere Admin |
|------|------------|-------------|----------------|
| `/dashboard` | `Dashboard` | Panel principal del dashboard | ❌ |
| `/scanner` | `Scanner` | Escáner QR para registrar accesos | ❌ |
| `/visitors` | `Visitors` | Gestión de visitantes | ❌ |
| `/admin` | `AdminPanel` | Panel de administración | ✅ |
| `/reports` | `Reports` | Generación de reportes | ✅ |
| `/reports-dashboard` | `ReportsDashboard` | Dashboard de reportes | ✅ |
| `/people-search` | `PeopleSearch` | Búsqueda de personas | ✅ |
| `/access-history` | `AccessHistory` | Historial de accesos | ✅ |
| `/program-catalog` | `ProgramCatalog` | Catálogo de programas | ✅ |
| `/fichas-catalog` | `FichasCatalog` | Catálogo de fichas | ✅ |
| `/import` | `ImportWizard` | Wizard de importación | ✅ |

---

## 🔄 MAPEO DE RUTAS FRONTEND-BACKEND

### Dashboard
- **Frontend**: `/dashboard`
- **Backend**: 
  - `/api/dashboard/metrics` - Métricas
  - `/api/dashboard/recent-access` - Accesos recientes
  - `/api/dashboard/alerts` - Alertas
  - `/api/dashboard/access-stats` - Diagnóstico

### Scanner
- **Frontend**: `/scanner`
- **Backend**: 
  - `/api/access/scan` - Escanear QR
  - `/api/access/scan-complete` - Completar escaneo
  - `/api/access/current` - Personas dentro

### Visitantes
- **Frontend**: `/visitors`
- **Backend**: 
  - `/api/visitors` (GET) - Listar visitantes
  - `/api/visitors` (POST) - Crear visitante
  - `/api/visitors/:id/qr` - Generar QR

### Reportes
- **Frontend**: `/reports`, `/reports-dashboard`
- **Backend**: 
  - `/api/reports/daily` - Reporte diario
  - `/api/reports/weekly` - Reporte semanal
  - `/api/reports/visitors` - Reporte visitantes
  - `/api/reports/role` - Reporte por rol
  - `/api/reports/access-history` - Historial

### Búsqueda
- **Frontend**: `/people-search`
- **Backend**: 
  - `/api/search/users` - Buscar usuarios
  - `/api/search/access` - Buscar accesos
  - `/api/search/visitors` - Buscar visitantes

### Catálogos
- **Frontend**: `/program-catalog`, `/fichas-catalog`
- **Backend**: 
  - `/api/catalog/programs` - Programas
  - `/api/catalog/fichas` - Fichas
  - `/api/catalog/ambientes` - Ambientes

### Administración
- **Frontend**: `/admin`
- **Backend**: 
  - `/api/users` - Gestión de usuarios
  - `/api/config` - Configuración
  - `/api/security/*` - Seguridad y logs

### Importación
- **Frontend**: `/import`
- **Backend**: 
  - `/api/import/upload` - Subir archivo
  - `/api/import/validate` - Validar datos
  - `/api/import/execute` - Ejecutar importación

---

## 📝 NOTAS Y OBSERVACIONES

### ✅ Rutas Correctamente Implementadas
1. Todas las rutas del backend están registradas en `app.js`
2. Todas las rutas del frontend están definidas en `App.jsx`
3. Las rutas protegidas usan `ProtectedRoute` correctamente
4. Los roles están validados en el backend con `requireRole` middleware

### ⚠️ Posibles Mejoras
1. **Consistencia de nombres**: Algunas rutas usan diferentes convenciones:
   - Frontend: `/access-history` (kebab-case)
   - Backend: `/api/reports/access-history` (kebab-case) ✅
   - Backend alternativo: `/api/security/access-history` (también existe)

2. **Rutas duplicadas**: 
   - `/api/reports/access-history` y `/api/security/access-history` parecen hacer lo mismo
   - Considerar consolidar o documentar diferencias

3. **Falta de página**: 
   - No hay una página frontend para `/api/catalog/ambientes` aunque existe la ruta
   - Existe `AmbientCatalog.jsx` pero no está registrado en `App.jsx`

4. **Rutas no utilizadas**:
   - Verificar si todas las rutas del backend están siendo utilizadas por el frontend
   - Algunas rutas pueden estar definidas pero no usadas

### 🔍 Verificación Recomendada
1. Probar todas las rutas del backend con Postman o similar
2. Verificar que todas las rutas del frontend tengan componentes implementados
3. Revisar que los permisos de roles sean consistentes
4. Documentar cualquier ruta deprecada o no utilizada

### 📚 Convenciones
- **Backend**: Usar kebab-case para rutas (ej: `/access-history`)
- **Frontend**: Usar kebab-case para rutas (ej: `/access-history`)
- **Roles**: Usar mayúsculas (ej: `ADMIN`, `GUARDA`)
- **Autenticación**: Todas las rutas excepto `/login` y `/health` requieren autenticación

---

**Última actualización**: $(date)
**Versión del documento**: 1.0

