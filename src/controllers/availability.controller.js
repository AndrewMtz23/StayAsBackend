// /backend/src/controllers/availability.controller.js
import {
  getActivityAvailability,
  checkActivityAvailability,
  getActivityAvailabilityRange,
  checkPropertyAvailability,
  getPropertyBlockedDates,
  getPropertyMonthlyAvailability,
} from "../services/availability.service.js";

/**
 * ========================================
 * CONTROLADORES DE ACTIVIDADES
 * ========================================
 */

// GET /api/availability/activity/:activityId?date=YYYY-MM-DD
export async function getActivityAvailabilityController(req, res) {
  try {
    const { activityId } = req.params;
    const { date } = req.query;

    if (!activityId || !date) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (activityId, date)",
      });
    }

    const result = await getActivityAvailability(activityId, date);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en getActivityAvailabilityController:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/availability/activity/:activityId/check
export async function checkActivityAvailabilityController(req, res) {
  try {
    const { activityId } = req.params;
    const { date, numberOfPeople } = req.body;

    if (!activityId || !date || !numberOfPeople) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (activityId, date, numberOfPeople)",
      });
    }

    const result = await checkActivityAvailability(
      activityId,
      date,
      Number(numberOfPeople)
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en checkActivityAvailabilityController:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/availability/activity/:activityId/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function getActivityAvailabilityRangeController(req, res) {
  try {
    const { activityId } = req.params;
    const { startDate, endDate } = req.query;

    if (!activityId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (activityId, startDate, endDate)",
      });
    }

    const result = await getActivityAvailabilityRange(
      activityId,
      startDate,
      endDate
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en getActivityAvailabilityRangeController:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * ========================================
 * CONTROLADORES DE PROPIEDADES
 * ========================================
 */

// POST /api/availability/property/:propertyId/check
export async function checkPropertyAvailabilityController(req, res) {
  try {
    const { propertyId } = req.params;
    const { checkIn, checkOut } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (propertyId, checkIn, checkOut)",
      });
    }

    const result = await checkPropertyAvailability(
      propertyId,
      new Date(checkIn),
      new Date(checkOut)
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en checkPropertyAvailabilityController:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/availability/property/:propertyId/blocked?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function getPropertyBlockedDatesController(req, res) {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;

    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (propertyId, startDate, endDate)",
      });
    }

    const result = await getPropertyBlockedDates(propertyId, startDate, endDate);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en getPropertyBlockedDatesController:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/availability/property/:propertyId/calendar?year=2025&month=11
export async function getPropertyMonthlyAvailabilityController(req, res) {
  try {
    const { propertyId } = req.params;
    const { year, month } = req.query;

    if (!propertyId || !year || !month) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (propertyId, year, month)",
      });
    }

    const result = await getPropertyMonthlyAvailability(
      propertyId,
      Number(year),
      Number(month)
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error en getPropertyMonthlyAvailabilityController:", err);
    return res.status(500).json({ error: err.message });
  }
}
