// src/socket/chatHandlers.js
import {
  getConversationByIdForUser,
  startConversation,
} from "../services/conversation.service.js";
import {
  createMessage,
  markMessagesAsRead,
  getConversationMessages,
} from "../services/message.service.js";

const roomName = (conversationId) => `conversation:${conversationId}`;

export default function registerChatHandlers(io, socket) {
  const user = socket.user;

  console.log(`📬 Chat handlers registrados para usuario: ${user.email}`);

  // ========================================
  // UNIRSE A UNA CONVERSACIÓN
  // ========================================
  socket.on("conversation:join", async (data, callback) => {
    try {
      const conversationId = Number(data.conversationId);

      if (!conversationId || isNaN(conversationId)) {
        callback?.({ ok: false, error: "ID de conversación inválido" });
        return;
      }

      const conversation = await getConversationByIdForUser(
        conversationId,
        user.id
      );

      if (!conversation) {
        callback?.({ ok: false, error: "No tienes acceso a esta conversación" });
        return;
      }

      // Unirse al room
      socket.join(roomName(conversationId));

      console.log(
        `✅ ${user.email} se unió a la conversación #${conversationId}`
      );

      // Notificar al otro usuario que estamos online
      socket.to(roomName(conversationId)).emit("user:online", {
        conversationId,
        userId: user.id,
        userName: user.name,
      });

      callback?.({
        ok: true,
        conversationId,
        message: "Unido a la conversación correctamente",
      });
    } catch (err) {
      console.error("❌ conversation:join error:", err);
      callback?.({
        ok: false,
        error: err.message || "Error al unirse a la conversación",
      });
    }
  });

  // ========================================
  // SALIR DE UNA CONVERSACIÓN
  // ========================================
  socket.on("conversation:leave", async (data, callback) => {
    try {
      const conversationId = Number(data.conversationId);

      socket.leave(roomName(conversationId));

      // Notificar que el usuario salió
      socket.to(roomName(conversationId)).emit("user:offline", {
        conversationId,
        userId: user.id,
        userName: user.name,
      });

      console.log(`👋 ${user.email} salió de la conversación #${conversationId}`);

      callback?.({ ok: true });
    } catch (err) {
      console.error("❌ conversation:leave error:", err);
      callback?.({ ok: false, error: "Error al salir de la conversación" });
    }
  });

  // ========================================
  // INICIAR NUEVA CONVERSACIÓN
  // ========================================
  socket.on("conversation:start", async (data, callback) => {
    try {
      const { type, propertyId, activityId, hostId } = data;

      if (!type || !hostId) {
        callback?.({ ok: false, error: "Faltan campos requeridos: type, hostId" });
        return;
      }

      const validTypes = ['PROPERTY', 'ACTIVITY', 'SUPPORT'];
      if (!validTypes.includes(type)) {
        callback?.({ ok: false, error: "Tipo de conversación inválido" });
        return;
      }

      const conversation = await startConversation({
        type,
        propertyId: propertyId ? Number(propertyId) : undefined,
        activityId: activityId ? Number(activityId) : undefined,
        clientId: user.id,
        hostId: Number(hostId),
      });

      // Unirse automáticamente al room
      socket.join(roomName(conversation.id));

      console.log(
        `🆕 ${user.email} inició conversación #${conversation.id} con host #${hostId}`
      );

      // Notificar al host que hay una nueva conversación
      io.to(`user:${hostId}`).emit("conversation:new", {
        conversation,
        from: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });

      callback?.({ ok: true, conversation });
    } catch (err) {
      console.error("❌ conversation:start error:", err);
      callback?.({
        ok: false,
        error: err.message || "Error al iniciar la conversación",
      });
    }
  });

  // ========================================
  // ENVIAR MENSAJE
  // ========================================
  socket.on("message:send", async (data, callback) => {
    try {
      const { conversationId, content, type, fileUrl, fileName } = data;

      if (!conversationId || !content) {
        callback?.({ ok: false, error: "Faltan campos requeridos" });
        return;
      }

      if (content.trim().length === 0) {
        callback?.({ ok: false, error: "El mensaje no puede estar vacío" });
        return;
      }

      const message = await createMessage({
        conversationId: Number(conversationId),
        senderId: user.id,
        content: content.trim(),
        type: type || 'TEXT',
        fileUrl,
        fileName,
      });

      console.log(
        `💬 ${user.email} envió mensaje en conversación #${conversationId}`
      );

      // Emitir a todos en el room de la conversación
      io.to(roomName(message.conversationId)).emit("message:new", {
        ...message,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
        },
      });

      callback?.({ ok: true, message });
    } catch (err) {
      console.error("❌ message:send error:", err);
      callback?.({
        ok: false,
        error: err.message || "Error al enviar mensaje",
      });
    }
  });

  // ========================================
  // MARCAR MENSAJES COMO LEÍDOS
  // ========================================
  socket.on("message:read", async (data, callback) => {
    try {
      const conversationId = Number(data.conversationId);

      if (!conversationId || isNaN(conversationId)) {
        callback?.({ ok: false, error: "ID de conversación inválido" });
        return;
      }

      await markMessagesAsRead(conversationId, user.id);

      console.log(
        `✅ ${user.email} marcó mensajes como leídos en conversación #${conversationId}`
      );

      // Notificar al otro usuario
      io.to(roomName(conversationId)).emit("message:read:update", {
        conversationId,
        userId: user.id,
      });

      callback?.({ ok: true });
    } catch (err) {
      console.error("❌ message:read error:", err);
      callback?.({ ok: false, error: err.message || "Error al marcar como leído" });
    }
  });

  // ========================================
  // CARGAR MENSAJES ANTERIORES (PAGINACIÓN)
  // ========================================
  socket.on("messages:load", async (data, callback) => {
    try {
      const { conversationId, before, take } = data;

      if (!conversationId) {
        callback?.({ ok: false, error: "ID de conversación requerido" });
        return;
      }

      const options = {
        take: take || 50,
        before: before || undefined,
      };

      const messages = await getConversationMessages(
        Number(conversationId),
        user.id,
        options
      );

      console.log(
        `📥 ${user.email} cargó ${messages.length} mensajes anteriores en conversación #${conversationId}`
      );

      callback?.({
        ok: true,
        messages,
        hasMore: messages.length === options.take,
      });
    } catch (err) {
      console.error("❌ messages:load error:", err);
      callback?.({ ok: false, error: err.message || "Error al cargar mensajes" });
    }
  });

  // ========================================
  // MANEJO DE DESCONEXIÓN
  // ========================================
  socket.on("disconnect", () => {
    console.log(`🔌 ${user.email} desconectado del chat`);
    // Los rooms se limpian automáticamente al desconectar
  });
}