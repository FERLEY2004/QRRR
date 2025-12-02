# 🚀 Guía de Inicio Rápido - Control de Acceso SENA

## ⚠️ Error: ERR_CONNECTION_REFUSED

Este error significa que el **servidor backend no está corriendo**. Sigue estos pasos:

---

## 📋 PASO 1: Iniciar el Servidor Backend

### Opción A: Usar el Script (Recomendado)

**Windows (PowerShell):**
```powershell
cd control-acceso-sena\backend
.\start-server.ps1
```

**Windows (CMD):**
```cmd
cd control-acceso-sena\backend
start-server.bat
```

### Opción B: Comando Manual

```bash
cd control-acceso-sena\backend
npm run dev
```

### Opción C: Node Directo

```bash
cd control-acceso-sena\backend
node src/app.js
```

---

## ✅ PASO 2: Verificar que el Servidor Está Corriendo

Deberías ver en la consola:

```
🚀 Servidor corriendo en http://localhost:5000
📊 Health check: http://localhost:5000/health
```

### Probar la Conexión

Abre en tu navegador:
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

---

## 🔧 PASO 3: Verificar Configuración

### Archivo `.env` en `backend/`

Asegúrate de tener un archivo `.env` con:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=control_acceso_sena
DB_PORT=3306
JWT_SECRET=tu_secret_key_super_segura
```

### Instalar Dependencias (si es necesario)

```bash
cd control-acceso-sena\backend
npm install
```

---

## 📋 PASO 4: Iniciar el Frontend

En una **nueva terminal**:

```bash
cd control-acceso-sena\frontend
npm run dev
```

---

## 🔍 Solución de Problemas

### Error: "Cannot find module"
```bash
cd control-acceso-sena\backend
npm install
```

### Error: "ECONNREFUSED" (Base de datos)
- ✅ Verifica que MySQL esté corriendo
- ✅ Verifica las credenciales en `.env`
- ✅ Verifica que la base de datos `control_acceso_sena` exista

### Error: "Port 5000 already in use"
- Cierra otros procesos usando el puerto 5000
- O cambia el puerto en `.env`:
  ```
  PORT=5001
  ```
- Y actualiza `VITE_API_URL` en el frontend

### El servidor se inicia pero luego se detiene
- Revisa los errores en la consola
- Verifica la conexión a la base de datos
- Verifica que todas las dependencias estén instaladas

---

## 📝 Orden Correcto de Inicio

1. ✅ **MySQL** debe estar corriendo
2. ✅ **Backend** (`npm run dev` en `backend/`)
3. ✅ **Frontend** (`npm run dev` en `frontend/`)

---

## 🎯 Verificación Final

1. Backend corriendo → `http://localhost:5000/health` responde OK
2. Frontend corriendo → `http://localhost:5173` (o el puerto que muestre)
3. Puedes hacer login → El frontend se conecta al backend

---

**Si sigues teniendo problemas, revisa los logs del servidor backend para ver errores específicos.**










