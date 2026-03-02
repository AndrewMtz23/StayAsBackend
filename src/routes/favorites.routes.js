// ============================================
// RUTA: backend/routes/favorites.routes.js
// ============================================
// Rutas de Favoritos - Define endpoints HTTP
// Todas requieren autenticación (verifyToken)
// ============================================

import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getMyFavorites,
  getFavoritesStats,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  checkFavorite,
  removeFavoriteByItem,
} from "../controllers/favorites.controller.js";

const router = express.Router();

// ========================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ========================================

/**
 * GET /api/favorites/stats
 * Obtener estadísticas de favoritos
 * Query: Ninguno
 * Response: { total, activities, properties }
 * IMPORTANTE: Esta ruta DEBE ir ANTES de /api/favorites/:id
 */
router.get("/stats", verifyToken, getFavoritesStats);

/**
 * GET /api/favorites/check/:itemType/:itemId
 * Verificar si un item está en favoritos
 * Params: itemType (ACTIVITY|PROPERTY), itemId (number)
 * Response: { isFavorite: boolean }
 * IMPORTANTE: Esta ruta DEBE ir ANTES de /api/favorites/:id
 */
router.get("/check/:itemType/:itemId", verifyToken, checkFavorite);

/**
 * GET /api/favorites
 * Obtener todos los favoritos del usuario
 * Query: ?type=ACTIVITY|PROPERTY (opcional)
 * Response: Lista de favoritos con detalles del item
 */
router.get("/", verifyToken, getMyFavorites);

/**
 * POST /api/favorites
 * Agregar un item a favoritos
 * Body: { itemType: "ACTIVITY" | "PROPERTY", itemId: number }
 * Response: Favorito creado
 */
router.post("/", verifyToken, addFavorite);

/**
 * POST /api/favorites/toggle
 * Toggle favorito (agregar si no existe, quitar si existe)
 * Body: { itemType: "ACTIVITY" | "PROPERTY", itemId: number }
 * Response: { action: "added" | "removed", message, favorite }
 */
router.post("/toggle", verifyToken, toggleFavorite);

/**
 * DELETE /api/favorites/:id
 * Eliminar un favorito por su ID
 * Params: id (favoriteId)
 * Response: Confirmación de eliminación
 */
router.delete("/:id", verifyToken, removeFavorite);

/**
 * DELETE /api/favorites/item/:itemType/:itemId
 * Eliminar favorito por tipo e ID de item
 * Params: itemType (ACTIVITY|PROPERTY), itemId (number)
 * Response: Confirmación de eliminación
 */
router.delete("/item/:itemType/:itemId", verifyToken, removeFavoriteByItem);

export default router;