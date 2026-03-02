// ============================================
// RUTA: backend/routes/coupons.routes.js
// ============================================
// Rutas de Cupones - Define endpoints HTTP
// Algunas públicas, otras requieren autenticación y roles
// ============================================

import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  createCoupon,
  getAllCoupons,
  getPublicCoupons,
  getCouponStats,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
} from "../controllers/coupons.controller.js";

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ========================================

/**
 * GET /api/coupons/public
 * Obtener cupones activos disponibles públicamente
 * Query: ?appliesTo=ACTIVITY|PROPERTY
 * IMPORTANTE: Esta ruta DEBE ir ANTES de /api/coupons/:id
 */
router.get("/public", getPublicCoupons);

// ========================================
// RUTAS PROTEGIDAS - ESTADÍSTICAS (ADMIN, EMPLOYEE)
// ========================================

/**
 * GET /api/coupons/stats
 * Obtener estadísticas de cupones
 * Roles: ADMIN, EMPLOYEE
 * IMPORTANTE: Esta ruta DEBE ir ANTES de /api/coupons/:id
 */
router.get(
  "/stats",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getCouponStats
);

// ========================================
// RUTAS PROTEGIDAS - GESTIÓN (ADMIN, EMPLOYEE)
// ========================================

/**
 * GET /api/coupons
 * Obtener todos los cupones con filtros
 * Query: ?isActive=true&appliesTo=ACTIVITY&search=VERANO&currentlyValid=true
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getAllCoupons
);

/**
 * POST /api/coupons
 * Crear un nuevo cupón
 * Body: { code, description, type, value, validFrom, validUntil, ... }
 * Roles: ADMIN, EMPLOYEE
 */
router.post(
  "/",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  createCoupon
);

/**
 * GET /api/coupons/:id
 * Obtener un cupón específico por ID
 * Params: id
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getCouponById
);

/**
 * PUT /api/coupons/:id
 * Actualizar un cupón existente
 * Params: id
 * Body: Campos a actualizar
 * Roles: ADMIN, EMPLOYEE
 */
router.put(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  updateCoupon
);

/**
 * DELETE /api/coupons/:id
 * Eliminar un cupón (solo si no ha sido usado)
 * Params: id
 * Roles: ADMIN
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN]),
  deleteCoupon
);

/**
 * PATCH /api/coupons/:id/toggle
 * Activar o desactivar un cupón
 * Params: id
 * Body: { isActive: boolean }
 * Roles: ADMIN, EMPLOYEE
 */
router.patch(
  "/:id/toggle",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  toggleCoupon
);

// ========================================
// RUTAS PROTEGIDAS - USO DE CUPONES (TODOS AUTENTICADOS)
// ========================================

/**
 * POST /api/coupons/validate
 * Validar y aplicar un cupón a una compra
 * Body: { code, amount, itemType }
 * Roles: Todos los autenticados
 */
router.post("/validate", verifyToken, validateCoupon);

export default router;