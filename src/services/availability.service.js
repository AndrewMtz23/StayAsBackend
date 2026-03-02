// /backend/src/services/availability.service.js
import { prisma } from "../config/db.js";

/**
 * ========================================
 * DISPONIBILIDAD DE ACTIVIDADES
 * ========================================
 */

/**
 * Obtener disponibilidad de una actividad para una fecha específica
 * @param {number} activityId
 * @param {Date} date
 * @returns {Promise<{available: number, capacity: number, reservations: Array}>}
 */
export async function getActivityAvailability(activityId, date) {
  const activity = await prisma.activity.findUnique({
    where: { id: Number(activityId) },
    select: { capacity: true },
  });

  if (!activity) throw new Error("Actividad no encontrada");

  const reservations = await prisma.reservationActivity.findMany({
    where: {
      activityId: Number(activityId),
      reservationDate: new Date(date),
      status: { in: ["pending", "confirmed"] },
    },
    select: {
      id: true,
      numberOfPeople: true,
      status: true,
    },
  });

  const totalReserved = reservations.reduce(
    (sum, r) => sum + r.numberOfPeople,
    0
  );

  const available = Math.max(activity.capacity - totalReserved, 0);

  return {
    available,
    capacity: activity.capacity,
    reservations,
  };
}

/**
 * Verificar si hay disponibilidad suficiente para una reserva
 * @param {number} activityId
 * @param {Date} date
 * @param {number} numberOfPeople
 * @returns {Promise<{isAvailable: boolean, available: number, message: string}>}
 */
export async function checkActivityAvailability(activityId, date, numberOfPeople) {
  const result = await getActivityAvailability(activityId, date);

  if (result.available <= 0) {
    return {
      isAvailable: false,
      available: 0,
      message:
        "Esta actividad está completamente llena para la fecha seleccionada. Intenta con otra fecha.",
    };
  }

  if (numberOfPeople > result.available) {
    return {
      isAvailable: false,
      available: result.available,
      message: `Solo hay ${result.available} ${
        result.available === 1 ? "lugar" : "lugares"
      } disponibles para esta fecha.`,
    };
  }

  return {
    isAvailable: true,
    available: result.available,
    message: "Disponibilidad suficiente",
  };
}

/**
 * Obtener disponibilidad para un rango de fechas
 * (útil para mostrar calendarios de actividades)
 */
export async function getActivityAvailabilityRange(activityId, startDate, endDate) {
  const activity = await prisma.activity.findUnique({
    where: { id: Number(activityId) },
    select: { capacity: true },
  });

  if (!activity) throw new Error("Actividad no encontrada");

  const reservations = await prisma.reservationActivity.findMany({
    where: {
      activityId: Number(activityId),
      reservationDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: { in: ["pending", "confirmed"] },
    },
    select: {
      reservationDate: true,
      numberOfPeople: true,
    },
  });

  // Agrupar reservas por fecha
  const grouped = {};
  for (const r of reservations) {
    const dateKey = r.reservationDate.toISOString().split("T")[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + r.numberOfPeople;
  }

  const result = [];
  let current = new Date(startDate);

  while (current <= new Date(endDate)) {
    const key = current.toISOString().split("T")[0];
    const reserved = grouped[key] || 0;
    const available = Math.max(activity.capacity - reserved, 0);
    result.push({
      date: key,
      available,
      capacity: activity.capacity,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * ========================================
 * DISPONIBILIDAD DE PROPIEDADES
 * ========================================
 */

/**
 * Verificar si una propiedad está disponible para un rango de fechas
 * @param {number} propertyId
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {number|null} excludeReservationId
 */
export async function checkPropertyAvailability(
  propertyId,
  checkIn,
  checkOut,
  excludeReservationId = null
) {
  const property = await prisma.property.findUnique({
    where: { id: Number(propertyId) },
    select: { capacity: true, title: true },
  });

  if (!property) throw new Error("Propiedad no encontrada");

  const conflicts = await prisma.reservationProperty.findMany({
    where: {
      propertyId: Number(propertyId),
      status: { in: ["pending", "confirmed"] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [
        { checkIn: { lt: new Date(checkOut) } },
        { checkOut: { gt: new Date(checkIn) } },
      ],
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
  });

  if (conflicts.length > 0) {
    const c = conflicts[0];
    return {
      isAvailable: false,
      conflicts,
      message: `Esta propiedad ya está reservada del ${new Date(
        c.checkIn
      ).toLocaleDateString("es-MX")} al ${new Date(
        c.checkOut
      ).toLocaleDateString("es-MX")}.`,
    };
  }

  return {
    isAvailable: true,
    conflicts: [],
    message: "Propiedad disponible",
  };
}

/**
 * Obtener fechas bloqueadas de una propiedad
 */
export async function getPropertyBlockedDates(propertyId, startDate, endDate) {
  const reservations = await prisma.reservationProperty.findMany({
    where: {
      propertyId: Number(propertyId),
      status: { in: ["pending", "confirmed"] },
      checkIn: { lt: new Date(endDate) },
      checkOut: { gt: new Date(startDate) },
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
    },
  });

  return {
    blockedRanges: reservations.map((r) => ({
      reservationId: r.id,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
    })),
  };
}

/**
 * Obtener disponibilidad mensual de una propiedad
 */
export async function getPropertyMonthlyAvailability(propertyId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const blocked = await getPropertyBlockedDates(
    propertyId,
    startDate,
    endDate
  );

  const result = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const currentDate = current.toISOString().split("T")[0];
    const isBlocked = blocked.blockedRanges.some(
      (b) => current >= new Date(b.checkIn) && current < new Date(b.checkOut)
    );
    result.push({
      date: currentDate,
      isAvailable: !isBlocked,
    });
    current.setDate(current.getDate() + 1);
  }

  return { calendar: result };
}
