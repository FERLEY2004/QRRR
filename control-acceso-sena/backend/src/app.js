// Main Application File
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import accessRoutes from './routes/access.js';
import visitorRoutes from './routes/visitors.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import exportRoutes from './routes/export.js';
import catalogRoutes from './routes/catalog.js';
import analyticsRoutes from './routes/analytics.js';
import configRoutes from './routes/config.js';
import securityRoutes from './routes/security.js';
import importRoutes from './routes/import.js';
import logsRoutes from './routes/logs.js';
import initializeDatabase from './utils/initDB.js';
import { startSecurityScanner } from './jobs/securityScanner.js';
import { startCleanupJobs } from './jobs/cleanupJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos al iniciar el servidor
initializeDatabase().catch((error) => {
  console.error('⚠️  Error inicializando BD, continuando de todas formas:', error.message);
});

// Iniciar jobs automáticos
startSecurityScanner();
startCleanupJobs();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/import', importRoutes);
app.use('/api/logs', logsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso`);
    console.error(`\n💡 Soluciones:`);
    console.error(`   1. Ejecuta: .\\kill-server.ps1 (PowerShell)`);
    console.error(`   2. O ejecuta: kill-server.bat (CMD)`);
    console.error(`   3. O cierra manualmente el proceso usando el puerto ${PORT}\n`);
    process.exit(1);
  } else {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
});
