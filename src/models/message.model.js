// src/models/message.model.js
import { prisma } from "../config/db.js";

/**
 * Crear un nuevo mensaje
 */
export async function createMessageModel(data) {
  return await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      type: data.type || 'TEXT',
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      isRead: false,
      isEdited: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Obtener mensajes de una conversación (paginados)
 */
export async function findMessagesByConversation(conversationId, options = {}) {
  const take = options.take || 50;
  const skip = options.skip || 0;
  const before = options.before; // ID del mensaje para cargar anteriores

  const where = {
    conversationId: Number(conversationId),
  };

  if (before) {
    where.id = { lt: Number(before) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' }, // Más recientes primero
    skip,
    take,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  // Revertir orden para mostrar cronológicamente
  return messages.reverse();
}

/**
 * Obtener un mensaje por ID
 */
export async function findMessageById(messageId) {
  return await prisma.message.findUnique({
    where: { id: Number(messageId) },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      conversation: {
        select: {
          id: true,
          clientId: true,
          hostId: true,
        },
      },
    },
  });
}

/**
 * Marcar mensajes como leídos
 */
export async function markMessagesAsReadModel(conversationId, userId) {
  return await prisma.message.updateMany({
    where: {
      conversationId: Number(conversationId),
      senderId: { not: userId }, // Solo los que NO envió el usuario
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Marcar un mensaje específico como leído
 */
export async function markMessageAsRead(messageId) {
  return await prisma.message.update({
    where: { id: Number(messageId) },
    data: { isRead: true },
  });
}

/**
 * Editar contenido de un mensaje
 */
export async function updateMessageContent(messageId, newContent) {
  return await prisma.message.update({
    where: { id: Number(messageId) },
    data: {
      content: newContent,
      isEdited: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Eliminar un mensaje
 */
export async function deleteMessage(messageId) {
  return await prisma.message.delete({
    where: { id: Number(messageId) },
  });
}

/**
 * Contar mensajes no leídos en una conversación para un usuario
 */
export async function countUnreadMessages(conversationId, userId) {
  return await prisma.message.count({
    where: {
      conversationId: Number(conversationId),
      senderId: { not: userId },
      isRead: false,
    },
  });
}

/**
 * Obtener el último mensaje de una conversación
 */
export async function findLastMessage(conversationId) {
  return await prisma.message.findFirst({
    where: { conversationId: Number(conversationId) },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Buscar mensajes por contenido (para función de búsqueda)
 */
export async function searchMessages(conversationId, searchTerm) {
  return await prisma.message.findMany({
    where: {
      conversationId: Number(conversationId),
      content: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });
}

/**
 * Obtener mensajes con archivos de una conversación
 */
export async function findMessagesWithFiles(conversationId) {
  return await prisma.message.findMany({
    where: {
      conversationId: Number(conversationId),
      type: { in: ['IMAGE', 'FILE'] },
      fileUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}