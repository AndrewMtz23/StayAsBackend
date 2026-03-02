// src/services/reservationProperty.service.js
import {
  findAllPropertyReservations,
  findPropertyReservationById,
  createPropertyReservation,
  updatePropertyReservation,
  deletePropertyReservation,
} from "../models/reservationProperty.model.js";
import { prisma } from "../config/db.js";
import {
  notifyReservationCreated,
  notifyReservationConfirmed,
  notifyReservationCancelled,
  notifyReservationCompleted,
  notifyHostNewReservation,
} from "./notification.service.js";

/**
 * Obtener todas las reservaciones de propiedades con filtros
 */
export async function getAllPropertyReservationsService(filters = {}) {
  return await findAllPropertyReservations(filters);
}

/**
 * Obtener reservación por ID
 */
export async function getPropertyReservationByIdService(id) {
  const reservation = await findPropertyReservationById(id);
  if (!reservation) throw new Error("Reservación no encontrada");
  return reservation;
}

/**
 * Crear una nueva reservación
 */
export async function createPropertyReservationService({
  userId,
  propertyId,
  checkIn,
  checkOut,
  guests,
}) {
  // Verificar que la propiedad existe y está disponible
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: { select: { id: true } },
    },
  });

  if (!property) {
    throw new Error("Propiedad no encontrada");
  }

  if (!property.availability) {
    throw new Error("Esta propiedad no está disponible");
  }

  if (guests > property.capacity) {
    throw new Error(`La capacidad máxima es de ${property.capacity} personas`);
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkInDate >= checkOutDate) {
    throw new Error("La fecha de salida debe ser posterior a la fecha de entrada");
  }

  // Calcular el número de noches
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalPrice = Number(property.price) * nights;

  // Crear la reservación
  const reservation = await createPropertyReservation({
    userId,
    propertyId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: Number(guests),
    totalPrice,
    status: "pending",
  });

  // Obtener reservación completa con relaciones
  const fullReservation = await findPropertyReservationById(reservation.id);

  // 🔔 NOTIFICAR AL CLIENTE
  try {
    await notifyReservationCreated(fullReservation, "property");
  } catch (err) {
    console.error("Error enviando notificación de reservación creada:", err);
  }

  // 🔔 NOTIFICAR AL HOST
  try {
    const hostId = property.user.id;
    if (hostId !== userId) {
      await notifyHostNewReservation(hostId, fullReservation, "property");
    }
  } catch (err) {
    console.error("Error enviando notificación al host:", err);
  }

  return fullReservation;
}

/**
 * Actualizar una reservación
 */
export async function updatePropertyReservationService(id, data) {
  const existing = await findPropertyReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  const oldStatus = existing.status;
  const updated = await updatePropertyReservation(id, data);
  
  // Obtener reservación actualizada con relaciones
  const fullReservation = await findPropertyReservationById(id);

  // 🔔 NOTIFICACIONES SEGÚN CAMBIO DE ESTADO
  if (data.status && data.status !== oldStatus) {
    try {
      if (data.status === "confirmed") {
        await notifyReservationConfirmed(fullReservation, "property");
      } else if (data.status === "cancelled") {
        await notifyReservationCancelled(fullReservation, "property", data.cancelReason);
      } else if (data.status === "completed") {
        await notifyReservationCompleted(fullReservation, "property");
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
export async function cancelPropertyReservationService(id, reason) {
  const reservation = await findPropertyReservationById(id);
  if (!reservation) throw new Error("Reservación no encontrada");

  const updated = await updatePropertyReservation(id, { 
    status: "cancelled",
    cancelReason: reason,
  });

  // Obtener reservación actualizada
  const fullReservation = await findPropertyReservationById(id);

  // 🔔 NOTIFICAR CANCELACIÓN
  try {
    await notifyReservationCancelled(fullReservation, "property", reason);
  } catch (err) {
    console.error("Error enviando notificación de cancelación:", err);
  }

  return fullReservation;
}

/**
 * Eliminar una reservación
 */
export async function deletePropertyReservationService(id) {
  const existing = await findPropertyReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  await deletePropertyReservation(id);
  return { message: "Reservación eliminada correctamente" };
}