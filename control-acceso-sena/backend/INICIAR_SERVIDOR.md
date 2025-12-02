# 🚀 Cómo Iniciar el Servidor Backend

## Error: ERR_CONNECTION_REFUSED

Este error significa que el servidor backend no está corriendo. Sigue estos pasos:

## Pasos para Iniciar el Servidor

### 1. Verificar que estás en el directorio correcto

```bash
cd control-acceso-sena/backend
```

### 2. Verificar que las dependencias estén instaladas

```bash
npm install
```

### 3. Verificar configuración de base de datos

Asegúrate de tener un archivo `.env` en `backend/` con:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=control_acceso_sena
DB_PORT=3306
JWT_SECRET=tu_secret_key_segura
```

### 4. Iniciar el servidor

**Opción 1: Modo desarrollo (con auto-reload)**
```bash
npm run dev
```

**Opción 2: Modo producción**
```bash
npm start
```

**Opción 3: Directamente con Node**
```bash
node src/app.js
```

### 5. Verificar que el servidor esté corriendo

Deberías ver en la consola:
```
🚀 Servidor corriendo en http://localhost:5000
📊 Health check: http://localhost:5000/health
```

### 6. Probar el endpoint de health

Abre en tu navegador o usa curl:
```
http://localhost:5000/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "message": "API funcionando correctamente"
}
```

## Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### Error: "ECONNREFUSED" (Base de datos)
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos `control_acceso_sena` exista

### Error: "Port 5000 already in use"
- Cierra otros procesos usando el puerto 5000
- O cambia el puerto en `.env`:
  ```
  PORT=5001
  ```

## Verificar que el Servidor Esté Corriendo

```bash
# En Windows PowerShell
netstat -ano | findstr :5000

# En Linux/Mac
lsof -i :5000
```

Si ves un proceso escuchando en el puerto 5000, el servidor está corriendo.










