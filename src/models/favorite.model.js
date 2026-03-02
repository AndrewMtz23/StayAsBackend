// ============================================
// RUTA: backend/models/favorite.model.js
// ============================================
// Modelo de Favoritos - Maneja la lógica de datos
// de items favoritos (propiedades y actividades)
// ============================================

import { prisma } from "../config/db.js";

/**
 * Agregar un item a favoritos
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo de item: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item (activityId o propertyId)
 * @returns {Promise<Object>} - Favorito creado
 */
export const addFavorite = async (userId, itemType, itemId) => {
  const data = {
    userId,
    itemType,
  };

  if (itemType === "ACTIVITY") {
    data.activityId = itemId;
  } else if (itemType === "PROPERTY") {
    data.propertyId = itemId;
  }

  return await prisma.favorite.create({
    data,
    include: {
      activity: itemType === "ACTIVITY" ? {
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          state: true,
          averageRating: true,
          media: {
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      } : false,
      property: itemType === "PROPERTY" ? {
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          state: true,
          bedrooms: true,
          bathrooms: true,
          averageRating: true,
          media: {
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      } : false,
    },
  });
};

/**
 * Eliminar un item de favoritos
 * @param {number} favoriteId - ID del favorito
 * @param {number} userId - ID del usuario (validación)
 * @returns {Promise<Object>} - Favorito eliminado
 */
export const removeFavorite = async (favoriteId, userId) => {
  return await prisma.favorite.delete({
    where: {
      id: favoriteId,
      userId, // Validar que sea del usuario
    },
  });
};

/**
 * Eliminar favorito por tipo e ID de item
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo de item: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>} - Favorito eliminado
 */
export const removeFavoriteByItem = async (userId, itemType, itemId) => {
  const where = {
    userId,
    itemType,
  };

  if (itemType === "ACTIVITY") {
    where.activityId = itemId;
  } else if (itemType === "PROPERTY") {
    where.propertyId = itemId;
  }

  return await prisma.favorite.deleteMany({
    where,
  });
};

/**
 * Obtener todos los favoritos de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Filtro opcional: "ACTIVITY" | "PROPERTY" | null
 * @returns {Promise<Array>} - Lista de favoritos
 */
export const getUserFavorites = async (userId, itemType = null) => {
  const where = { userId };

  if (itemType) {
    where.itemType = itemType;
  }

  return await prisma.favorite.findMany({
    where,
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          city: true,
          state: true,
          duration: true,
          capacity: true,
          averageRating: true,
          totalReviews: true,
          availability: true,
          isFeatured: true,
          media: {
            take: 1,
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            }
          }
        }
      },
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          type: true,
          city: true,
          state: true,
          bedrooms: true,
          bathrooms: true,
          capacity: true,
          averageRating: true,
          totalReviews: true,
          availability: true,
          isFeatured: true,
          media: {
            take: 1,
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            }
          }
        }
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Verificar si un item está en favoritos
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo de item: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<boolean>} - true si está en favoritos
 */
export const isFavorite = async (userId, itemType, itemId) => {
  const where = {
    userId,
    itemType,
  };

  if (itemType === "ACTIVITY") {
    where.activityId = itemId;
  } else if (itemType === "PROPERTY") {
    where.propertyId = itemId;
  }

  const favorite = await prisma.favorite.findFirst({
    where,
  });

  return !!favorite;
};

/**
 * Obtener favorito específico
 * @param {number} favoriteId - ID del favorito
 * @returns {Promise<Object|null>} - Favorito encontrado
 */
export const getFavoriteById = async (favoriteId) => {
  return await prisma.favorite.findUnique({
    where: { id: favoriteId },
    include: {
      activity: true,
      property: true,
    },
  });
};

/**
 * Contar favoritos de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Filtro opcional: "ACTIVITY" | "PROPERTY" | null
 * @returns {Promise<number>} - Total de favoritos
 */
export const countUserFavorites = async (userId, itemType = null) => {
  const where = { userId };

  if (itemType) {
    where.itemType = itemType;
  }

  return await prisma.favorite.count({ where });
};

/**
 * Toggle favorito (agregar si no existe, eliminar si existe)
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo de item: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>} - { action: "added" | "removed", favorite: Object }
 */
export const toggleFavorite = async (userId, itemType, itemId) => {
  const exists = await isFavorite(userId, itemType, itemId);

  if (exists) {
    // Eliminar
    await removeFavoriteByItem(userId, itemType, itemId);
    return {
      action: "removed",
      favorite: null,
    };
  } else {
    // Agregar
    const favorite = await addFavorite(userId, itemType, itemId);
    return {
      action: "added",
      favorite,
    };
  }
};

export default {
  addFavorite,
  removeFavorite,
  removeFavoriteByItem,
  getUserFavorites,
  isFavorite,
  getFavoriteById,
  countUserFavorites,
  toggleFavorite,
};