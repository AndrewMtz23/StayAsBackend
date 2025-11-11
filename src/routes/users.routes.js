import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../middlewares/upload.middleware.js";
import { ROLES } from "../utils/roles.js";
import { 
  getAllUsers, 
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from "../controllers/users.controller.js";
import { getUserProfile } from "../controllers/auth.controller.js";

const router = express.Router();

// ========================================
// RUTAS DE USUARIOS (ADMIN)
// ========================================

/**
 * GET /api/users
 * Obtener todos los usuarios (solo ADMIN Y EMPLOYEE)
 */
router.get("/", verifyToken, checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]), getAllUsers);

/**
 * GET /api/users/:id
 * Obtener un usuario por ID (ADMIN o el mismo usuario)
 */
router.get("/:id", verifyToken, getUserById);

/**
 * GET /api/users/:id/profile
 * Obtener perfil público de un usuario
 * Permite ver perfiles de CLIENT y HOST públicamente
 * EMPLOYEE y ADMIN son privados (excepto para el propio usuario o ADMIN)
 */
router.get("/:id/profile", verifyToken, getUserProfile);

/**
 * POST /api/users
 * Crear un nuevo usuario (solo ADMIN Y EMPLOYEE)
 */
router.post("/", verifyToken, checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]), uploadProfile, createUser);

/**
 * PUT /api/users/:id
 * Actualizar un usuario existente (solo ADMIN y EMPLOYEE)
 */
router.put("/:id", verifyToken, checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]), uploadProfile, updateUser);

/**
 * DELETE /api/users/:id
 * Eliminar un usuario (solo ADMIN)
 */
router.delete("/:id", verifyToken, checkRole([ROLES.ADMIN]), deleteUser);

/**
 * PATCH /api/users/:id/verify
 * Cambiar estado de verificación del usuario (solo ADMIN y EMPLOYEE)
 */
router.patch("/:id/verify", verifyToken, checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]), toggleUserStatus);

export default router;