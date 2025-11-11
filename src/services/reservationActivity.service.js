import {
  findAllActivityReservations,
  findActivityReservationById,
  createActivityReservation,
  updateActivityReservation,
  deleteActivityReservation,
} from "../models/reservationActivity.model.js";
import { prisma } from "../config/db.js";

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

  return await createActivityReservation({
    userId,
    activityId,
    reservationDate: new Date(reservationDate),
    numberOfPeople: Number(numberOfPeople),
    status: "pending",
  });
}

/**
 * Actualizar una reservación
 */
export async function updateActivityReservationService(id, data) {
  const existing = await findActivityReservationById(id);
  if (!existing) throw new Error("Reservación no encontrada");

  return await updateActivityReservation(id, data);
}

/**
 * Cancelar una reservación
 */
export async function cancelActivityReservationService(id) {
  return await updateActivityReservation(id, { status: "cancelled" });
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