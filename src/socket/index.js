// src/socket/index.js
import registerChatHandlers from "./chatHandlers.js";
import registerNotificationHandlers from "./notificationHandlers.js";
import registerTypingHandlers from "./typingHandlers.js";

/**
 * Registra todos los handlers de eventos Socket.io para un socket.
 */
export default function registerSocketHandlers(io, socket) {
  registerChatHandlers(io, socket);
  registerNotificationHandlers(io, socket);
  registerTypingHandlers(io, socket);
}
