# Control de Acceso SENA

Sistema completo de control de acceso con códigos QR para el SENA.

## 🚀 Características

- ✅ **Scanner QR funcional** con cámara en tiempo real
- ✅ **Gestión de visitantes** con QR temporales (24 horas)
- ✅ **Panel administrativo** con métricas en tiempo real
- ✅ **Autenticación segura** con JWT
- ✅ **Control de accesos** (entrada/salida automática)
- ✅ **Reportes y estadísticas** diarias
- ✅ **Interfaz responsive** optimizada para móviles

## 📋 Requisitos Previos

- Node.js 18+ y npm
- MySQL 8.0+
- Navegador moderno con soporte para cámara (para scanner QR)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd control-acceso-sena
```

### 2. Configurar Base de Datos

1. Crear la base de datos `control_acceso_sena` en MySQL
2. Importar el esquema SQL (si está disponible)
3. Configurar las credenciales en `.env` del backend

### 3. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=control_acceso_sena
JWT_SECRET=tu_secret_key_segura_aqui
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 4. Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Ejecución

### Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 👤 Credenciales por Defecto

**Administrador:**
- Email: `admin@sena.edu.co`
- Contraseña: `admin123`

**Guarda:**
- Email: `guarda@sena.edu.co`
- Contraseña: `guarda123`

## 📱 Uso del Sistema

### Scanner QR

1. Iniciar sesión como guarda o admin
2. Ir a "Scanner" en el menú
3. Activar la cámara
4. Escanear el código QR del aprendiz/visitante
5. El sistema registrará automáticamente entrada o salida

### Registrar Visitante

1. Ir a "Visitantes" en el menú
2. Completar el formulario con los datos del visitante
3. Se generará automáticamente un código QR válido por 24 horas
4. El visitante puede usar este QR para ingresar

### Panel Administrativo

1. Iniciar sesión como administrador
2. Acceder a "Administración" para gestionar usuarios
3. Ver "Reportes" para estadísticas y registros

## 🏗️ Estructura del Proyecto

```
control-acceso-sena/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración (DB, JWT)
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definición de rutas
│   │   └── utils/          # Utilidades (QR generator)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # Context API (Auth)
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios API
│   │   └── styles/         # Estilos globales
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token

### Accesos
- `POST /api/access/scan` - Escanear QR
- `GET /api/access/current` - Personas dentro
- `GET /api/access/stats/daily` - Estadísticas diarias

### Visitantes
- `POST /api/visitors` - Crear visitante
- `GET /api/visitors` - Listar visitantes
- `POST /api/visitors/:id/qr` - Generar QR

### Usuarios (Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Desactivar usuario

## 🔒 Seguridad

- Autenticación JWT con tokens expirables
- Contraseñas hasheadas con bcrypt
- Middleware de autorización por roles
- Validación de datos en backend
- Protección de rutas en frontend

## 🐛 Solución de Problemas

### La cámara no funciona
- Verificar permisos del navegador para acceder a la cámara
- Usar HTTPS en producción (requerido para cámara)
- Probar en diferentes navegadores

### Error de conexión a la base de datos
- Verificar credenciales en `.env`
- Asegurar que MySQL esté corriendo
- Verificar que la base de datos existe

### Token expirado
- Cerrar sesión y volver a iniciar
- Verificar configuración de JWT_EXPIRES_IN

## 📝 Notas

- Los códigos QR de visitantes expiran después de 24 horas
- El sistema detecta automáticamente si una persona está dentro o fuera
- Las estadísticas se actualizan en tiempo real cada 30 segundos

## 📄 Licencia

Este proyecto es propiedad del SENA.

## 👥 Contribuidores

Desarrollado para el Sistema de Control de Acceso SENA.
