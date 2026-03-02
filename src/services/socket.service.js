// src/services/socket.service.js

let ioInstance = null;

/**
 * Guarda la instancia global de Socket.io
 */
export function setIO(io) {
  ioInstance = io;
}

/**
 * Devuelve la instancia de Socket.io o lanza error si no existe
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io no ha sido inicializado");
  }
  return ioInstance;
}

/**
 * Room de usuario para notificaciones directas
 */
export const userRoom = (userId) => `user:${userId}`;

/**
 * Emite un evento de notificación a un usuario
 */
export function emitToUser(userId, event, payload) {
  try {
    const io = getIO();
    io.to(userRoom(userId)).emit(event, payload);
  } catch (err) {
    console.error("Error emitiendo notificación por socket:", err.message);
  }
}
