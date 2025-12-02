# 🔧 Solución al Error 401 en Login

Si estás recibiendo un error **401 (Unauthorized)** al intentar iniciar sesión, sigue estos pasos:

## 🔍 Diagnóstico

El error 401 puede deberse a varias causas:

1. **Usuario no existe en la base de datos**
2. **Contraseña incorrecta**
3. **Usuario sin password_hash válido**
4. **Usuario inactivo**

## ✅ Solución Paso a Paso

### Paso 1: Verificar y Crear Usuarios

Ejecuta el script de verificación que creará los usuarios por defecto si no existen:

```bash
cd control-acceso-sena/backend
node src/utils/checkUsers.js
```

Este script:
- ✅ Verifica que la tabla `Usuarios` existe
- ✅ Lista todos los usuarios existentes
- ✅ Crea usuarios por defecto si no existen
- ✅ Corrige password_hash inválidos
- ✅ Asegura que los usuarios estén activos

### Paso 2: Credenciales por Defecto

Después de ejecutar el script, puedes usar estas credenciales:

**Administrador:**
- Email: `admin@sena.edu.co`
- Contraseña: `admin123`

**Guarda de Seguridad:**
- Email: `guarda@sena.edu.co`
- Contraseña: `guarda123`

### Paso 3: Probar el Login

Si el problema persiste, ejecuta el script de prueba:

```bash
node src/utils/testLogin.js
```

Este script verificará que las contraseñas funcionen correctamente.

### Paso 4: Verificar Logs del Servidor

Revisa los logs del servidor backend cuando intentas hacer login. Deberías ver mensajes como:

```
📥 Datos recibidos: { email: 'admin@sena...', passwordLength: 8 }
🔐 Intento de login: admin@sena.edu.co
✅ Usuario encontrado: admin@sena.edu.co, Estado: activo
🔐 Verificación de contraseña: true
✅ Login exitoso: admin@sena.edu.co (admin)
```

Si ves mensajes de error específicos, te indicarán qué está fallando.

## 🔧 Scripts Disponibles

### 1. `checkUsers.js` - Verificar y Crear Usuarios
```bash
node src/utils/checkUsers.js
```

### 2. `testLogin.js` - Probar Credenciales
```bash
node src/utils/testLogin.js
```

### 3. `insertUsers.js` - Insertar Usuarios Manualmente
```bash
node src/utils/insertUsers.js
```

## 🐛 Problemas Comunes

### Error: "La tabla Usuarios no existe"

**Solución:** Ejecuta el script de inicialización de la base de datos:
```bash
# En MySQL Workbench o desde la línea de comandos
mysql -u tu_usuario -p tu_base_de_datos < src/utils/schema.sql
```

### Error: "Usuario sin password_hash"

**Solución:** Ejecuta `checkUsers.js` que regenerará los hashes automáticamente.

### Error: "Credenciales inválidas" pero el usuario existe

**Solución:** 
1. Ejecuta `testLogin.js` para verificar las contraseñas
2. Si falla, ejecuta `checkUsers.js` para regenerar los hashes

## 📝 Verificar Usuarios Manualmente (SQL)

Si prefieres verificar manualmente en MySQL:

```sql
-- Ver todos los usuarios
SELECT id_usuario, nombre, email, rol, estado, 
       CASE 
         WHEN password_hash IS NULL THEN 'SIN HASH'
         WHEN LENGTH(password_hash) < 20 THEN 'HASH INVÁLIDO'
         ELSE 'OK'
       END as estado_password
FROM Usuarios;

-- Verificar un usuario específico
SELECT * FROM Usuarios WHERE email = 'admin@sena.edu.co';
```

## 🔐 Crear Nuevo Usuario Manualmente

Si necesitas crear un usuario manualmente:

```bash
node -e "
import('./src/utils/dbPool.js').then(async ({default: pool}) => {
  const bcrypt = (await import('bcryptjs')).default;
  const email = 'nuevo@email.com';
  const password = 'contraseña123';
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    'INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) VALUES (?, ?, ?, ?, ?)',
    ['Nombre Usuario', email, hash, 'admin', 'activo']
  );
  console.log('Usuario creado:', email);
  await pool.end();
});
"
```

## ✅ Verificación Final

Después de ejecutar los scripts, verifica:

1. ✅ La tabla `Usuarios` existe
2. ✅ Los usuarios por defecto existen
3. ✅ Los usuarios tienen `password_hash` válido
4. ✅ Los usuarios están en estado `activo`
5. ✅ Las contraseñas funcionan correctamente

Si todo está correcto, el login debería funcionar. Si el problema persiste, revisa los logs del servidor para más detalles.







