# 🔐 Guía para Insertar Usuarios de Inicio de Sesión

Esta guía explica cómo insertar usuarios con credenciales de inicio de sesión en la base de datos.

## 📋 Métodos Disponibles

### Método 1: Script Node.js (Recomendado) ⭐

Este método genera automáticamente los hashes bcrypt correctos.

```bash
cd control-acceso-sena/backend
npm run insert-users
```

**Usuarios creados por defecto:**
- **Admin**: `admin@sena.edu.co` / `admin123`
- **Guarda**: `guarda@sena.edu.co` / `guarda123`

### Método 2: Ejecutar Script SQL Directamente

Si prefieres usar SQL directamente, primero necesitas generar los hashes bcrypt. Puedes usar el script Node.js para obtener los hashes:

```bash
node src/utils/insertUsers.js
```

Luego copia los hashes generados y úsalos en el SQL.

### Método 3: Insertar Usuario Personalizado

#### Usando Node.js

Crea un archivo temporal o modifica `insertUsers.js`:

```javascript
import bcrypt from 'bcryptjs';
import pool from './dbPool.js';

const insertCustomUser = async () => {
  const nombre = 'Tu Nombre';
  const email = 'tu@email.com';
  const password = 'tu_contraseña';
  const rol = 'admin'; // o 'guarda'
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  await pool.execute(
    `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, email, passwordHash, rol, 'activo']
  );
  
  console.log('Usuario creado exitosamente');
  await pool.end();
};

insertCustomUser();
```

#### Usando SQL (requiere hash bcrypt)

```sql
USE control_acceso_sena;

INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
VALUES (
    'Tu Nombre',
    'tu@email.com',
    '$2a$10$TU_HASH_BCRYPT_AQUI',
    'admin',
    'activo'
);
```

## 🔑 Generar Hash bcrypt Manualmente

Si necesitas generar un hash bcrypt manualmente:

```javascript
import bcrypt from 'bcryptjs';

const password = 'tu_contraseña';
const hash = await bcrypt.hash(password, 10);
console.log('Hash:', hash);
```

O usando Node.js directamente:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('tu_contraseña', 10).then(h => console.log(h));"
```

## 📝 Estructura de la Tabla Usuarios

```sql
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'guarda') NOT NULL DEFAULT 'guarda',
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔍 Verificar Usuarios Existentes

```sql
SELECT id_usuario, nombre, email, rol, estado, fecha_creacion 
FROM Usuarios;
```

## 🔄 Actualizar Contraseña de Usuario Existente

### Usando Node.js

```javascript
import bcrypt from 'bcryptjs';
import pool from './dbPool.js';

const updatePassword = async (email, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await pool.execute(
    'UPDATE Usuarios SET password_hash = ? WHERE email = ?',
    [passwordHash, email]
  );
  
  console.log('Contraseña actualizada');
  await pool.end();
};

updatePassword('admin@sena.edu.co', 'nueva_contraseña');
```

### Usando SQL (requiere hash bcrypt)

```sql
UPDATE Usuarios 
SET password_hash = '$2a$10$NUEVO_HASH_AQUI'
WHERE email = 'admin@sena.edu.co';
```

## ⚠️ Notas Importantes

1. **Las contraseñas deben estar hasheadas con bcrypt** antes de insertarlas en la base de datos
2. **El email debe ser único** - no se pueden tener dos usuarios con el mismo email
3. **Los roles válidos son**: `admin` o `guarda`
4. **El estado puede ser**: `activo` o `inactivo`
5. **El script `insertUsers.js` actualiza usuarios existentes** si ya existen con el mismo email

## 🛠️ Solución de Problemas

### Error: "Duplicate entry for key 'email'"

El usuario ya existe. El script lo actualizará automáticamente, o puedes eliminarlo primero:

```sql
DELETE FROM Usuarios WHERE email = 'email@ejemplo.com';
```

### Error: "Invalid bcrypt hash"

Asegúrate de usar un hash bcrypt válido generado con `bcrypt.hash()` con 10 rounds.

### Verificar que el usuario funciona

1. Ejecuta el script de inserción
2. Intenta iniciar sesión con las credenciales
3. Si no funciona, verifica que el hash sea correcto

## 📚 Archivos Relacionados

- `src/utils/insertUsers.js` - Script Node.js para insertar usuarios
- `src/utils/insertUsers.sql` - Script SQL (requiere hashes pre-generados)
- `src/utils/initDB.js` - Script de inicialización que también crea usuarios por defecto

