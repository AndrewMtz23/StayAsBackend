import { prisma } from "../config/db.js";

/**
 * Obtener todos los eventos del calendario con filtros opcionales
 */
export async function findAllCalendarEvents(filters = {}) {
  const where = {};
  
  if (filters.category) {
    where.categories = {
      some: {
        category: {
          slug: filters.category
        }
      }
    };
  }
  
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }
  
  if (filters.month !== undefined && filters.year !== undefined) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
    
    where.eventDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Búsqueda por texto
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Rango de fechas personalizado
  if (filters.startDate || filters.endDate) {
    where.eventDate = {};
    if (filters.startDate) {
      where.eventDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.eventDate.lte = new Date(filters.endDate);
    }
  }
  
  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
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
  
  return events;
}

/**
 * Obtener un evento del calendario por ID
 */
export async function findCalendarEventById(id) {
  return await prisma.calendarEvent.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      },
    },
  });
}

/**
 * Crear nuevo evento del calendario
 * 🔥 SOLUCIÓN: Usar transacción para manejar la creación
 */
export async function createCalendarEvent(data) {
  const { categoryIds, ...eventData } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Crear el evento sin categorías
    const event = await tx.calendarEvent.create({
      data: eventData,
    });

    // 2. Crear las relaciones de categorías
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await tx.calendarEventCategoryRelation.createMany({
        data: categoryIds.map(categoryId => ({
          calendarEventId: event.id,
          categoryId: Number(categoryId)
        }))
      });
    }

    // 3. Retornar el evento completo con relaciones
    return await tx.calendarEvent.findUnique({
      where: { id: event.id },
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
    });
  });
}

/**
 * Actualizar un evento del calendario
 * 🔥 SOLUCIÓN: Usar transacción para actualizar categorías
 */
export async function updateCalendarEvent(id, data) {
  const { categoryIds, ...eventData } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Actualizar campos básicos del evento
    await tx.calendarEvent.update({
      where: { id: Number(id) },
      data: eventData,
    });

    // 2. Si vienen categoryIds, reemplazar las categorías
    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      // Eliminar todas las relaciones existentes
      await tx.calendarEventCategoryRelation.deleteMany({
        where: { calendarEventId: Number(id) }
      });

      // Crear nuevas relaciones (solo si hay categorías)
      if (categoryIds.length > 0) {
        await tx.calendarEventCategoryRelation.createMany({
          data: categoryIds.map(categoryId => ({
            calendarEventId: Number(id),
            categoryId: Number(categoryId)
          }))
        });
      }
    }

    // 3. Retornar el evento completo actualizado
    return await tx.calendarEvent.findUnique({
      where: { id: Number(id) },
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
    });
  });
}

/**
 * Eliminar un evento del calendario
 */
export async function deleteCalendarEvent(id) {
  // El cascade eliminará automáticamente las relaciones
  return await prisma.calendarEvent.delete({
    where: { id: Number(id) },
  });
}