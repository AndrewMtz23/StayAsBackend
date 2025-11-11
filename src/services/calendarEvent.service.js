import { prisma } from "../config/db.js";
import {
  findAllCalendarEvents,
  findCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../models/calendarEvent.model.js";

/**
 * Crear un nuevo evento del calendario
 */
export async function createCalendarEventService({
  userId,
  title,
  description,
  eventDate,
  endDate,
  categoryIds,
  location,
  isPublic,
}) {
  // Validaciones básicas
  if (!title || !eventDate || !categoryIds?.length) {
    throw new Error("Faltan campos requeridos: title, eventDate, categoryIds (al menos uno)");
  }

  // Validar que las categorías existan y sean del tipo EVENT
  const categories = await prisma.activityCategory.findMany({
    where: {
      id: { in: categoryIds },
      type: "EVENT",
    },
  });

  if (categories.length !== categoryIds.length) {
    throw new Error("Una o más categorías no son válidas o no son del tipo EVENT");
  }

  // Validar que endDate sea posterior a eventDate si existe
  if (endDate && new Date(endDate) <= new Date(eventDate)) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
  }

  console.log('📝 Creando evento con categoryIds:', categoryIds);

  return await createCalendarEvent({
    title: title.trim(),
    description: description?.trim() || null,
    eventDate: new Date(eventDate),
    endDate: endDate ? new Date(endDate) : null,
    categoryIds, // 👈 El modelo lo transformará a la estructura de Prisma
    location: location?.trim() || null,
    isPublic: isPublic !== undefined ? isPublic : true,
    createdBy: userId,
  });
}

/**
 * Obtener todos los eventos del calendario con filtros
 */
export async function getAllCalendarEventsService(filters = {}) {
  return await findAllCalendarEvents(filters);
}

/**
 * Obtener evento por ID
 */
export async function getCalendarEventByIdService(id) {
  const event = await findCalendarEventById(id);
  if (!event) throw new Error("Evento no encontrado");
  return event;
}

/**
 * Actualizar un evento del calendario
 */
export async function updateCalendarEventService(id, data) {
  const existing = await findCalendarEventById(id);
  if (!existing) throw new Error("Evento no encontrado");

  console.log('📝 Actualizando evento con data:', data);

  // Si vienen categoryIds, validar que sean del tipo EVENT
  if (data.categoryIds) {
    if (!Array.isArray(data.categoryIds) || data.categoryIds.length === 0) {
      throw new Error("Se requiere al menos una categoría");
    }

    const categories = await prisma.activityCategory.findMany({
      where: {
        id: { in: data.categoryIds },
        type: "EVENT",
      },
    });

    if (categories.length !== data.categoryIds.length) {
      throw new Error("Una o más categorías no son válidas o no son del tipo EVENT");
    }

    console.log('✅ Categorías validadas:', categories.map(c => ({ id: c.id, name: c.name })));
  }

  // Validar rango de fechas si se actualiza
  const newEventDate = data.eventDate ? new Date(data.eventDate) : new Date(existing.eventDate);
  const newEndDate = data.endDate ? new Date(data.endDate) : existing.endDate ? new Date(existing.endDate) : null;

  if (newEndDate && newEndDate <= newEventDate) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
  }

  // Convertir fechas a Date si vienen como string
  const updateData = { ...data };
  if (updateData.eventDate) {
    updateData.eventDate = new Date(updateData.eventDate);
  }
  if (updateData.endDate !== undefined) {
    updateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
  }

  console.log('🔄 Enviando al modelo:', updateData);

  const updated = await updateCalendarEvent(id, updateData);

  console.log('✅ Evento actualizado:', updated);

  return updated;
}

/**
 * Eliminar un evento del calendario
 */
export async function deleteCalendarEventService(id) {
  const existing = await findCalendarEventById(id);
  if (!existing) throw new Error("Evento no encontrado");

  await deleteCalendarEvent(id);
  return { message: "Evento eliminado correctamente" };
}

/**
 * Obtener datos combinados para el calendario público
 */
export async function getCalendarDataService({ month, year }) {
  if (!month || !year) {
    throw new Error("Se requieren los parámetros month y year");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Obtener experiencias con fechas en el mes
  const activities = await prisma.activity.findMany({
    where: {
      availability: true,
      eventStartDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
      media: {
        take: 1,
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      },
    },
    orderBy: { eventStartDate: "asc" },
  });

  // Obtener eventos personalizados públicos del mes con sus categorías
  const customEvents = await prisma.calendarEvent.findMany({
    where: {
      isPublic: true,
      eventDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      },
    },
    orderBy: { eventDate: "asc" },
  });

  // Mapear experiencias
  const mappedActivities = activities.map((act) => ({
    id: act.id,
    type: "activity",
    title: act.title,
    description: act.description,
    eventDate: act.eventStartDate,
    endDate: act.eventEndDate,
    location: [act.city, act.state].filter(Boolean).join(", ") || null,
    coverUrl: act.media[0]?.url || null,
    price: act.price,
    capacity: act.capacity,
    categories: act.categories?.map((rel) => ({
      id: rel.category.id,
      name: rel.category.name,
      slug: rel.category.slug,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
  }));

  // Mapear eventos personalizados con sus categorías
  const mappedCustomEvents = customEvents.map((evt) => ({
    id: evt.id,
    type: "custom",
    title: evt.title,
    description: evt.description,
    eventDate: evt.eventDate,
    endDate: evt.endDate,
    location: evt.location,
    categories: evt.categories?.map((rel) => ({
      id: rel.category.id,
      name: rel.category.name,
      slug: rel.category.slug,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
    createdBy: evt.user?.name || null,
  }));

  return {
    activities: mappedActivities,
    customEvents: mappedCustomEvents,
  };
}