import { prisma } from "../config/db.js";

/**
 * Obtener todas las categorías con filtro opcional por tipo
 * @param {Object} filters - Filtros opcionales { type: "ACTIVITY" | "PROPERTY" }
 */
export async function findAllCategories(filters = {}) {
  return await prisma.activityCategory.findMany({
    where: filters,
    orderBy: { order: "asc" },
  });
}

/**
 * Obtener una categoría por ID
 */
export async function findCategoryById(id) {
  return await prisma.activityCategory.findUnique({
    where: { id: Number(id) },
  });
}

/**
 * Crear nueva categoría
 */
export async function createCategory(data) {
  return await prisma.activityCategory.create({
    data,
  });
}

/**
 * Actualizar una categoría existente
 */
export async function updateCategory(id, data) {
  return await prisma.activityCategory.update({
    where: { id: Number(id) },
    data,
  });
}

/**
 * Eliminar una categoría
 */
export async function deleteCategory(id) {
  return await prisma.activityCategory.delete({
    where: { id: Number(id) },
  });
}