import { findAllLogs, getLogStats } from "../models/log.model.js";

/**
 * Obtener logs del sistema con filtros
 */
export async function getLogs(req, res) {
  try {
    const { page, limit, action, entity, userId, startDate, endDate } = req.query;

    const result = await findAllLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action,
      entity,
      userId,
      startDate,
      endDate,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error al obtener logs:", err);
    res.status(500).json({ error: "Error al obtener logs del sistema." });
  }
}

/**
 * Obtener estadísticas de logs
 */
export async function getLogsStats(req, res) {
  try {
    const stats = await getLogStats();
    res.status(200).json(stats);
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ error: "Error al obtener estadísticas." });
  }
}