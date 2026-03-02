// src/controllers/chat.controller.js
import {
  getUserConversations,
  getConversationByIdForUser,
  startConversation,
  archiveConversationService,
  closeConversationService,
  reactivateConversationService,
  deleteConversationService,
  getUnreadConversationsCount,
  getConversationStats,
} from "../services/conversation.service.js";
import {
  createMessage,
  getConversationMessages,
  markMessagesAsRead,
  editMessage,
  removeMessage,
  getUnreadMessagesCount,
  searchConversationMessages,
  getSharedFiles,
} from "../services/message.service.js";

// ========================================
// CONVERSACIONES
// ========================================

/**
 * GET /api/chat/conversations
 * Obtener todas las conversaciones del usuario
 * Query params: status, type
 */
export async function getConversations(req, res) {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const conversations = await getUserConversations(userId, filters);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (err) {
    console.error("Error al obtener conversaciones:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al obtener conversaciones",
    });
  }
}

/**
 * GET /api/chat/conversations/:id
 * Obtener detalles de una conversación específica
 */
export async function getConversationById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await getConversationByIdForUser(Number(id), userId);

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (err) {
    console.error("Error al obtener conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al obtener conversación",
    });
  }
}

/**
 * POST /api/chat/conversations
 * Iniciar una nueva conversación
 * Body: { type, hostId, propertyId?, activityId? }
 */
export async function createConversation(req, res) {
  try {
    const userId = req.user.id;
    const { type, hostId, propertyId, activityId } = req.body;

    const conversation = await startConversation({
      type,
      clientId: userId,
      hostId: Number(hostId),
      propertyId: propertyId ? Number(propertyId) : undefined,
      activityId: activityId ? Number(activityId) : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Conversación iniciada correctamente",
      conversation,
    });
  } catch (err) {
    console.error("Error al crear conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al crear conversación",
    });
  }
}

/**
 * PATCH /api/chat/conversations/:id/archive
 * Archivar una conversación
 */
export async function archiveConversation(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await archiveConversationService(Number(id), userId);

    res.status(200).json({
      success: true,
      message: "Conversación archivada correctamente",
      conversation,
    });
  } catch (err) {
    console.error("Error al archivar conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al archivar conversación",
    });
  }
}

/**
 * PATCH /api/chat/conversations/:id/close
 * Cerrar una conversación
 */
export async function closeConversation(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await closeConversationService(Number(id), userId);

    res.status(200).json({
      success: true,
      message: "Conversación cerrada correctamente",
      conversation,
    });
  } catch (err) {
    console.error("Error al cerrar conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al cerrar conversación",
    });
  }
}

/**
 * PATCH /api/chat/conversations/:id/reactivate
 * Reactivar una conversación archivada/cerrada
 */
export async function reactivateConversation(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await reactivateConversationService(Number(id), userId);

    res.status(200).json({
      success: true,
      message: "Conversación reactivada correctamente",
      conversation,
    });
  } catch (err) {
    console.error("Error al reactivar conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al reactivar conversación",
    });
  }
}

/**
 * DELETE /api/chat/conversations/:id
 * Eliminar conversación (solo ADMIN)
 */
export async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    await deleteConversationService(Number(id), userRole);

    res.status(200).json({
      success: true,
      message: "Conversación eliminada correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar conversación:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al eliminar conversación",
    });
  }
}

/**
 * GET /api/chat/conversations/unread/count
 * Obtener número de conversaciones con mensajes no leídos
 */
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await getUnreadConversationsCount(userId);

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error("Error al obtener contador:", err);
    res.status(500).json({
      success: false,
      error: "Error al obtener contador de no leídos",
    });
  }
}

/**
 * GET /api/chat/stats
 * Obtener estadísticas de conversaciones del usuario
 */
export async function getChatStats(req, res) {
  try {
    const userId = req.user.id;
    const stats = await getConversationStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas",
    });
  }
}

// ========================================
// MENSAJES
// ========================================

/**
 * GET /api/chat/conversations/:id/messages
 * Obtener mensajes de una conversación
 * Query params: take, skip, before
 */
export async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { take, skip, before } = req.query;

    const options = {};
    if (take) options.take = Number(take);
    if (skip) options.skip = Number(skip);
    if (before) options.before = Number(before);

    const messages = await getConversationMessages(Number(id), userId, options);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al obtener mensajes",
    });
  }
}

/**
 * POST /api/chat/conversations/:id/messages
 * Enviar un mensaje en una conversación
 * Body: { content, type?, fileUrl?, fileName? }
 */
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, type, fileUrl, fileName } = req.body;

    const message = await createMessage({
      conversationId: Number(id),
      senderId: userId,
      content,
      type,
      fileUrl,
      fileName,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al enviar mensaje",
    });
  }
}

/**
 * PATCH /api/chat/conversations/:id/messages/read
 * Marcar mensajes como leídos
 */
export async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await markMessagesAsRead(Number(id), userId);

    res.status(200).json({
      success: true,
      message: "Mensajes marcados como leídos",
    });
  } catch (err) {
    console.error("Error al marcar como leído:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al marcar mensajes como leídos",
    });
  }
}

/**
 * PUT /api/chat/messages/:messageId
 * Editar un mensaje
 * Body: { content }
 */
export async function updateMessage(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await editMessage(Number(messageId), userId, content);

    res.status(200).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error("Error al editar mensaje:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al editar mensaje",
    });
  }
}

/**
 * DELETE /api/chat/messages/:messageId
 * Eliminar un mensaje
 */
export async function deleteMessage(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { messageId } = req.params;

    await removeMessage(Number(messageId), userId, userRole);

    res.status(200).json({
      success: true,
      message: "Mensaje eliminado correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar mensaje:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al eliminar mensaje",
    });
  }
}

/**
 * GET /api/chat/conversations/:id/messages/unread/count
 * Obtener contador de mensajes no leídos en una conversación
 */
export async function getMessageUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const count = await getUnreadMessagesCount(Number(id), userId);

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error("Error al obtener contador:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al obtener contador",
    });
  }
}

/**
 * GET /api/chat/conversations/:id/messages/search
 * Buscar mensajes en una conversación
 * Query params: q (query)
 */
export async function searchMessages(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { q } = req.query;

    const messages = await searchConversationMessages(Number(id), userId, q);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    console.error("Error al buscar mensajes:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al buscar mensajes",
    });
  }
}

/**
 * GET /api/chat/conversations/:id/files
 * Obtener archivos compartidos en una conversación
 */
export async function getFiles(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const files = await getSharedFiles(Number(id), userId);

    res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (err) {
    console.error("Error al obtener archivos:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Error al obtener archivos",
    });
  }
}

/**
 * GET /api/chat/health
 * Health check
 */
export async function chatHealthController(req, res) {
  res.json({
    success: true,
    message: "Chat module is up and running",
  });
}