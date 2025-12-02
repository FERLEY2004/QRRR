# 🔧 Solución al Error 401 (Unauthorized) en Login

Si estás recibiendo un error **401 (Unauthorized)** al intentar iniciar sesión, sigue estos pasos en orden:

## 📋 Pasos de Solución

### 1. ✅ Verificar que los Usuarios Existan en la Base de Datos

Ejecuta el script de verificación que creará los usuarios por defecto si no existen:

```bash
cd control-acceso-sena/backend
node src/utils/checkUsers.js
```

Este script:
- ✅ Verifica que la tabla `usuarios` existe
- ✅ Lista todos los usuarios existentes
- ✅ Crea usuarios por defecto si no existen
- ✅ Corrige password_hash inválidos
- ✅ Asegura que los usuarios estén activos

**Credenciales por defecto:**
- **Admin:** admin@sena.edu.co / admin123
- **Guarda:** guarda@sena.edu.co / guarda123

### 2. ✅ Verificar que el Backend Esté Corriendo

El error 401 puede ocurrir si el servidor backend no está corriendo. Verifica:

**Windows (PowerShell):**
```powershell
# Verificar si hay un proceso en el puerto 4000
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
```

**O verifica directamente en el navegador:**
```
http://localhost:4000/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "message": "API funcionando correctamente"
}
```

**Si el servidor no está corriendo, inícialo:**

```bash
cd control-acceso-sena/backend
npm run dev
```

O usa el script de inicio:
```powershell
.\start-server.ps1
```

### 3. ✅ Verificar la Configuración de Puertos

Asegúrate de que el backend y frontend estén configurados para el mismo puerto:

**Backend (`backend/.env`):**
```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=control_acceso_sena
DB_PORT=3306
JWT_SECRET=tu_secret_key_segura
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:4000/api
```

Si el backend está corriendo en otro puerto (ej: 5000), actualiza el frontend:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. ✅ Verificar los Logs del Servidor

Cuando intentas hacer login, revisa los logs del servidor backend. Deberías ver mensajes como:

```
📥 Datos recibidos: { email: 'admin@sena...', passwordLength: 8 }
🔐 Intento de login: admin@sena.edu.co
✅ Usuario encontrado: admin@sena.edu.co, Estado: ACTIVO
🔐 Verificando contraseña...
🔐 Resultado de verificación de contraseña: true
✅ Login exitoso: admin@sena.edu.co (ADMINISTRADOR)
```

Si ves mensajes de error específicos, te indicarán qué está fallando:
- `❌ Usuario no encontrado` → Ejecuta `checkUsers.js`
- `❌ Contraseña incorrecta` → Verifica las credenciales
- `❌ Usuario sin password_hash válido` → Ejecuta `checkUsers.js`

### 5. ✅ Probar el Endpoint Directamente

Si el problema persiste, prueba el endpoint de login directamente:

**Con curl:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sena.edu.co","password":"admin123"}'
```

**O ejecuta el script de prueba:**
```bash
cd control-acceso-sena/backend
node src/utils/testLoginAPI.js
```

## 🔍 Diagnóstico de Problemas Comunes

### Problema: "No se puede conectar al servidor"

**Causa:** El servidor backend no está corriendo.

**Solución:**
1. Ve al directorio `backend/`
2. Ejecuta `npm run dev` o `.\start-server.ps1`
3. Verifica que veas: `🚀 Servidor corriendo en http://localhost:4000`

### Problema: "Credenciales inválidas" pero el usuario existe

**Causa:** El password_hash en la base de datos no coincide.

**Solución:**
```bash
cd control-acceso-sena/backend
node src/utils/checkUsers.js
```

Este script regenerará los hashes de contraseña automáticamente.

### Problema: "Usuario no encontrado"

**Causa:** No hay usuarios en la base de datos.

**Solución:**
```bash
cd control-acceso-sena/backend
node src/utils/checkUsers.js
```

### Problema: Error de conexión a la base de datos

**Causa:** MySQL no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `backend/.env`
3. Verifica que la base de datos `control_acceso_sena` exista

## ✅ Verificación Final

Después de seguir estos pasos, verifica:

1. ✅ El servidor backend está corriendo (puerto 4000 o el configurado)
2. ✅ Los usuarios existen en la base de datos
3. ✅ Los usuarios tienen password_hash válido
4. ✅ Los usuarios están en estado 'ACTIVO'
5. ✅ El frontend está configurado con la URL correcta del API
6. ✅ No hay errores en los logs del servidor

Si todo está correcto, el login debería funcionar. Si el problema persiste, revisa los logs del servidor para más detalles específicos.

## 📝 Scripts Disponibles

- `checkUsers.js` - Verifica y crea usuarios por defecto
- `testLoginAPI.js` - Prueba el endpoint de login directamente
- `diagnose.js` - Diagnóstico completo del sistema

