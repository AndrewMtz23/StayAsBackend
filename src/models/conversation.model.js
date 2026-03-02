// src/models/conversation.model.js
import { prisma } from "../config/db.js";

/**
 * Obtener todas las conversaciones de un usuario (como cliente o host)
 */
export async function findUserConversations(userId, filters = {}) {
  const where = {
    OR: [
      { clientId: userId },
      { hostId: userId }
    ]
  };

  // Filtro por estado
  if (filters.status) {
    where.status = filters.status;
  }

  // Filtro por tipo
  if (filters.type) {
    where.type = filters.type;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: {
      lastMessageAt: 'desc', // Más recientes primero
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          media: {
            take: 1,
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
        },
      },
      activity: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          media: {
            take: 1,
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return conversations;
}

/**
 * Obtener una conversación por ID verificando que el usuario tenga acceso
 */
export async function findConversationById(conversationId, userId) {
  return await prisma.conversation.findFirst({
    where: {
      id: Number(conversationId),
      OR: [
        { clientId: userId },
        { hostId: userId }
      ]
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          state: true,
          media: {
            take: 1,
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
        },
      },
      activity: {
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          state: true,
          media: {
            take: 1,
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
        },
      },
    },
  });
}

/**
 * Crear una nueva conversación
 */
export async function createConversation(data) {
  return await prisma.conversation.create({
    data: {
      type: data.type,
      clientId: data.clientId,
      hostId: data.hostId,
      propertyId: data.propertyId || null,
      activityId: data.activityId || null,
      status: 'ACTIVE',
    },
    include: {
      client: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
      host: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
      property: {
        select: { id: true, title: true },
      },
      activity: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Buscar conversación existente entre dos usuarios para un item específico
 */
export async function findExistingConversation({
  type,
  clientId,
  hostId,
  propertyId,
  activityId,
}) {
  const where = {
    type,
    clientId,
    hostId,
    status: 'ACTIVE',
  };

  if (propertyId) {
    where.propertyId = propertyId;
  }

  if (activityId) {
    where.activityId = activityId;
  }

  return await prisma.conversation.findFirst({
    where,
    include: {
      client: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
      host: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
    },
  });
}

/**
 * Actualizar última actividad de conversación
 */
export async function updateConversationActivity(conversationId, lastMessage) {
  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: {
      lastMessage: lastMessage || null,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Incrementar contador de no leídos
 */
export async function incrementUnreadCount(conversationId, isClientSender) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(conversationId) },
  });

  if (!conversation) {
    throw new Error('Conversación no encontrada');
  }

  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: {
      unreadClient: isClientSender
        ? conversation.unreadClient
        : conversation.unreadClient + 1,
      unreadHost: isClientSender
        ? conversation.unreadHost + 1
        : conversation.unreadHost,
    },
  });
}

/**
 * Resetear contador de no leídos para un usuario
 */
export async function resetUnreadCount(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(conversationId) },
  });

  if (!conversation) {
    throw new Error('Conversación no encontrada');
  }

  const isClient = userId === conversation.clientId;

  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: isClient ? { unreadClient: 0 } : { unreadHost: 0 },
  });
}

/**
 * Archivar conversación
 */
export async function archiveConversation(conversationId) {
  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: { status: 'ARCHIVED' },
  });
}

/**
 * Cerrar conversación
 */
export async function closeConversation(conversationId) {
  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: { status: 'CLOSED' },
  });
}

/**
 * Reactivar conversación
 */
export async function reactivateConversation(conversationId) {
  return await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: { status: 'ACTIVE' },
  });
}

/**
 * Eliminar conversación (solo admins)
 */
export async function deleteConversation(conversationId) {
  return await prisma.conversation.delete({
    where: { id: Number(conversationId) },
  });
}

/**
 * Contar conversaciones no leídas del usuario
 */
export async function countUnreadConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { clientId: userId, unreadClient: { gt: 0 } },
        { hostId: userId, unreadHost: { gt: 0 } },
      ],
      status: 'ACTIVE',
    },
  });

  return conversations.length;
}