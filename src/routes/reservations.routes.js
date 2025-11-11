// RUTA: backend/routes/reservations.routes.js
// Rutas de reservaciones - ORDEN CORRECTO

import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  // Dashboard - Endpoints Combinados
  getAllReservationsDashboard,
  getReservationStatsDashboard,
  getReservationByIdDashboard,
  updateReservationStatusDashboard,
  
  // Activity Reservations
  getActivityReservations,
  getActivityReservationById,
  createActivityReservation,
  updateActivityReservation,
  removeActivityReservation,
  cancelActivityReservation,
  
  // Property Reservations
  getPropertyReservations,
  getPropertyReservationById,
  createPropertyReservation,
  updatePropertyReservation,
  removePropertyReservation,
  cancelPropertyReservation,
} from "../controllers/reservations.controller.js";

const router = express.Router();

// ========================================
// ⚠️ IMPORTANTE: ORDEN DE LAS RUTAS
// Las rutas más específicas DEBEN ir ANTES que las genéricas
// Primero: /activities, /properties, /stats
// Después: /:id, /
// ========================================

// ========================================
// RUTAS ESPECÍFICAS - ESTADÍSTICAS (PRIMERO)
// ========================================

/**
 * GET /api/reservations/stats
 * Obtener estadísticas de reservaciones
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/stats",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getReservationStatsDashboard
);

// ========================================
// RUTAS DE RESERVACIONES DE ACTIVIDADES
// ========================================

/**
 * GET /api/reservations/activities
 * Protegido: Todos los usuarios autenticados
 * CLIENT solo ve sus propias reservaciones
 * ADMIN/EMPLOYEE ven todas
 */
router.get("/activities", verifyToken, getActivityReservations);

/**
 * POST /api/reservations/activities
 * Protegido: CLIENT, HOST, ADMIN
 */
router.post(
  "/activities",
  verifyToken,
  checkRole([ROLES.CLIENT, ROLES.HOST, ROLES.ADMIN]),
  createActivityReservation
);

/**
 * GET /api/reservations/activities/:id
 * Protegido: Todos los usuarios autenticados
 */
router.get("/activities/:id", verifyToken, getActivityReservationById);

/**
 * PUT /api/reservations/activities/:id
 * Protegido: Dueño de la reservación o ADMIN
 */
router.put(
  "/activities/:id",
  verifyToken,
  updateActivityReservation
);

/**
 * PATCH /api/reservations/activities/:id/cancel
 * Protegido: Dueño de la reservación o ADMIN
 */
router.patch(
  "/activities/:id/cancel",
  verifyToken,
  cancelActivityReservation
);

/**
 * DELETE /api/reservations/activities/:id
 * Protegido: ADMIN o dueño de la reservación
 */
router.delete(
  "/activities/:id",
  verifyToken,
  removeActivityReservation
);

// ========================================
// RUTAS DE RESERVACIONES DE PROPIEDADES
// ========================================

/**
 * GET /api/reservations/properties
 * Protegido: Todos los usuarios autenticados
 */
router.get("/properties", verifyToken, getPropertyReservations);

/**
 * POST /api/reservations/properties
 * Protegido: CLIENT, HOST, ADMIN
 */
router.post(
  "/properties",
  verifyToken,
  checkRole([ROLES.CLIENT, ROLES.HOST, ROLES.ADMIN]),
  createPropertyReservation
);

/**
 * GET /api/reservations/properties/:id
 * Protegido: Todos los usuarios autenticados
 */
router.get("/properties/:id", verifyToken, getPropertyReservationById);

/**
 * PUT /api/reservations/properties/:id
 * Protegido: Dueño de la reservación o ADMIN
 */
router.put(
  "/properties/:id",
  verifyToken,
  updatePropertyReservation
);

/**
 * PATCH /api/reservations/properties/:id/cancel
 * Protegido: Dueño de la reservación o ADMIN
 */
router.patch(
  "/properties/:id/cancel",
  verifyToken,
  cancelPropertyReservation
);

/**
 * DELETE /api/reservations/properties/:id
 * Protegido: ADMIN o dueño de la reservación
 */
router.delete(
  "/properties/:id",
  verifyToken,
  removePropertyReservation
);

// ========================================
// RUTAS GENÉRICAS - DASHBOARD (AL FINAL)
// ========================================

/**
 * PATCH /api/reservations/:id/status
 * Actualizar estado de reservación
 * Query: ?type=activity|property
 * Body: { status: "pending" | "confirmed" | "cancelled" | "completed" }
 * Roles: ADMIN
 */
router.patch(
  "/:id/status",
  verifyToken,
  checkRole([ROLES.ADMIN]),
  updateReservationStatusDashboard
);

/**
 * GET /api/reservations/:id
 * Obtener una reservación específica
 * Query: ?type=activity|property
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getReservationByIdDashboard
);

/**
 * GET /api/reservations
 * Obtener todas las reservaciones con filtros
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getAllReservationsDashboard
);

export default router;