// User Cache - Sistema de cache inteligente para usuarios frecuentes
class UserCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.accessOrder = []; // Para implementar LRU
  }

  get(documento) {
    const item = this.cache.get(documento);
    
    if (!item) return null;
    
    // Verificar expiración
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(documento);
      this.accessOrder = this.accessOrder.filter(doc => doc !== documento);
      return null;
    }
    
    // Actualizar orden de acceso (LRU)
    this.accessOrder = this.accessOrder.filter(doc => doc !== documento);
    this.accessOrder.push(documento);
    
    return item.data;
  }

  set(documento, userData) {
    // Implementar LRU (Least Recently Used)
    if (this.cache.size >= this.maxSize && !this.cache.has(documento)) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(documento, {
      data: userData,
      timestamp: Date.now()
    });
    
    // Actualizar orden de acceso
    if (!this.accessOrder.includes(documento)) {
      this.accessOrder.push(documento);
    }
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  // Precargar usuarios frecuentes al inicio del turno
  async preloadFrequentUsers(api, guardId) {
    try {
      const response = await api.get(`/api/users/frequent/${guardId}`);
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(user => {
          if (user.documento) {
            this.set(user.documento, user);
          }
        });
      }
    } catch (error) {
      console.warn('Error precargando usuarios frecuentes:', error);
    }
  }

  // Obtener estadísticas del cache
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  // Métricas de rendimiento
  hits = 0;
  misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }
}

export default UserCache;
















