import express from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS (con autenticación)
// ========================================

/**
 * POST /api/payments/activities
 * Crear pago para actividad
 * Roles: Todos los autenticados
 */
router.post(
  "/activities",
  verifyToken,
  paymentsController.createActivityPayment
);

/**
 * POST /api/payments/properties
 * Crear pago para propiedad
 * Roles: Todos los autenticados
 */
router.post(
  "/properties",
  verifyToken,
  paymentsController.createPropertyPayment
);

/**
 * GET /api/payments/activities/:id/pdf
 * Descargar PDF de pago de actividad
 * Roles: Dueño del pago, ADMIN, EMPLOYEE
 */
router.get(
  "/activities/:id/pdf",
  verifyToken,
  paymentsController.downloadActivityPaymentPDF
);

/**
 * GET /api/payments/properties/:id/pdf
 * Descargar PDF de pago de propiedad
 * Roles: Dueño del pago, ADMIN, EMPLOYEE
 */
router.get(
  "/properties/:id/pdf",
  verifyToken,
  paymentsController.downloadPropertyPaymentPDF
);

// ========================================
// RUTAS DE DASHBOARD (ADMIN + EMPLOYEE)
// ========================================

/**
 * GET /api/payments
 * Obtener todos los pagos con filtros
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/",
  verifyToken,
  checkRole(["ADMIN", "EMPLOYEE"]),
  paymentsController.getAllPayments
);

/**
 * GET /api/payments/stats
 * Obtener estadísticas de pagos
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/stats",
  verifyToken,
  checkRole(["ADMIN", "EMPLOYEE"]),
  paymentsController.getPaymentStats
);

/**
 * GET /api/payments/:id
 * Obtener un pago específico
 * Query: ?type=activity|property
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/:id",
  verifyToken,
  checkRole(["ADMIN", "EMPLOYEE"]),
  paymentsController.getPaymentById
);

/**
 * PATCH /api/payments/:id/status
 * Actualizar estado de pago
 * Query: ?type=activity|property
 * Body: { status: "approved" | "rejected" | "refunded" }
 * Roles: ADMIN
 */
router.patch(
  "/:id/status",
  verifyToken,
  checkRole(["ADMIN"]),
  paymentsController.updatePaymentStatus
);

/**
 * POST /api/payments/:id/refund
 * Reembolsar un pago
 * Query: ?type=activity|property
 * Body: { reason: "string" }
 * Roles: ADMIN
 */
router.post(
  "/:id/refund",
  verifyToken,
  checkRole(["ADMIN"]),
  paymentsController.refundPayment
);

export default router;