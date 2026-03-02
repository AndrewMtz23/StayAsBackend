// ============================================
// SEASONAL PRICE ROUTES
// ============================================
// Define todas las rutas para gestionar PRECIOS POR TEMPORADA.
//
// RUTAS PÚBLICAS (No requieren login):
// GET /properties/:propertyId/price          - Calcular precio para fecha
// GET /properties/:propertyId/price-range    - Calcular precio rango
// GET /properties/:propertyId/calendar       - Calendario 30 días
//
// RUTAS PROTEGIDAS (Requieren login + ser HOST):
// GET    /properties/:propertyId/seasonal-prices         - Listar temporadas
// POST   /properties/:propertyId/seasonal-prices         - Crear temporada
// PUT    /seasonal-prices/:id                            - Actualizar
// DELETE /seasonal-prices/:id                            - Eliminar
// PATCH  /seasonal-prices/:id/toggle                     - Activar/desactivar
// GET    /properties/:propertyId/seasonal-prices/stats   - Estadísticas
// ============================================

import { Router } from "express";
import {
  createSeasonalPrice,
  getPropertySeasonalPrices,
  calculatePrice,
  calculatePriceRange,
  getPriceCalendar,
  updateSeasonalPrice,
  deleteSeasonalPrice,
  toggleSeasonalPrice,
  getStatistics,
} from "../controllers/seasonalPrice.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ============================================

// Calcular precio para una fecha específica
// Ejemplo: GET /properties/123/price?date=2025-12-25
router.get("/properties/:propertyId/price", calculatePrice);

// Calcular precio para un rango de fechas
// Ejemplo: GET /properties/123/price-range?startDate=2025-12-20&endDate=2025-12-25
router.get("/properties/:propertyId/price-range", calculatePriceRange);

// Obtener calendario de precios (30 días)
// Ejemplo: GET /properties/123/calendar?startDate=2025-12-01
router.get("/properties/:propertyId/calendar", getPriceCalendar);

// ============================================
// RUTAS PROTEGIDAS (Solo hosts/dueños)
// ============================================

// Obtener todos los precios de temporada de una propiedad
// Ejemplo: GET /properties/123/seasonal-prices?isActive=true
router.get(
  "/properties/:propertyId/seasonal-prices",
  verifyToken,
  getPropertySeasonalPrices
);

// Crear un nuevo precio de temporada
// Body: { name, startDate, endDate, priceType, value, priority }
router.post(
  "/properties/:propertyId/seasonal-prices",
  verifyToken,
  authorizeRoles("HOST", "ADMIN"),
  createSeasonalPrice
);

// Actualizar un precio de temporada existente
router.put(
  "/seasonal-prices/:id",
  verifyToken,
  authorizeRoles("HOST", "ADMIN"),
  updateSeasonalPrice
);

// Eliminar un precio de temporada
router.delete(
  "/seasonal-prices/:id",
  verifyToken,
  authorizeRoles("HOST", "ADMIN"),
  deleteSeasonalPrice
);

// Activar o desactivar un precio de temporada
// Body: { isActive: true/false }
router.patch(
  "/seasonal-prices/:id/toggle",
  verifyToken,
  authorizeRoles("HOST", "ADMIN"),
  toggleSeasonalPrice
);

// Obtener estadísticas de precios de temporada de una propiedad
router.get(
  "/properties/:propertyId/seasonal-prices/stats",
  verifyToken,
  authorizeRoles("HOST", "ADMIN"),
  getStatistics
);

export default router;