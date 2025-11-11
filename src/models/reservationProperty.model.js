import { prisma } from "../config/db.js";

/**
 * Obtener todas las reservaciones de propiedades con filtros
 */
export async function findAllPropertyReservations(filters = {}) {
  return await prisma.reservationProperty.findMany({
    where: filters,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          price: true,
          capacity: true,
          bedrooms: true,
          bathrooms: true,
          city: true,
          state: true,
          address: true,
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
 * Obtener reservación de propiedad por ID
 */
export async function findPropertyReservationById(id) {
  return await prisma.reservationProperty.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      property: {
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
 * Crear reservación de propiedad
 */
export async function createPropertyReservation(data) {
  return await prisma.reservationProperty.create({
    data,
    include: {
      property: {
        select: { id: true, title: true, price: true },
      },
    },
  });
}

/**
 * Actualizar reservación de propiedad
 */
export async function updatePropertyReservation(id, data) {
  return await prisma.reservationProperty.update({
    where: { id: Number(id) },
    data,
    include: {
      property: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Eliminar reservación de propiedad
 */
export async function deletePropertyReservation(id) {
  return await prisma.reservationProperty.delete({
    where: { id: Number(id) },
  });
}