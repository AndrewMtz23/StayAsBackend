// ============================================
// REDIS CONFIGURATION
// ============================================
// Este archivo configura la conexión a Redis para:
// 1. Sistema de caché (cache_service.js)
// 2. Sesiones de usuario (opcional)
// 3. Rate limiting (opcional)
// 4. Colas de trabajo (opcional)
//
// REQUISITOS:
// - Redis instalado y corriendo: redis-server
// - Variable de entorno REDIS_URL en .env (opcional)
//
// COMANDOS ÚTILES:
// - Verificar si Redis está corriendo: redis-cli ping
// - Ver todas las keys: redis-cli KEYS *
// - Limpiar todo: redis-cli FLUSHALL
// ============================================

import { createClient } from 'redis';

// ============================================
// CONFIGURACIÓN DE CONEXIÓN
// ============================================

const redisConfig = {
  // URL de conexión (prioridad: env variable > localhost)
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Base de datos (0-15, default: 0)
  database: parseInt(process.env.REDIS_DB || '0'),
  
  // Configuración de reconexión
  socket: {
    reconnectStrategy: (retries) => {
      // Intentar reconectar cada 3 segundos, máximo 10 intentos
      if (retries > 10) {
        console.error('Redis: Demasiados intentos de reconexión. Deteniendo...');
        return new Error('Demasiados intentos de reconexión');
      }
      console.log(`Redis: Reintentando conexión (${retries}/10)...`);
      return 3000; // 3 segundos
    },
  },
  
  // Timeout de comandos (30 segundos)
  commandsQueueMaxLength: 1000,
};

// ============================================
// CREAR CLIENTE DE REDIS
// ============================================

const redis = createClient(redisConfig);

// ============================================
// MANEJO DE EVENTOS
// ============================================

// Evento: Conexión exitosa
redis.on('connect', () => {
  console.log('Redis: Conectando...');
});

redis.on('ready', () => {
  console.log('Redis: Conexión establecida y lista');
});

// Evento: Error
redis.on('error', (err) => {
  console.error('Redis Error:', err.message);
  
  // Si es error de conexión, no crashear la app
  if (err.code === 'ECONNREFUSED') {
    console.error('⚠️  Redis no está corriendo. Ejecuta: redis-server');
  }
});

// Evento: Reconexión
redis.on('reconnecting', () => {
  console.log('Redis: Intentando reconectar...');
});

// Evento: Desconexión
redis.on('end', () => {
  console.log('Redis: Conexión cerrada');
});

// ============================================
// CONECTAR AL INICIAR
// ============================================

const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
      console.log('✅ Redis conectado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al conectar Redis:', error.message);
    console.error('⚠️  La aplicación continuará sin Redis (caché deshabilitado)');
    // No lanzar error para que la app pueda funcionar sin Redis
  }
};

// Conectar automáticamente
connectRedis();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Cerrar conexión al terminar el proceso
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando conexión a Redis...');
  try {
    await redis.quit();
    console.log('✅ Redis desconectado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar Redis:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM recibido. Cerrando Redis...');
  try {
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar Redis:', error);
    process.exit(1);
  }
});

// ============================================
// FUNCIONES HELPER (OPCIONALES)
// ============================================

/**
 * Verifica si Redis está conectado y funcionando
 */
export const isRedisConnected = () => {
  return redis.isOpen;
};

/**
 * Hace ping a Redis para verificar que responde
 */
export const pingRedis = async () => {
  try {
    const response = await redis.ping();
    return response === 'PONG';
  } catch (error) {
    console.error('Redis ping failed:', error);
    return false;
  }
};

/**
 * Obtiene información sobre Redis
 */
export const getRedisInfo = async () => {
  try {
    const info = await redis.info();
    return info;
  } catch (error) {
    console.error('Error obteniendo info de Redis:', error);
    return null;
  }
};

/**
 * Obtiene el número de keys en la base de datos actual
 */
export const getKeyCount = async () => {
  try {
    const count = await redis.dbSize();
    return count;
  } catch (error) {
    console.error('Error obteniendo cantidad de keys:', error);
    return 0;
  }
};

// ============================================
// EXPORTAR CLIENTE
// ============================================

export default redis;

// También exportar el cliente con nombre (para compatibilidad)
export { redis };