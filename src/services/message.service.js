// src/services/message.service.js
import { prisma } from "../config/db.js";
import {
  createMessageModel,
  findMessagesByConversation,
  findMessageById,
  markMessagesAsReadModel,
  updateMessageContent,
  deleteMessage,
  countUnreadMessages,
  searchMessages,
  findMessagesWithFiles,
} from "../models/message.model.js";
import {
  findConversationById,
  updateConversationActivity,
  incrementUnreadCount,
  resetUnreadCount,
} from "../models/conversation.model.js";

/**
 * Crear un mensaje en una conversación
 */
export async function createMessage({
  conversationId,
  senderId,
  content,
  type = "TEXT",
  fileUrl,
  fileName,
}) {
  // Verificar que la conversación existe
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(conversationId) },
  });

  if (!conversation) {
    const error = new Error("Conversación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario es parte de la conversación
  if (senderId !== conversation.clientId && senderId !== conversation.hostId) {
    const error = new Error("No tienes permiso para enviar mensajes aquí");
    error.statusCode = 403;
    throw error;
  }

  // Validar tipo de mensaje
  const validTypes = ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'];
  if (!validTypes.includes(type)) {
    const error = new Error("Tipo de mensaje inválido");
    error.statusCode = 400;
    throw error;
  }

  // Validar contenido
  if (!content || content.trim().length === 0) {
    const error = new Error("El contenido del mensaje no puede estar vacío");
    error.statusCode = 400;
    throw error;
  }

  if (content.length > 5000) {
    const error = new Error("El mensaje es demasiado largo (máximo 5000 caracteres)");
    error.statusCode = 400;
    throw error;
  }

  // Crear el mensaje
  const message = await createMessageModel({
    conversationId: Number(conversationId),
    senderId,
    content: content.trim(),
    type,
    fileUrl,
    fileName,
  });

  // Actualizar conversación
  const isClientSender = senderId === conversation.clientId;
  
  await updateConversationActivity(conversationId, content.substring(0, 100));
  await incrementUnreadCount(conversationId, isClientSender);

  return message;
}

/**
 * Obtener mensajes de una conversación
 */
export async function getConversationMessages(conversationId, userId, options = {}) {
  // Verificar acceso a la conversación
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error("No tienes acceso a esta conversación");
    error.statusCode = 403;
    throw error;
  }

  const messages = await findMessagesByConversation(conversationId, options);

  return messages;
}

/**
 * Marcar mensajes como leídos
 */
export async function markMessagesAsRead(conversationId, userId) {
  // Verificar acceso
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error("No tienes acceso a esta conversación");
    error.statusCode = 403;
    throw error;
  }

  // Marcar mensajes como leídos
  await markMessagesAsReadModel(conversationId, userId);

  // Resetear contador de no leídos
  await resetUnreadCount(conversationId, userId);

  return { success: true };
}

/**
 * Editar un mensaje (solo el remitente puede editar)
 */
export async function editMessage(messageId, userId, newContent) {
  const message = await findMessageById(messageId);

  if (!message) {
    const error = new Error("Mensaje no encontrado");
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario es el remitente
  if (message.senderId !== userId) {
    const error = new Error("Solo puedes editar tus propios mensajes");
    error.statusCode = 403;
    throw error;
  }

  // Validar nuevo contenido
  if (!newContent || newContent.trim().length === 0) {
    const error = new Error("El contenido no puede estar vacío");
    error.statusCode = 400;
    throw error;
  }

  if (newContent.length > 5000) {
    const error = new Error("El mensaje es demasiado largo");
    error.statusCode = 400;
    throw error;
  }

  const updated = await updateMessageContent(messageId, newContent.trim());

  return updated;
}

/**
 * Eliminar un mensaje (solo el remitente o ADMIN)
 */
export async function removeMessage(messageId, userId, userRole) {
  const message = await findMessageById(messageId);

  if (!message) {
    const error = new Error("Mensaje no encontrado");
    error.statusCode = 404;
    throw error;
  }

  // Solo el remitente o ADMIN pueden eliminar
  if (message.senderId !== userId && userRole !== 'ADMIN') {
    const error = new Error("No tienes permiso para eliminar este mensaje");
    error.statusCode = 403;
    throw error;
  }

  await deleteMessage(messageId);

  return { success: true, message: "Mensaje eliminado correctamente" };
}

/**
 * Obtener contador de mensajes no leídos
 */
export async function getUnreadMessagesCount(conversationId, userId) {
  // Verificar acceso
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error("No tienes acceso a esta conversación");
    error.statusCode = 403;
    throw error;
  }

  return await countUnreadMessages(conversationId, userId);
}

/**
 * Buscar mensajes en una conversación
 */
export async function searchConversationMessages(conversationId, userId, searchTerm) {
  // Verificar acceso
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error("No tienes acceso a esta conversación");
    error.statusCode = 403;
    throw error;
  }

  if (!searchTerm || searchTerm.trim().length < 2) {
    const error = new Error("El término de búsqueda debe tener al menos 2 caracteres");
    error.statusCode = 400;
    throw error;
  }

  return await searchMessages(conversationId, searchTerm);
}

/**
 * Obtener archivos compartidos en una conversación
 */
export async function getSharedFiles(conversationId, userId) {
  // Verificar acceso
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error("No tienes acceso a esta conversación");
    error.statusCode = 403;
    throw error;
  }

  return await findMessagesWithFiles(conversationId);
}