// src/services/conversation.service.js
import { prisma } from "../config/db.js";
import {
  findUserConversations,
  findConversationById,
  createConversation,
  findExistingConversation,
  archiveConversation,
  closeConversation,
  reactivateConversation,
  deleteConversation,
  countUnreadConversations,
} from "../models/conversation.model.js";

/**
 * Obtener todas las conversaciones del usuario
 */
export async function getUserConversations(userId, filters = {}) {
  const conversations = await findUserConversations(userId, filters);

  // Calcular no leídos para cada conversación
  return conversations.map(conv => {
    const isClient = conv.clientId === userId;
    const unreadCount = isClient ? conv.unreadClient : conv.unreadHost;
    const otherUser = isClient ? conv.host : conv.client;

    return {
      ...conv,
      unreadCount,
      otherUser,
      isClient,
    };
  });
}

/**
 * Obtener una conversación por ID verificando acceso
 */
export async function getConversationByIdForUser(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error('No tienes acceso a esta conversación');
    error.statusCode = 403;
    throw error;
  }

  const isClient = conversation.clientId === userId;
  const unreadCount = isClient ? conversation.unreadClient : conversation.unreadHost;
  const otherUser = isClient ? conversation.host : conversation.client;

  return {
    ...conversation,
    unreadCount,
    otherUser,
    isClient,
  };
}

/**
 * Iniciar una nueva conversación o reutilizar existente
 */
export async function startConversation({
  type,
  clientId,
  hostId,
  propertyId,
  activityId,
}) {
  // Validaciones
  if (!type || !clientId || !hostId) {
    const error = new Error('Faltan campos requeridos: type, clientId, hostId');
    error.statusCode = 400;
    throw error;
  }

  // Validar tipos válidos
  const validTypes = ['PROPERTY', 'ACTIVITY', 'SUPPORT'];
  if (!validTypes.includes(type)) {
    const error = new Error('Tipo de conversación inválido');
    error.statusCode = 400;
    throw error;
  }

  // Verificar que client y host existan
  const [client, host] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId } }),
    prisma.user.findUnique({ where: { id: hostId } }),
  ]);

  if (!client) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!host) {
    const error = new Error('Host no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que la propiedad o actividad exista si se proporciona
  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      const error = new Error('Propiedad no encontrada');
      error.statusCode = 404;
      throw error;
    }
  }

  if (activityId) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) {
      const error = new Error('Actividad no encontrada');
      error.statusCode = 404;
      throw error;
    }
  }

  // Buscar conversación existente
  const existing = await findExistingConversation({
    type,
    clientId,
    hostId,
    propertyId,
    activityId,
  });

  if (existing) {
    // Si está archivada o cerrada, reactivarla
    if (existing.status !== 'ACTIVE') {
      return await reactivateConversation(existing.id);
    }
    return existing;
  }

  // Crear nueva conversación
  const conversation = await createConversation({
    type,
    clientId,
    hostId,
    propertyId,
    activityId,
  });

  return conversation;
}

/**
 * Archivar una conversación
 */
export async function archiveConversationService(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error('No tienes acceso a esta conversación');
    error.statusCode = 403;
    throw error;
  }

  return await archiveConversation(conversationId);
}

/**
 * Cerrar una conversación
 */
export async function closeConversationService(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error('No tienes acceso a esta conversación');
    error.statusCode = 403;
    throw error;
  }

  return await closeConversation(conversationId);
}

/**
 * Reactivar una conversación archivada/cerrada
 */
export async function reactivateConversationService(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);

  if (!conversation) {
    const error = new Error('No tienes acceso a esta conversación');
    error.statusCode = 403;
    throw error;
  }

  return await reactivateConversation(conversationId);
}

/**
 * Eliminar una conversación (solo ADMIN)
 */
export async function deleteConversationService(conversationId, userRole) {
  if (userRole !== 'ADMIN') {
    const error = new Error('Solo los administradores pueden eliminar conversaciones');
    error.statusCode = 403;
    throw error;
  }

  return await deleteConversation(conversationId);
}

/**
 * Obtener contador de conversaciones no leídas
 */
export async function getUnreadConversationsCount(userId) {
  return await countUnreadConversations(userId);
}

/**
 * Obtener estadísticas de conversaciones del usuario
 */
export async function getConversationStats(userId) {
  const [total, active, archived, unreadCount] = await Promise.all([
    prisma.conversation.count({
      where: {
        OR: [{ clientId: userId }, { hostId: userId }],
      },
    }),
    prisma.conversation.count({
      where: {
        OR: [{ clientId: userId }, { hostId: userId }],
        status: 'ACTIVE',
      },
    }),
    prisma.conversation.count({
      where: {
        OR: [{ clientId: userId }, { hostId: userId }],
        status: 'ARCHIVED',
      },
    }),
    countUnreadConversations(userId),
  ]);

  return {
    total,
    active,
    archived,
    unread: unreadCount,
  };
}