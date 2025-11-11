import { prisma } from "../config/db.js";

/**
 * Obtener todas las experiencias (activities)
 * Puede usarse para mostrar todas o filtrarlas por host o estado.
 */
export async function findAllActivities(filters = {}) {
  const activities = await prisma.activity.findMany({
    where: filters,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      media: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        take: 1, // Solo la primera imagen (portada) para la tabla
      },
      categories: {
        include: { 
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true,
              icon: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Mapear los datos para que sean más fáciles de usar en el frontend
  return activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    price: activity.price,
    capacity: activity.capacity,
    availability: activity.availability,
    city: activity.city,
    state: activity.state,
    address: activity.address,
    latitude: activity.latitude,
    longitude: activity.longitude,
    coverUrl: activity.media[0]?.url || null,
    hostName: activity.user?.name || null,
    hostId: activity.user?.id || null,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    // Mapear las categorías de forma limpia
    categories: activity.categories?.map(rel => ({
      id: rel.category.id,
      name: rel.category.name,
      description: rel.category.description,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
  }));
}

/**
 * Obtener una experiencia por ID
 */
export async function findActivityById(id) {
  const activity = await prisma.activity.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      media: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
      categories: {
        include: { 
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  if (!activity) return null;

  // 🔧 FIX: Mapear TODOS los campos incluyendo los opcionales
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    price: activity.price,
    capacity: activity.capacity,
    availability: activity.availability,
    city: activity.city,
    state: activity.state,
    address: activity.address,
    latitude: activity.latitude,
    longitude: activity.longitude,
    eventStartDate: activity.eventStartDate,
    eventEndDate: activity.eventEndDate,
    duration: activity.duration,
    included: activity.included,
    isFeatured: activity.isFeatured,
    viewCount: activity.viewCount,
    // Resto de campos
    user: activity.user,
    media: activity.media,
    // Mapear categorías (mantener categoryId para compatibilidad con el modal)
    categories: activity.categories?.map(rel => ({
      id: rel.category.id,
      categoryId: rel.category.id, // Para el modal (aunque ya no es necesario con el fix)
      name: rel.category.name,
      description: rel.category.description,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}

/**
 * Crear nueva experiencia
 */
export async function createActivity(data) {
  return await prisma.activity.create({
    data,
    include: {
      user: { select: { id: true, name: true } },
      categories: true,
    },
  });
}

/**
 * Actualizar una experiencia existente
 */
export async function updateActivity(id, data) {
  return await prisma.activity.update({
    where: { id: Number(id) },
    data,
    include: {
      user: { select: { id: true, name: true } },
      categories: true,
    },
  });
}

/**
 * Eliminar una experiencia
 */
export async function deleteActivity(id) {
  return await prisma.activity.delete({
    where: { id: Number(id) },
  });
}