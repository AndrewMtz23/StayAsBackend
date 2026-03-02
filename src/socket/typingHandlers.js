// src/socket/typingHandlers.js

const roomName = (conversationId) => `conversation:${conversationId}`;

/**
 * Maneja eventos de "usuario está escribiendo" en una conversación
 * Incluye auto-stop después de 3 segundos de inactividad
 */
export default function registerTypingHandlers(io, socket) {
  const user = socket.user;

  // Almacenar timeouts de typing para cada conversación
  const typingTimeouts = new Map();

  console.log(`⌨️  Typing handlers registrados para usuario: ${user.email}`);

  // ========================================
  // USUARIO EMPEZÓ A ESCRIBIR
  // ========================================
  socket.on("typing:start", (data) => {
    try {
      const conversationId = Number(data.conversationId);

      if (!conversationId || isNaN(conversationId)) {
        console.warn(`⚠️  typing:start - ID inválido:`, data.conversationId);
        return;
      }

      // Limpiar timeout previo si existe
      if (typingTimeouts.has(conversationId)) {
        clearTimeout(typingTimeouts.get(conversationId));
      }

      // Emitir a los demás usuarios en la conversación
      socket.to(roomName(conversationId)).emit("typing:update", {
        conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: true,
      });

      console.log(
        `✍️  ${user.email} está escribiendo en conversación #${conversationId}`
      );

      // Auto-stop después de 3 segundos de inactividad
      const timeout = setTimeout(() => {
        socket.to(roomName(conversationId)).emit("typing:update", {
          conversationId,
          userId: user.id,
          userName: user.name,
          isTyping: false,
        });

        typingTimeouts.delete(conversationId);

        console.log(
          `⏰ Auto-stop typing para ${user.email} en conversación #${conversationId}`
        );
      }, 3000);

      typingTimeouts.set(conversationId, timeout);
    } catch (err) {
      console.error("❌ typing:start error:", err);
    }
  });

  // ========================================
  // USUARIO DEJÓ DE ESCRIBIR
  // ========================================
  socket.on("typing:stop", (data) => {
    try {
      const conversationId = Number(data.conversationId);

      if (!conversationId || isNaN(conversationId)) {
        console.warn(`⚠️  typing:stop - ID inválido:`, data.conversationId);
        return;
      }

      // Limpiar timeout si existe
      if (typingTimeouts.has(conversationId)) {
        clearTimeout(typingTimeouts.get(conversationId));
        typingTimeouts.delete(conversationId);
      }

      // Emitir a los demás usuarios
      socket.to(roomName(conversationId)).emit("typing:update", {
        conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: false,
      });

      console.log(
        `🛑 ${user.email} dejó de escribir en conversación #${conversationId}`
      );
    } catch (err) {
      console.error("❌ typing:stop error:", err);
    }
  });

  // ========================================
  // LIMPIAR AL DESCONECTAR
  // ========================================
  socket.on("disconnect", () => {
    // Limpiar todos los timeouts
    typingTimeouts.forEach((timeout, conversationId) => {
      clearTimeout(timeout);

      // Emitir typing:stop a todas las conversaciones
      socket.to(roomName(conversationId)).emit("typing:update", {
        conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: false,
      });
    });

    typingTimeouts.clear();

    console.log(`🧹 Timeouts de typing limpiados para ${user.email}`);
  });
}