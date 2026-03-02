// RUTA: backend/routes/activities.routes.js
import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  removeActivity,
  addActivityMedia,
  reorderActivityMedia, 
} from "../controllers/activities.controller.js";
import {
  prepareActivityUpload,
  uploadActivityMedia,
} from "../middlewares/activityUpload.middleware.js";

const router = express.Router();

/**
 * GET /api/experiences
 * Listado de experiencias
 * - SIN TOKEN: Vista pública (todos ven todo) - Para la tienda
 * - CON TOKEN + ?admin=true: Panel de administración
 *   - HOST: Solo ve sus experiencias
 *   - ADMIN/EMPLOYEE: Ve todas
 */
router.get("/", (req, res, next) => {
  // Si hay token, verificarlo
  if (req.headers.authorization) {
    return verifyToken(req, res, next);
  }
  // Si no hay token, continuar sin req.user (público)
  next();
}, getActivities);

/**
 * GET /api/experiences/:id
 * Público: detalle de experiencia
 */
router.get("/:id", getActivityById);

/**
 * POST /api/experiences
 * Protegido: HOST y ADMIN pueden crear
 */
router.post(
  "/",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN]),
  createActivity
);

/**
 * PUT /api/experiences/:id
 * Protegido: HOST y ADMIN pueden actualizar
 * Nota: si más adelante quieres restringir a que solo el dueño (HOST) edite su propia experiencia,
 *       valida en el service/controller comparando req.user.id con activity.userId.
 */
router.put(
  "/:id",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN, ROLES.EMPLOYEE]),
  updateActivity
);


/**
 * DELETE /api/experiences/:id
 * Protegido: HOST y ADMIN pueden eliminar
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN, ROLES.EMPLOYEE]),
  removeActivity
);

/**
 * POST /api/experiences/:id/media
 * Protegido: HOST y ADMIN
 * Sube múltiples imágenes en el campo "images" (multipart/form-data)
 */
router.post(
  "/:id/media",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN]),
  prepareActivityUpload,
  uploadActivityMedia,
  addActivityMedia
);

/**
 * PUT /api/experiences/:id/media/reorder
 * Protegido: HOST y ADMIN pueden reordenar
 */
router.put(
  "/:id/media/reorder",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.EMPLOYEE, ROLES.ADMIN]),
  reorderActivityMedia
);

export default router;