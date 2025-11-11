import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getPublicCalendarData,
} from "../controllers/calendarEvents.controller.js";

const router = express.Router();

/**
 * GET /api/calendar/public?month=10&year=2025
 * PÚBLICO: Obtener datos combinados del calendario (experiencias + eventos personalizados)
 */
router.get("/public", getPublicCalendarData);

/**
 * GET /api/calendar-events
 * Protegido: Listar eventos del calendario
 */
router.get("/", verifyToken, getCalendarEvents);

/**
 * GET /api/calendar-events/:id
 * Protegido: Obtener detalle de un evento
 */
router.get("/:id", verifyToken, getCalendarEventById);

/**
 * POST /api/calendar-events
 * Protegido: Solo ADMIN y EMPLOYEE pueden crear
 */
router.post(
  "/",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  createCalendarEvent
);

/**
 * PUT /api/calendar-events/:id
 * Protegido: Solo ADMIN, EMPLOYEE o el creador pueden actualizar
 */
router.put(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.HOST]), // HOST incluido por si el creador es HOST
  updateCalendarEvent
);

/**
 * DELETE /api/calendar-events/:id
 * Protegido: Solo ADMIN, EMPLOYEE o el creador pueden eliminar
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.HOST]),
  deleteCalendarEvent
);

export default router;