// src/services/reservationActivity.service.js
import {
  findAllActivityReservations,
  findActivityReservationById,
  createActivityReservation,
  updateActivityReservation,
  deleteActivityReservation,
} from "../models/reservationActivity.model.js";
import { prisma } from "../config/db.js";
import {
  notifyReservationCreated,
  notifyReservationConfirmed,
  notifyReservationCancelled,
  notifyReservationCompleted,
  notifyHostNewReservation,
} from "./notification.service.js";

/**
 * Obtener todas las reservaciones de actividades con filtros
 */
export async function getAllActivityReservationsService(filters = {}) {
  return await findAllActivityReservations(filters);
}

/**
 * Obtener reservación por ID
 */
export async function getActivityReservationByIdService(id) {
  const reservation = await findActivityReservationById(id);
  if (!reservation) throw new Error("Reservación no encontrada");
  return reservation;
}

/**
 * Crear una nueva reservación
 */
export async function createActivityReservationService({
  userId,
  activityId,
  reservationDate,
  numberOfPeople,
}) {
  // Verificar que la actividad existe y está disponible
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      user: { select: { id: true } },
    },
  });

  if (!activity) {
    throw new Error("Actividad no encontrada");
  }

  if (!activity.availability) {
    throw new Error("Esta actividad no está disponible");
  }

  if (numberOfPeople > activity.capacity) {
    throw new Error(`La capacidad máxima es de ${activity.capacity} personas`);
  }

  // Crear la reservación
  const reservation = await createActivityReservation({
    userId,
    activityId,
    reservationDate: new Date(reservationDate),
    numberOfPeople: Number(numberOfPeople),
    status: "pending",
  });

  // Obtener reservación completa con relaciones
  const fullReservation = await findActivityReservationById(reservation.id);

  // 🔔 NOTIFICAR AL CLIENTE
  try {
    await notifyReservationCreated(fullReservation, "activity");
  } catch (err) {
    console.error("Error enviando notificación de reservación creada:", err);
  }

  // 🔔 NOTIFICAR AL HOST
  try {
    const hostId = activity.user.id;
    if (hostId !== userId) { // No notificar si el host se reserva a sí mismo
      await notifyHostNewReservation(hostId, fullReservation, "activity");
    }
  } catch (err) {
    console.error("Error enviando notificación al host:", err);
  }

  return fullReservation;
}

/**
 * Actualizar una reservación
 */
export async function updateActivityReservationService(id, data) {
  const existing = await findActivityReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  const oldStatus = existing.status;
  const updated = await updateActivityReservation(id, data);
  
  // Obtener reservación actualizada con relaciones
  const fullReservation = await findActivityReservationById(id);

  // 🔔 NOTIFICACIONES SEGÚN CAMBIO DE ESTADO
  if (data.status && data.status !== oldStatus) {
    try {
      if (data.status === "confirmed") {
        await notifyReservationConfirmed(fullReservation, "activity");
      } else if (data.status === "cancelled") {
        await notifyReservationCancelled(fullReservation, "activity", data.cancelReason);
      } else if (data.status === "completed") {
        await notifyReservationCompleted(fullReservation, "activity");
      }
    } catch (err) {
      console.error("Error enviando notificación de cambio de estado:", err);
    }
  }

  return fullReservation;
}

/**
 * Cancelar una reservación
 */
export async function cancelActivityReservationService(id, reason) {
  const reservation = await findActivityReservationById(id);
  if (!reservation) throw new Error("Reservación no encontrada");

  const updated = await updateActivityReservation(id, { 
    status: "cancelled",
    cancelReason: reason,
  });

  // Obtener reservación actualizada
  const fullReservation = await findActivityReservationById(id);

  // 🔔 NOTIFICAR CANCELACIÓN
  try {
    await notifyReservationCancelled(fullReservation, "activity", reason);
  } catch (err) {
    console.error("Error enviando notificación de cancelación:", err);
  }

  return fullReservation;
}

/**
 * Eliminar una reservación
 */
export async function deleteActivityReservationService(id) {
  const existing = await findActivityReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  await deleteActivityReservation(id);
  return { message: "Reservación eliminada correctamente" };
}