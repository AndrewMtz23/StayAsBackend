import { prisma } from "../config/db.js";

/**
 * Obtener todas las reservaciones de actividades con filtros
 */
export async function findAllActivityReservations(filters = {}) {
  return await prisma.reservationActivity.findMany({
    where: filters,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      activity: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          capacity: true,
          city: true,
          state: true,
          user: {
            select: { id: true, name: true },
          },
          media: {
            orderBy: [{ order: "asc" }, { id: "asc" }],
            take: 1,
          },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Obtener reservación de actividad por ID
 */
export async function findActivityReservationById(id) {
  return await prisma.reservationActivity.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      activity: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          media: {
            orderBy: [{ order: "asc" }, { id: "asc" }],
          },
        },
      },
      payment: true,
    },
  });
}

/**
 * Crear reservación de actividad
 */
export async function createActivityReservation(data) {
  return await prisma.reservationActivity.create({
    data,
    include: {
      activity: {
        select: { id: true, title: true, price: true },
      },
    },
  });
}

/**
 * Actualizar reservación de actividad
 */
export async function updateActivityReservation(id, data) {
  return await prisma.reservationActivity.update({
    where: { id: Number(id) },
    data,
    include: {
      activity: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Eliminar reservación de actividad
 */
export async function deleteActivityReservation(id) {
  return await prisma.reservationActivity.delete({
    where: { id: Number(id) },
  });
}