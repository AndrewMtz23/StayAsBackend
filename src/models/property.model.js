import { prisma } from "../config/db.js";

/**
 * Obtener todas las propiedades (properties)
 * Puede usarse para mostrar todas o filtrarlas por host o estado.
 */
export async function findAllProperties(filters = {}) {
  const properties = await prisma.property.findMany({
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
  return properties.map((property) => ({
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    price: property.price,
    capacity: property.capacity,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    availability: property.availability,
    status: property.status,
    city: property.city,
    state: property.state,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    zipCode: property.zipCode,
    coverUrl: property.media[0]?.url || null,
    hostName: property.user?.name || null,
    hostId: property.user?.id || null,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    // ✅ Mapear las categorías SIN el campo categoryId duplicado
    categories: property.categories?.map(rel => ({
      id: rel.category.id,
      name: rel.category.name,
      description: rel.category.description,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
  }));
}

/**
 * Obtener una propiedad por ID
 */
export async function findPropertyById(id) {
  const property = await prisma.property.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      media: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
      amenities: true,
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

  if (!property) return null;

  // Mapear para el modal de edición
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    price: property.price,
    capacity: property.capacity,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    availability: property.availability,
    status: property.status,
    city: property.city,
    state: property.state,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    zipCode: property.zipCode,
    user: property.user,
    media: property.media,
    amenities: property.amenities,
    // ✅ Mapear categorías SIN el campo categoryId duplicado
    categories: property.categories?.map(rel => ({
      id: rel.category.id,
      name: rel.category.name,
      description: rel.category.description,
      color: rel.category.color,
      icon: rel.category.icon,
    })) || [],
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

/**
 * Crear nueva propiedad
 */
export async function createProperty(data) {
  return await prisma.property.create({
    data,
    include: {
      user: { select: { id: true, name: true } },
      categories: true,
    },
  });
}

/**
 * Actualizar una propiedad existente
 */
export async function updateProperty(id, data) {
  return await prisma.property.update({
    where: { id: Number(id) },
    data,
    include: {
      user: { select: { id: true, name: true } },
      categories: true,
    },
  });
}

/**
 * Eliminar una propiedad
 */
export async function deleteProperty(id) {
  return await prisma.property.delete({
    where: { id: Number(id) },
  });
}