import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  removeCategory,
} from "../controllers/categories.controller.js";

const router = express.Router();

/**
 * GET /api/categories
 * Público: listar todas las categorías
 */
router.get("/", getCategories);

/**
 * GET /api/categories/:id
 * Público: detalle de categoría
 */
router.get("/:id", getCategoryById);

/**
 * POST /api/categories
 * Protegido: Solo ADMIN puede crear
 */
router.post("/", verifyToken, checkRole([ROLES.ADMIN]), createCategory);

/**
 * PUT /api/categories/:id
 * Protegido: Solo ADMIN puede actualizar
 */
router.put("/:id", verifyToken, checkRole([ROLES.ADMIN]), updateCategory);

/**
 * DELETE /api/categories/:id
 * Protegido: Solo ADMIN puede eliminar
 */
router.delete("/:id", verifyToken, checkRole([ROLES.ADMIN]), removeCategory);

export default router;