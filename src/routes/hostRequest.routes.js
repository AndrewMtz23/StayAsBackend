import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  createHostRequest,
  getHostRequests,
  getHostRequest,
  getMyHostRequest,
  sendForm,
  completeForm,
  approveRequest,
  rejectRequest,
  updateNotes,
  removeHostRequest,
  getStats
} from "../controllers/hostRequest.controller.js";

const router = express.Router();

// ========================================
// RUTAS PARA CLIENTES
// ========================================

/**
 * POST /api/host-requests
 * Cliente crea solicitud inicial para ser Host
 * Requiere: token (CLIENT)
 * Body: { initialMessage: string }
 */
router.post(
  "/",
  verifyToken,
  checkRole([ROLES.CLIENT]),
  createHostRequest
);

/**
 * GET /api/host-requests/my-request
 * Cliente obtiene su propia solicitud
 * Requiere: token (CLIENT)
 */
router.get(
  "/my-request",
  verifyToken,
  checkRole([ROLES.CLIENT]),
  getMyHostRequest
);

/**
 * PUT /api/host-requests/complete-form
 * Cliente completa el formulario de aplicación
 * Requiere: token (CLIENT)
 * Body: formData (todos los campos del formulario)
 */
router.put(
  "/complete-form",
  verifyToken,
  checkRole([ROLES.CLIENT]),
  completeForm
);

// ========================================
// RUTAS PARA EMPLOYEE/ADMIN
// ========================================

/**
 * GET /api/host-requests/stats
 * Obtener estadísticas de solicitudes
 * Requiere: token (EMPLOYEE, ADMIN)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/stats",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  getStats
);

/**
 * GET /api/host-requests
 * Obtener todas las solicitudes con filtros
 * Requiere: token (EMPLOYEE, ADMIN)
 * Query params: ?status=PENDING&search=nombre
 */
router.get(
  "/",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  getHostRequests
);

/**
 * GET /api/host-requests/:id
 * Obtener detalles de una solicitud específica
 * Requiere: token (EMPLOYEE, ADMIN)
 */
router.get(
  "/:id",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  getHostRequest
);

/**
 * POST /api/host-requests/:id/send-form
 * Enviar formulario de aplicación al cliente
 * Requiere: token (EMPLOYEE, ADMIN)
 */
router.post(
  "/:id/send-form",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  sendForm
);

/**
 * POST /api/host-requests/:id/approve
 * Aprobar solicitud y convertir usuario a HOST
 * Requiere: token (EMPLOYEE, ADMIN)
 * Body: { adminNotes?: string }
 */
router.post(
  "/:id/approve",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  approveRequest
);

/**
 * POST /api/host-requests/:id/reject
 * Rechazar solicitud
 * Requiere: token (EMPLOYEE, ADMIN)
 * Body: { rejectionReason: string, adminNotes?: string }
 */
router.post(
  "/:id/reject",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  rejectRequest
);

/**
 * PUT /api/host-requests/:id/notes
 * Actualizar notas administrativas
 * Requiere: token (EMPLOYEE, ADMIN)
 * Body: { adminNotes: string }
 */
router.put(
  "/:id/notes",
  verifyToken,
  checkRole([ROLES.EMPLOYEE, ROLES.ADMIN]),
  updateNotes
);

/**
 * DELETE /api/host-requests/:id
 * Eliminar solicitud (solo ADMIN - baja física)
 * Requiere: token (ADMIN)
 */
router.delete(
  "/:id",
  verifyToken,
  removeHostRequest
);

export default router;
//, ROLES.EMPLOYEE, ROLES.CLIENT