// ============================================
// RUTA: backend/controllers/favorites.controller.js
// ============================================
// Controlador de Favoritos - Maneja peticiones HTTP
// Recibe requests, llama al servicio, devuelve respuestas
// ============================================

import * as favoriteService from "../services/favorite.service.js";

/**
 * GET /api/favorites
 * Obtener todos los favoritos del usuario autenticado
 * Query params: ?type=ACTIVITY|PROPERTY (opcional)
 */
export const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const favorites = await favoriteService.getMyFavorites(userId, type || null);

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    console.error("❌ Error al obtener favoritos:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener favoritos",
    });
  }
};

/**
 * GET /api/favorites/stats
 * Obtener estadísticas de favoritos del usuario
 */
export const getFavoritesStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await favoriteService.getFavoritesStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener estadísticas",
    });
  }
};

/**
 * POST /api/favorites
 * Agregar un item a favoritos
 * Body: { itemType: "ACTIVITY" | "PROPERTY", itemId: number }
 */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType, itemId } = req.body;

    // Validar campos requeridos
    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        error: "itemType e itemId son requeridos",
      });
    }

    // Validar que itemId sea número
    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      return res.status(400).json({
        success: false,
        error: "itemId debe ser un número válido",
      });
    }

    const favorite = await favoriteService.addToFavorites(
      userId,
      itemType,
      parsedItemId
    );

    res.status(201).json({
      success: true,
      message: "Item agregado a favoritos",
      data: favorite,
    });
  } catch (error) {
    console.error("❌ Error al agregar favorito:", error);
    
    if (error.message.includes("ya está en tus favoritos")) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al agregar favorito",
    });
  }
};

/**
 * DELETE /api/favorites/:id
 * Eliminar un favorito por su ID
 */
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = parseInt(req.params.id);

    if (isNaN(favoriteId)) {
      return res.status(400).json({
        success: false,
        error: "ID de favorito inválido",
      });
    }

    await favoriteService.removeFromFavorites(favoriteId, userId);

    res.status(200).json({
      success: true,
      message: "Item eliminado de favoritos",
    });
  } catch (error) {
    console.error("❌ Error al eliminar favorito:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("No tienes permiso")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al eliminar favorito",
    });
  }
};

/**
 * POST /api/favorites/toggle
 * Toggle favorito (agregar si no existe, quitar si existe)
 * Body: { itemType: "ACTIVITY" | "PROPERTY", itemId: number }
 */
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType, itemId } = req.body;

    // Validar campos requeridos
    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        error: "itemType e itemId son requeridos",
      });
    }

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      return res.status(400).json({
        success: false,
        error: "itemId debe ser un número válido",
      });
    }

    const result = await favoriteService.toggleFavoriteItem(
      userId,
      itemType,
      parsedItemId
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Error al toggle favorito:", error);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al procesar favorito",
    });
  }
};

/**
 * GET /api/favorites/check/:itemType/:itemId
 * Verificar si un item está en favoritos
 */
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType, itemId } = req.params;

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      return res.status(400).json({
        success: false,
        error: "itemId debe ser un número válido",
      });
    }

    const isFavorite = await favoriteService.checkIsFavorite(
      userId,
      itemType,
      parsedItemId
    );

    res.status(200).json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    console.error("❌ Error al verificar favorito:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al verificar favorito",
    });
  }
};

/**
 * DELETE /api/favorites/item/:itemType/:itemId
 * Eliminar favorito por tipo e ID de item
 */
export const removeFavoriteByItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType, itemId } = req.params;

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      return res.status(400).json({
        success: false,
        error: "itemId debe ser un número válido",
      });
    }

    await favoriteService.removeFromFavoritesByItem(
      userId,
      itemType,
      parsedItemId
    );

    res.status(200).json({
      success: true,
      message: "Item eliminado de favoritos",
    });
  } catch (error) {
    console.error("❌ Error al eliminar favorito:", error);

    if (error.message.includes("no está en tus favoritos")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al eliminar favorito",
    });
  }
};

export default {
  getMyFavorites,
  getFavoritesStats,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  checkFavorite,
  removeFavoriteByItem,
};