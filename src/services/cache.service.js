// ============================================
// CACHE SERVICE (REDIS)
// ============================================
// Este servicio proporciona funciones de CACHÉ usando Redis para mejorar el PERFORMANCE.
//
// ¿QUÉ ES CACHÉ?
// Es una memoria temporal de alta velocidad que almacena datos frecuentemente accedidos
// para evitar consultas repetitivas a la base de datos.
//
// BENEFICIOS:
// - Reduce carga en la base de datos (menos queries)
// - Respuestas más rápidas (Redis es en memoria)
// - Mejor experiencia de usuario
// - Reduce costos de infraestructura
//
// CASOS DE USO EN STAY-AS-BACK:
// 1. Cachear propiedades populares
// 2. Cachear resultados de búsqueda
// 3. Cachear perfiles de usuario
// 4. Cachear precios calculados de temporada
// 5. Cachear estadísticas del dashboard
// 6. Cachear contadores (likes, views, etc)
//
// ESTRATEGIA DE TTL (Time To Live):
// - Datos estáticos: 1 hora (3600s)
// - Datos dinámicos: 5-15 minutos (300-900s)
// - Datos en tiempo real: 1 minuto (60s)
// - Sesiones: 24 horas (86400s)
//
// IMPORTANTE:
// - Siempre invalidar caché al actualizar/eliminar datos
// - Usar keys descriptivas y organizadas
// - Monitorear uso de memoria en Redis
// ============================================

import redis from '../config/redis.js';

class CacheService {
  // ============================================
  // CONFIGURACIÓN DE TTL (TIEMPO DE VIDA)
  // ============================================
  static TTL = {
    SHORT: 60,           // 1 minuto - datos en tiempo real
    MEDIUM: 300,         // 5 minutos - datos dinámicos
    LONG: 3600,          // 1 hora - datos estáticos
    VERY_LONG: 86400,    // 24 horas - sesiones
    WEEK: 604800,        // 7 días - datos raramente cambiantes
  };

  // ============================================
  // GUARDAR EN CACHÉ
  // ============================================
  /**
   * Guarda un valor en caché con TTL opcional
   * @param {string} key - Clave única
   * @param {any} value - Valor a cachear (será convertido a JSON)
   * @param {number} ttl - Tiempo de vida en segundos (default: 1 hora)
   */
  static async set(key, value, ttl = this.TTL.LONG) {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  // ============================================
  // OBTENER DE CACHÉ
  // ============================================
  /**
   * Obtiene un valor del caché
   * @param {string} key - Clave a buscar
   * @returns {any|null} Valor deserializado o null si no existe
   */
  static async get(key) {
    try {
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al obtener de caché:', error);
      return null;
    }
  }

  // ============================================
  // ELIMINAR DE CACHÉ
  // ============================================
  /**
   * Elimina una clave del caché
   * @param {string} key - Clave a eliminar
   */
  static async delete(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar de caché:', error);
      return false;
    }
  }

  // ============================================
  // ELIMINAR MÚLTIPLES CLAVES
  // ============================================
  /**
   * Elimina múltiples claves del caché
   * @param {string[]} keys - Array de claves a eliminar
   */
  static async deleteMany(keys) {
    try {
      if (keys.length === 0) return true;
      await redis.del(...keys);
      return true;
    } catch (error) {
      console.error('Error al eliminar múltiples claves:', error);
      return false;
    }
  }

  // ============================================
  // ELIMINAR POR PATRÓN
  // ============================================
  /**
   * Elimina todas las claves que coincidan con un patrón
   * @param {string} pattern - Patrón (ejemplo: "user:*", "property:123:*")
   */
  static async deletePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Error al eliminar por patrón:', error);
      return 0;
    }
  }

  // ============================================
  // VERIFICAR EXISTENCIA
  // ============================================
  /**
   * Verifica si una clave existe en el caché
   * @param {string} key - Clave a verificar
   * @returns {boolean}
   */
  static async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Error al verificar existencia:', error);
      return false;
    }
  }

  // ============================================
  // INCREMENTAR CONTADOR
  // ============================================
  /**
   * Incrementa un contador (útil para vistas, likes, etc)
   * @param {string} key - Clave del contador
   * @param {number} amount - Cantidad a incrementar (default: 1)
   * @returns {number} Nuevo valor del contador
   */
  static async increment(key, amount = 1) {
    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      console.error('Error al incrementar contador:', error);
      return 0;
    }
  }

  // ============================================
  // DECREMENTAR CONTADOR
  // ============================================
  /**
   * Decrementa un contador
   * @param {string} key - Clave del contador
   * @param {number} amount - Cantidad a decrementar (default: 1)
   * @returns {number} Nuevo valor del contador
   */
  static async decrement(key, amount = 1) {
    try {
      return await redis.decrby(key, amount);
    } catch (error) {
      console.error('Error al decrementar contador:', error);
      return 0;
    }
  }

  // ============================================
  // ESTABLECER TIEMPO DE EXPIRACIÓN
  // ============================================
  /**
   * Establece o actualiza el TTL de una clave existente
   * @param {string} key - Clave
   * @param {number} ttl - Tiempo de vida en segundos
   */
  static async expire(key, ttl) {
    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Error al establecer expiración:', error);
      return false;
    }
  }

  // ============================================
  // OBTENER TIEMPO RESTANTE
  // ============================================
  /**
   * Obtiene el tiempo restante de vida de una clave
   * @param {string} key - Clave
   * @returns {number} Segundos restantes (-1 si no tiene TTL, -2 si no existe)
   */
  static async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Error al obtener TTL:', error);
      return -2;
    }
  }

  // ============================================
  // LIMPIAR TODO EL CACHÉ
  // ============================================
  /**
   * ADVERTENCIA: Elimina TODAS las claves del caché
   * Usar solo en desarrollo o casos muy específicos
   */
  static async flush() {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      console.error('Error al limpiar caché:', error);
      return false;
    }
  }

  // ============================================
  // CACHEAR CON FUNCIÓN CALLBACK
  // ============================================
  /**
   * Patrón común: Buscar en caché, si no existe ejecutar función y cachear resultado
   * @param {string} key - Clave del caché
   * @param {Function} fetchFunction - Función async que obtiene los datos
   * @param {number} ttl - Tiempo de vida
   * @returns {any} Datos del caché o función
   */
  static async remember(key, fetchFunction, ttl = this.TTL.LONG) {
    try {
      // Intentar obtener del caché
      const cached = await this.get(key);
      
      if (cached !== null) {
        console.log(`✅ Cache HIT: ${key}`);
        return cached;
      }

      console.log(`❌ Cache MISS: ${key} - Ejecutando función...`);
      
      // No está en caché, ejecutar función
      const data = await fetchFunction();
      
      // Guardar en caché
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Error en remember:', error);
      // Si falla el caché, al menos retornar los datos
      return await fetchFunction();
    }
  }

  // ============================================
  // HELPERS PARA KEYS ORGANIZADAS
  // ============================================
  
  /**
   * Genera una key para usuario
   * Ejemplo: user:123 o user:123:profile
   */
  static userKey(userId, suffix = '') {
    return suffix ? `user:${userId}:${suffix}` : `user:${userId}`;
  }

  /**
   * Genera una key para propiedad
   * Ejemplo: property:456 o property:456:seasonal-prices
   */
  static propertyKey(propertyId, suffix = '') {
    return suffix ? `property:${propertyId}:${suffix}` : `property:${propertyId}`;
  }

  /**
   * Genera una key para actividad
   * Ejemplo: activity:789 o activity:789:reviews
   */
  static activityKey(activityId, suffix = '') {
    return suffix ? `activity:${activityId}:${suffix}` : `activity:${activityId}`;
  }

  /**
   * Genera una key para búsqueda
   * Ejemplo: search:activities:category:adventure:page:1
   */
  static searchKey(type, filters) {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
    return `search:${type}:${filterString}`;
  }

  /**
   * Genera una key para stats
   * Ejemplo: stats:dashboard:admin:2024-01
   */
  static statsKey(type, suffix = '') {
    return suffix ? `stats:${type}:${suffix}` : `stats:${type}`;
  }

  // ============================================
  // INVALIDACIÓN INTELIGENTE
  // ============================================
  
  /**
   * Invalida todo el caché relacionado con un usuario
   */
  static async invalidateUser(userId) {
    return await this.deletePattern(`user:${userId}:*`);
  }

  /**
   * Invalida todo el caché relacionado con una propiedad
   */
  static async invalidateProperty(propertyId) {
    const patterns = [
      `property:${propertyId}:*`,
      `search:properties:*`,
      `stats:properties:*`,
    ];
    
    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.deletePattern(pattern);
    }
    return totalDeleted;
  }

  /**
   * Invalida todo el caché relacionado con una actividad
   */
  static async invalidateActivity(activityId) {
    const patterns = [
      `activity:${activityId}:*`,
      `search:activities:*`,
      `stats:activities:*`,
    ];
    
    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.deletePattern(pattern);
    }
    return totalDeleted;
  }

  /**
   * Invalida todas las búsquedas
   */
  static async invalidateSearches() {
    return await this.deletePattern('search:*');
  }

  /**
   * Invalida todas las estadísticas
   */
  static async invalidateStats() {
    return await this.deletePattern('stats:*');
  }
}

export default CacheService;