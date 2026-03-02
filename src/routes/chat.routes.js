// src/routes/chat.routes.js
import { Router } from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  // Conversaciones
  getConversations,
  getConversationById,
  createConversation,
  archiveConversation,
  closeConversation,
  reactivateConversation,
  deleteConversation,
  getUnreadCount,
  getChatStats,
  // Mensajes
  getMessages,
  sendMessage,
  markAsRead,
  updateMessage,
  deleteMessage,
  getMessageUnreadCount,
  searchMessages,
  getFiles,
  // Health
  chatHealthController,
} from "../controllers/chat.controller.js";

const router = Router();

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/chat/health
 * Verificar que el módulo de chat funciona
 */
router.get("/health", verifyToken, chatHealthController);

// ========================================
// ESTADÍSTICAS
// ========================================

/**
 * GET /api/chat/stats
 * Obtener estadísticas de conversaciones
 * Requiere: autenticación
 */
router.get("/stats", verifyToken, getChatStats);

// ========================================
// CONVERSACIONES - RUTAS ESPECÍFICAS PRIMERO
// ========================================

/**
 * GET /api/chat/conversations/unread/count
 * Obtener número de conversaciones con mensajes no leídos
 * Requiere: autenticación
 * IMPORTANTE: Esta ruta DEBE ir antes de /:id
 */
router.get("/conversations/unread/count", verifyToken, getUnreadCount);

/**
 * GET /api/chat/conversations
 * Obtener todas las conversaciones del usuario
 * Query params: ?status=ACTIVE&type=PROPERTY
 * Requiere: autenticación
 */
router.get("/conversations", verifyToken, getConversations);

/**
 * POST /api/chat/conversations
 * Crear una nueva conversación
 * Body: { type, hostId, propertyId?, activityId? }
 * Requiere: autenticación
 */
router.post("/conversations", verifyToken, createConversation);

/**
 * GET /api/chat/conversations/:id
 * Obtener detalles de una conversación
 * Requiere: autenticación, ser parte de la conversación
 */
router.get("/conversations/:id", verifyToken, getConversationById);

/**
 * PATCH /api/chat/conversations/:id/archive
 * Archivar una conversación
 * Requiere: autenticación, ser parte de la conversación
 */
router.patch("/conversations/:id/archive", verifyToken, archiveConversation);

/**
 * PATCH /api/chat/conversations/:id/close
 * Cerrar una conversación
 * Requiere: autenticación, ser parte de la conversación
 */
router.patch("/conversations/:id/close", verifyToken, closeConversation);

/**
 * PATCH /api/chat/conversations/:id/reactivate
 * Reactivar una conversación archivada/cerrada
 * Requiere: autenticación, ser parte de la conversación
 */
router.patch("/conversations/:id/reactivate", verifyToken, reactivateConversation);

/**
 * DELETE /api/chat/conversations/:id
 * Eliminar una conversación (solo ADMIN)
 * Requiere: autenticación, rol ADMIN
 */
router.delete(
  "/conversations/:id",
  verifyToken,
  checkRole([ROLES.ADMIN]),
  deleteConversation
);

// ========================================
// MENSAJES - RUTAS ESPECÍFICAS PRIMERO
// ========================================

/**
 * GET /api/chat/conversations/:id/messages/unread/count
 * Obtener contador de mensajes no leídos
 * Requiere: autenticación, acceso a la conversación
 * IMPORTANTE: Esta ruta DEBE ir antes de /conversations/:id/messages/:messageId
 */
router.get(
  "/conversations/:id/messages/unread/count",
  verifyToken,
  getMessageUnreadCount
);

/**
 * GET /api/chat/conversations/:id/messages/search
 * Buscar mensajes en una conversación
 * Query params: ?q=texto_de_busqueda
 * Requiere: autenticación, acceso a la conversación
 * IMPORTANTE: Esta ruta DEBE ir antes de /conversations/:id/messages/:messageId
 */
router.get("/conversations/:id/messages/search", verifyToken, searchMessages);

/**
 * GET /api/chat/conversations/:id/files
 * Obtener archivos compartidos en una conversación
 * Requiere: autenticación, acceso a la conversación
 */
router.get("/conversations/:id/files", verifyToken, getFiles);

/**
 * GET /api/chat/conversations/:id/messages
 * Obtener mensajes de una conversación
 * Query params: ?take=50&skip=0&before=123
 * Requiere: autenticación, acceso a la conversación
 */
router.get("/conversations/:id/messages", verifyToken, getMessages);

/**
 * POST /api/chat/conversations/:id/messages
 * Enviar un mensaje en una conversación
 * Body: { content, type?, fileUrl?, fileName? }
 * Requiere: autenticación, ser parte de la conversación
 */
router.post("/conversations/:id/messages", verifyToken, sendMessage);

/**
 * PATCH /api/chat/conversations/:id/messages/read
 * Marcar todos los mensajes de una conversación como leídos
 * Requiere: autenticación, acceso a la conversación
 */
router.patch("/conversations/:id/messages/read", verifyToken, markAsRead);

/**
 * PUT /api/chat/messages/:messageId
 * Editar un mensaje
 * Body: { content }
 * Requiere: autenticación, ser el autor del mensaje
 */
router.put("/messages/:messageId", verifyToken, updateMessage);

/**
 * DELETE /api/chat/messages/:messageId
 * Eliminar un mensaje
 * Requiere: autenticación, ser el autor o ADMIN
 */
router.delete("/messages/:messageId", verifyToken, deleteMessage);

export default router;