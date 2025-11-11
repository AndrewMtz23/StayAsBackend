import { getAdminDashboardStats } from "../services/adminDashboard.service.js";

/**
 * GET /api/admin/dashboard/stats
 * Obtener todas las estadísticas del dashboard admin
 * Roles: ADMIN, EMPLOYEE
 */
export async function getAdminStats(req, res) {
  try {
    const stats = await getAdminDashboardStats();
    return res.status(200).json(stats);
  } catch (err) {
    console.error("Error al obtener estadísticas del dashboard:", err);
    return res.status(500).json({
      error: "Error al obtener las estadísticas del dashboard",
    });
  }
}

export default {
  getAdminStats,
};