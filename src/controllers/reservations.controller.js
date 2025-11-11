import {
  getAllActivityReservationsService,
  getActivityReservationByIdService,
  createActivityReservationService,
  updateActivityReservationService,
  cancelActivityReservationService,
  deleteActivityReservationService,
} from "../services/reservationActivity.service.js";

import {
  getAllPropertyReservationsService,
  getPropertyReservationByIdService,
  createPropertyReservationService,
  updatePropertyReservationService,
  cancelPropertyReservationService,
  deletePropertyReservationService,
} from "../services/reservationProperty.service.js";

import {
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  getReservationStats,
} from "../services/reservation.service.js";

// ========================================
// DASHBOARD - ENDPOINTS COMBINADOS
// ========================================

/**
 * GET /api/reservations
 * Obtener todas las reservaciones (activities + properties) con filtros
 * Roles: ADMIN, EMPLOYEE
 */
export async function getAllReservationsDashboard(req, res) {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type, // 'activity' | 'property' | 'all'
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await getAllReservations(filters, req);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al obtener reservaciones:", err);
    return res.status(500).json({
      error: "Error al obtener las reservaciones",
    });
  }
}

/**
 * GET /api/reservations/stats
 * Obtener estadísticas de reservaciones
 * Roles: ADMIN, EMPLOYEE
 */
export async function getReservationStatsDashboard(req, res) {
  try {
    const stats = await getReservationStats(req);
    return res.status(200).json(stats);
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    return res.status(500).json({
      error: "Error al obtener las estadísticas",
    });
  }
}

/**
 * GET /api/reservations/:id
 * Obtener una reservación específica
 * Query: ?type=activity|property
 * Roles: ADMIN, EMPLOYEE
 */
export async function getReservationByIdDashboard(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!type || (type !== "activity" && type !== "property")) {
      return res.status(400).json({
        error: "Tipo de reservación inválido. Debe ser 'activity' o 'property'",
      });
    }

    const reservation = await getReservationById(Number(id), type, req);
    return res.status(200).json(reservation);
  } catch (err) {
    console.error("Error al obtener reservación:", err);
    return res.status(404).json({
      error: err.message || "Reservación no encontrada",
    });
  }
}

/**
 * PATCH /api/reservations/:id/status
 * Actualizar estado de reservación
 * Query: ?type=activity|property
 * Body: { status: "pending" | "confirmed" | "cancelled" | "completed" }
 * Roles: ADMIN
 */
export async function updateReservationStatusDashboard(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { status } = req.body;

    if (!type || (type !== "activity" && type !== "property")) {
      return res.status(400).json({
        error: "Tipo de reservación inválido",
      });
    }

    if (!status) {
      return res.status(400).json({
        error: "El estado es requerido",
      });
    }

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${validStatuses.join(", ")}`,
      });
    }

    const reservation = await updateReservationStatus(
      Number(id),
      type,
      status,
      req
    );

    return res.status(200).json({
      message: "Estado de la reservación actualizado exitosamente",
      reservation,
    });
  } catch (err) {
    console.error("Error al actualizar estado:", err);
    return res.status(500).json({
      error: err.message || "Error al actualizar el estado de la reservación",
    });
  }
}

// ========================================
// RESERVACIONES DE ACTIVIDADES (MANTENER LO EXISTENTE)
// ========================================

/**
 * GET /api/reservations/activities
 * Obtener todas las reservaciones de actividades
 * Query params: status, userId
 */
export async function getActivityReservations(req, res) {
  try {
    const { status, userId } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (userId) filters.userId = Number(userId);
    
    // Si es CLIENT, solo ver sus propias reservaciones
    if (req.user?.role === "CLIENT") {
      filters.userId = req.user.id;
    }
    
    const reservations = await getAllActivityReservationsService(filters);
    return res.status(200).json(reservations);
  } catch (err) {
    console.error("Error al obtener reservaciones de actividades:", err);
    return res.status(500).json({ error: "Error al obtener las reservaciones" });
  }
}

/**
 * GET /api/reservations/activities/:id
 */
export async function getActivityReservationById(req, res) {
  try {
    const { id } = req.params;
    const reservation = await getActivityReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para ver esta reservación" });
    }
    
    return res.status(200).json(reservation);
  } catch (err) {
    console.error("Error al obtener reservación:", err);
    return res.status(404).json({ error: err.message });
  }
}

/**
 * POST /api/reservations/activities
 */
export async function createActivityReservation(req, res) {
  try {
    const userId = req.user?.id;
    const { activityId, reservationDate, numberOfPeople } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const reservation = await createActivityReservationService({
      userId,
      activityId: Number(activityId),
      reservationDate,
      numberOfPeople,
    });

    return res.status(201).json({
      message: "Reservación creada correctamente",
      reservation,
    });
  } catch (err) {
    console.error("Error al crear reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/reservations/activities/:id
 */
export async function updateActivityReservation(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await getActivityReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta reservación" });
    }
    
    const updated = await updateActivityReservationService(Number(id), data);

    return res.status(200).json({
      message: "Reservación actualizada correctamente",
      reservation: updated,
    });
  } catch (err) {
    console.error("Error al actualizar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/reservations/activities/:id
 */
export async function removeActivityReservation(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await getActivityReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta reservación" });
    }
    
    const result = await deleteActivityReservationService(Number(id));
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al eliminar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/reservations/activities/:id/cancel
 */
export async function cancelActivityReservation(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await getActivityReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para cancelar esta reservación" });
    }
    
    const updated = await cancelActivityReservationService(Number(id));

    return res.status(200).json({
      message: "Reservación cancelada correctamente",
      reservation: updated,
    });
  } catch (err) {
    console.error("Error al cancelar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

// ========================================
// RESERVACIONES DE PROPIEDADES (MANTENER LO EXISTENTE)
// ========================================

/**
 * GET /api/reservations/properties
 */
export async function getPropertyReservations(req, res) {
  try {
    const { status, userId } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (userId) filters.userId = Number(userId);
    
    // Si es CLIENT, solo ver sus propias reservaciones
    if (req.user?.role === "CLIENT") {
      filters.userId = req.user.id;
    }
    
    const reservations = await getAllPropertyReservationsService(filters);
    return res.status(200).json(reservations);
  } catch (err) {
    console.error("Error al obtener reservaciones de propiedades:", err);
    return res.status(500).json({ error: "Error al obtener las reservaciones" });
  }
}

/**
 * GET /api/reservations/properties/:id
 */
export async function getPropertyReservationById(req, res) {
  try {
    const { id } = req.params;
    const reservation = await getPropertyReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para ver esta reservación" });
    }
    
    return res.status(200).json(reservation);
  } catch (err) {
    console.error("Error al obtener reservación:", err);
    return res.status(404).json({ error: err.message });
  }
}

/**
 * POST /api/reservations/properties
 */
export async function createPropertyReservation(req, res) {
  try {
    const userId = req.user?.id;
    const { propertyId, checkIn, checkOut, guests } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const reservation = await createPropertyReservationService({
      userId,
      propertyId: Number(propertyId),
      checkIn,
      checkOut,
      guests,
    });

    return res.status(201).json({
      message: "Reservación creada correctamente",
      reservation,
    });
  } catch (err) {
    console.error("Error al crear reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/reservations/properties/:id
 */
export async function updatePropertyReservation(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await getPropertyReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta reservación" });
    }
    
    const updated = await updatePropertyReservationService(Number(id), data);

    return res.status(200).json({
      message: "Reservación actualizada correctamente",
      reservation: updated,
    });
  } catch (err) {
    console.error("Error al actualizar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/reservations/properties/:id
 */
export async function removePropertyReservation(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await getPropertyReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta reservación" });
    }
    
    const result = await deletePropertyReservationService(Number(id));
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al eliminar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/reservations/properties/:id/cancel
 */
export async function cancelPropertyReservation(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await getPropertyReservationByIdService(Number(id));
    
    // Verificar permisos
    if (req.user?.role === "CLIENT" && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para cancelar esta reservación" });
    }
    
    const updated = await cancelPropertyReservationService(Number(id));

    return res.status(200).json({
      message: "Reservación cancelada correctamente",
      reservation: updated,
    });
  } catch (err) {
    console.error("Error al cancelar reservación:", err);
    return res.status(400).json({ error: err.message });
  }
}