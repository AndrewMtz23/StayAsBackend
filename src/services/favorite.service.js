// ============================================
// RUTA: backend/services/favorite.service.js
// ============================================
// Servicio de Favoritos - Lógica de negocio
// Validaciones y reglas antes de interactuar con BD
// ============================================

import * as favoriteModel from "../models/favorite.model.js";
import { prisma } from "../config/db.js";
/**
 * Agregar un item a favoritos
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>}
 */
export const addToFavorites = async (userId, itemType, itemId) => {
  // Validar tipo de item
  if (!["ACTIVITY", "PROPERTY"].includes(itemType)) {
    throw new Error("Tipo de item inválido. Debe ser ACTIVITY o PROPERTY");
  }

  // Verificar que el item existe
  const itemExists = await verifyItemExists(itemType, itemId);
  if (!itemExists) {
    throw new Error(
      `${itemType === "ACTIVITY" ? "Actividad" : "Propiedad"} no encontrada`
    );
  }

  // Verificar si ya está en favoritos
  const alreadyFavorite = await favoriteModel.isFavorite(
    userId,
    itemType,
    itemId
  );
  if (alreadyFavorite) {
    throw new Error("Este item ya está en tus favoritos");
  }

  // Agregar a favoritos
  return await favoriteModel.addFavorite(userId, itemType, itemId);
};

/**
 * Eliminar de favoritos por ID del favorito
 * @param {number} favoriteId - ID del favorito
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>}
 */
export const removeFromFavorites = async (favoriteId, userId) => {
  // Verificar que el favorito existe y pertenece al usuario
  const favorite = await favoriteModel.getFavoriteById(favoriteId);

  if (!favorite) {
    throw new Error("Favorito no encontrado");
  }

  if (favorite.userId !== userId) {
    throw new Error("No tienes permiso para eliminar este favorito");
  }

  return await favoriteModel.removeFavorite(favoriteId, userId);
};

/**
 * Eliminar de favoritos por tipo e ID de item
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>}
 */
export const removeFromFavoritesByItem = async (userId, itemType, itemId) => {
  // Validar tipo
  if (!["ACTIVITY", "PROPERTY"].includes(itemType)) {
    throw new Error("Tipo de item inválido");
  }

  // Verificar que está en favoritos
  const isFav = await favoriteModel.isFavorite(userId, itemType, itemId);
  if (!isFav) {
    throw new Error("Este item no está en tus favoritos");
  }

  return await favoriteModel.removeFavoriteByItem(userId, itemType, itemId);
};

/**
 * Obtener favoritos del usuario
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Filtro opcional: "ACTIVITY" | "PROPERTY"
 * @returns {Promise<Array>}
 */
export const getMyFavorites = async (userId, itemType = null) => {
  // Validar tipo si se proporciona
  if (itemType && !["ACTIVITY", "PROPERTY"].includes(itemType)) {
    throw new Error("Tipo de filtro inválido");
  }

  const favorites = await favoriteModel.getUserFavorites(userId, itemType);

  // Formatear respuesta
  return favorites.map((fav) => ({
    id: fav.id,
    itemType: fav.itemType,
    addedAt: fav.createdAt,
    item:
      fav.itemType === "ACTIVITY"
        ? formatActivity(fav.activity)
        : formatProperty(fav.property),
  }));
};

/**
 * Toggle favorito (agregar/quitar)
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>}
 */
export const toggleFavoriteItem = async (userId, itemType, itemId) => {
  // Validar tipo
  if (!["ACTIVITY", "PROPERTY"].includes(itemType)) {
    throw new Error("Tipo de item inválido");
  }

  // Verificar que el item existe
  const itemExists = await verifyItemExists(itemType, itemId);
  if (!itemExists) {
    throw new Error(
      `${itemType === "ACTIVITY" ? "Actividad" : "Propiedad"} no encontrada`
    );
  }

  const result = await favoriteModel.toggleFavorite(userId, itemType, itemId);

  return {
    action: result.action,
    message:
      result.action === "added"
        ? "Agregado a favoritos"
        : "Eliminado de favoritos",
    favorite:
      result.action === "added"
        ? {
            id: result.favorite.id,
            itemType: result.favorite.itemType,
            addedAt: result.favorite.createdAt,
          }
        : null,
  };
};

/**
 * Verificar si un item está en favoritos
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo: "ACTIVITY" | "PROPERTY"
 * @param {number} itemId - ID del item
 * @returns {Promise<boolean>}
 */
export const checkIsFavorite = async (userId, itemType, itemId) => {
  if (!["ACTIVITY", "PROPERTY"].includes(itemType)) {
    return false;
  }

  return await favoriteModel.isFavorite(userId, itemType, itemId);
};

/**
 * Obtener estadísticas de favoritos del usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>}
 */
export const getFavoritesStats = async (userId) => {
  const totalActivities = await favoriteModel.countUserFavorites(
    userId,
    "ACTIVITY"
  );
  const totalProperties = await favoriteModel.countUserFavorites(
    userId,
    "PROPERTY"
  );

  return {
    total: totalActivities + totalProperties,
    activities: totalActivities,
    properties: totalProperties,
  };
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verificar que un item existe en la BD
 * @param {string} itemType - ACTIVITY | PROPERTY
 * @param {number} itemId - ID del item
 * @returns {Promise<boolean>}
 */
const verifyItemExists = async (itemType, itemId) => {
  if (itemType === "ACTIVITY") {
    const activity = await prisma.activity.findUnique({
      where: { id: itemId },
    });
    return !!activity;
  } else if (itemType === "PROPERTY") {
    const property = await prisma.property.findUnique({
      where: { id: itemId },
    });
    return !!property;
  }
  return false;
};

/**
 * Formatear datos de actividad
 * @param {Object} activity
 * @returns {Object}
 */
const formatActivity = (activity) => {
  if (!activity) return null;

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    price: parseFloat(activity.price),
    location: `${activity.city}, ${activity.state}`,
    duration: activity.duration,
    capacity: activity.capacity,
    rating: activity.averageRating ? parseFloat(activity.averageRating) : null,
    reviewsCount: activity.totalReviews,
    available: activity.availability,
    featured: activity.isFeatured,
    image: activity.media?.[0]?.url || null,
    host: activity.user
      ? {
          id: activity.user.id,
          name: activity.user.name,
          avatar: activity.user.profileImage,
        }
      : null,
  };
};

/**
 * Formatear datos de propiedad
 * @param {Object} property
 * @returns {Object}
 */
const formatProperty = (property) => {
  if (!property) return null;

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    price: parseFloat(property.price),
    type: property.type,
    location: `${property.city}, ${property.state}`,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    capacity: property.capacity,
    rating: property.averageRating ? parseFloat(property.averageRating) : null,
    reviewsCount: property.totalReviews,
    available: property.availability,
    featured: property.isFeatured,
    image: property.media?.[0]?.url || null,
    host: property.user
      ? {
          id: property.user.id,
          name: property.user.name,
          avatar: property.user.profileImage,
        }
      : null,
  };
};

export default {
  addToFavorites,
  removeFromFavorites,
  removeFromFavoritesByItem,
  getMyFavorites,
  toggleFavoriteItem,
  checkIsFavorite,
  getFavoritesStats,
};