import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  removeProperty,
  addPropertyMedia,
  reorderPropertyMedia, 
} from "../controllers/properties.controller.js";
import {
  preparePropertyUpload,
  uploadPropertyMedia,
} from "../middlewares/propertyUpload.middleware.js";

const router = express.Router();

/**
 * GET /api/accommodations
 * Público: listado de propiedades
 */
router.get("/", getProperties);

/**
 * GET /api/accommodations/:id
 * Público: detalle de propiedad
 */
router.get("/:id", getPropertyById);

/**
 * POST /api/accommodations
 * Protegido: HOST y ADMIN pueden crear
 */
router.post(
  "/",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN]),
  createProperty
);

/**
 * PUT /api/accommodations/:id
 * Protegido: HOST y ADMIN pueden actualizar
 */
router.put(
  "/:id",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN, ROLES.EMPLOYEE]),
  updateProperty
);

/**
 * DELETE /api/accommodations/:id
 * Protegido: HOST y ADMIN pueden eliminar
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN, ROLES.EMPLOYEE]),
  removeProperty
);

/**
 * POST /api/accommodations/:id/media
 * Protegido: HOST y ADMIN
 * Sube múltiples imágenes en el campo "images" (multipart/form-data)
 */
router.post(
  "/:id/media",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.ADMIN]),
  preparePropertyUpload,
  uploadPropertyMedia,
  addPropertyMedia
);

/**
 * PUT /api/accommodations/:id/media/reorder
 * Protegido: HOST y ADMIN pueden reordenar
 */
router.put(
  "/:id/media/reorder",
  verifyToken,
  checkRole([ROLES.HOST, ROLES.EMPLOYEE, ROLES.ADMIN]),
  reorderPropertyMedia
);

export default router;