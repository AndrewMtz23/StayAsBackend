import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/roles.js";
import { getAdminStats } from "../controllers/adminDashboard.controller.js";

const router = express.Router();

/**
 * GET /api/admin/dashboard/stats
 * Obtener estadísticas del dashboard
 * Roles: ADMIN, EMPLOYEE
 */
router.get(
  "/stats",
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.EMPLOYEE]),
  getAdminStats
);

export default router;