import {
  findAllPropertyReservations,
  findPropertyReservationById,
  createPropertyReservation,
  updatePropertyReservation,
  deletePropertyReservation,
} from "../models/reservationProperty.model.js";
import { prisma } from "../config/db.js";

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

  return await createPropertyReservation({
    userId,
    propertyId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: Number(guests),
    totalPrice,
    status: "pending",
  });
}

/**
 * Actualizar una reservación
 */
export async function updatePropertyReservationService(id, data) {
  const existing = await findPropertyReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  return await updatePropertyReservation(id, data);
}

/**
 * Cancelar una reservación
 */
export async function cancelPropertyReservationService(id) {
  return await updatePropertyReservation(id, { status: "cancelled" });
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