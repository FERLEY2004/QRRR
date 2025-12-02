# 🚀 Instrucciones Rápidas de Sincronización

## Pasos Rápidos

### 1. Preparar el archivo Excel
- Coloca el archivo `Reporte de Juicios Evaluativos_3066232 (1).xlsx` en la carpeta `backend/uploads/`
- O prepara la ruta completa al archivo

### 2. Verificar configuración
Asegúrate de que el archivo `.env` tenga las credenciales correctas:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=control_acceso_sena
```

### 3. Ejecutar sincronización

**Opción A - Usando npm:**
```bash
cd backend
npm run sync-excel
```

**Opción B - Con ruta específica:**
```bash
npm run sync-excel "ruta/completa/al/archivo.xlsx"
```

**Opción C - Script directo:**
```bash
node sync.js
```

### 4. Revisar resultados
Los archivos se generarán en `backend/reports/`:
- `Log_Sincronizacion_[fecha].txt` - Log detallado
- `Reporte_Cambios_[fecha].csv` - Reporte CSV
- `Control_Acceso_Sincronizado_[fecha].xlsx` - Excel con resultados

## ⚠️ Importante

- **Haz backup de la BD** antes de ejecutar
- Los usuarios inhabilitados perderán acceso inmediatamente
- Los accesos activos se cerrarán automáticamente

## 📋 Columnas Requeridas en Excel

El Excel debe tener estas columnas (nombres pueden variar):
- **Documento**: Número de documento
- **Nombre**: Nombre(s)
- **Apellidos**: Apellido(s)  
- **Estado**: "EN FORMACION" o "CANCELADO"

## 🔍 Verificación

Después de ejecutar, revisa:
1. La consola para ver el resumen
2. El archivo de log para detalles
3. El reporte CSV para cambios específicos

---

Para más detalles, consulta `SYNC_README.md`










