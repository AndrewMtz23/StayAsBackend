import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import {
  getVerificationCodes,
  getUserCodes,
  deleteCode,
  deleteUserCodes,
  resendCode,
  cleanExpired
} from "../controllers/verification.controller.js";

const router = express.Router();

/**
 * GET /api/verification-codes
 * Obtener todos los códigos de verificación (solo ADMIN)
 */
router.get("/", verifyToken, checkRole([ROLES.ADMIN]), getVerificationCodes);

/**
 * GET /api/verification-codes/user/:userId
 * Obtener códigos de un usuario específico
 */
router.get("/user/:userId", verifyToken, checkRole([ROLES.ADMIN]), getUserCodes);

/**
 * DELETE /api/verification-codes/:id
 * Eliminar un código específico
 */
router.delete("/:id", verifyToken, checkRole([ROLES.ADMIN]), deleteCode);

/**
 * DELETE /api/verification-codes/user/:userId
 * Eliminar todos los códigos de un usuario
 */
router.delete("/user/:userId/all", verifyToken, checkRole([ROLES.ADMIN]), deleteUserCodes);

/**
 * POST /api/verification-codes/resend/:userId
 * Reenviar código de verificación
 */
router.post("/resend/:userId", verifyToken, checkRole([ROLES.ADMIN]), resendCode);

/**
 * POST /api/verification-codes/clean-expired
 * Limpiar códigos expirados
 */
router.post("/clean-expired", verifyToken, checkRole([ROLES.ADMIN]), cleanExpired);

export default router;