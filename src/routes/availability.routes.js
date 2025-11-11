// /backend/src/routes/availability.routes.js
import { Router } from "express";
import {
  getActivityAvailabilityController,
  checkActivityAvailabilityController,
  getActivityAvailabilityRangeController,
  checkPropertyAvailabilityController,
  getPropertyBlockedDatesController,
  getPropertyMonthlyAvailabilityController,
} from "../controllers/availability.controller.js";

const router = Router();

/**
 * ========================================
 * RUTAS DE DISPONIBILIDAD PARA ACTIVIDADES
 * ========================================
 */

// Obtener disponibilidad de una actividad para una fecha específica
// Ejemplo: GET /api/availability/activity/5?date=2025-11-20
router.get("/activity/:activityId", getActivityAvailabilityController);

// Verificar disponibilidad antes de reservar
// Ejemplo: POST /api/availability/activity/5/check
// Body: { "date": "2025-11-20", "numberOfPeople": 3 }
router.post("/activity/:activityId/check", checkActivityAvailabilityController);

// Obtener disponibilidad de una actividad en un rango de fechas
// Ejemplo: GET /api/availability/activity/5/range?startDate=2025-11-20&endDate=2025-11-30
router.get("/activity/:activityId/range", getActivityAvailabilityRangeController);

/**
 * ========================================
 * RUTAS DE DISPONIBILIDAD PARA PROPIEDADES
 * ========================================
 */

// Verificar si una propiedad está disponible para un rango de fechas
// Ejemplo: POST /api/availability/property/2/check
// Body: { "checkIn": "2025-11-15", "checkOut": "2025-11-18" }
router.post("/property/:propertyId/check", checkPropertyAvailabilityController);

// Obtener fechas bloqueadas (reservadas) de una propiedad
// Ejemplo: GET /api/availability/property/2/blocked?startDate=2025-11-01&endDate=2025-11-30
router.get("/property/:propertyId/blocked", getPropertyBlockedDatesController);

// Obtener calendario mensual de disponibilidad de una propiedad
// Ejemplo: GET /api/availability/property/2/calendar?year=2025&month=11
router.get("/property/:propertyId/calendar", getPropertyMonthlyAvailabilityController);

export default router;
