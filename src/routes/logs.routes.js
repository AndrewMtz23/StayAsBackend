import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import { getLogs, getLogsStats } from "../controllers/logs.controller.js";

const router = express.Router();

/**
 * GET /api/logs
 * Obtener logs del sistema (solo ADMIN)
 */
router.get("/", verifyToken, checkRole([ROLES.ADMIN]), getLogs);

/**
 * GET /api/logs/stats
 * Obtener estadísticas de logs (solo ADMIN)
 */
router.get("/stats", verifyToken, checkRole([ROLES.ADMIN]), getLogsStats);

export default router;