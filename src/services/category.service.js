import { prisma } from "../config/db.js";
import {
  findAllCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../models/category.model.js";

/**
 * Obtener todas las categorías con filtro opcional por tipo
 * @param {String} type - "ACTIVITY", "PROPERTY" o "EVENT" (opcional)
 */
export async function getAllCategoriesService(type) {
  const filters = {};
  
  // Filtrar por tipo si se proporciona
  if (type && ["ACTIVITY", "PROPERTY", "EVENT"].includes(type)) {
    filters.type = type;
  }
  
  return await findAllCategories(filters);
}

/**
 * Obtener categoría por ID
 */
export async function getCategoryByIdService(id) {
  const category = await findCategoryById(id);
  if (!category) throw new Error("Categoría no encontrada");
  return category;
}

/**
 * Crear una nueva categoría
 */
export async function createCategoryService({ name, slug, type, icon, color, description, order }) {
  // Validaciones
  if (!name || !slug) {
    throw new Error("El nombre y slug son obligatorios");
  }

  // Validar que el tipo sea válido
  if (type && !["ACTIVITY", "PROPERTY", "EVENT"].includes(type)) {
    throw new Error("El tipo debe ser 'ACTIVITY', 'PROPERTY' o 'EVENT'");
  }

  // Verificar que el slug no exista
  const existing = await prisma.activityCategory.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error(`Ya existe una categoría con el slug "${slug}"`);
  }

  return await createCategory({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    type: type || "ACTIVITY",
    icon: icon || null,
    color: color || null,
    description: description?.trim() || null,
    order: order ? Number(order) : null,
  });
}

/**
 * Actualizar una categoría
 */
export async function updateCategoryService(id, data) {
  console.log("🧩 Tipo recibido en backend:", data.type);
  try {
    const existing = await findCategoryById(id);
    if (!existing) throw new Error("Categoría no encontrada");

    if (data.type && !["ACTIVITY", "PROPERTY", "EVENT"].includes(data.type)) {
      console.log("❌ Tipo inválido detectado en validación");
      throw new Error("El tipo debe ser 'ACTIVITY', 'PROPERTY' o 'EVENT'");
    }

    const result = await updateCategory(id, data);
    return result;
  } catch (error) {
    console.error("💥 Error en updateCategoryService:", error);
    throw error;
  }
}

/**
 * Eliminar una categoría
 */
export async function deleteCategoryService(id) {
  const existing = await findCategoryById(id);
  if (!existing) throw new Error("Categoría no encontrada");

  // Verificar si hay experiencias, propiedades o eventos asociados
  const activitiesCount = await prisma.activityCategoryRelation.count({
    where: { categoryId: Number(id) },
  });

  const propertiesCount = await prisma.propertyCategoryRelation.count({
    where: { categoryId: Number(id) },
  });

  const eventsCount = await prisma.calendarEventCategoryRelation.count({
    where: { categoryId: Number(id) },
  });

  const totalCount = activitiesCount + propertiesCount + eventsCount;

  if (totalCount > 0) {
    throw new Error(
      `No se puede eliminar: ${totalCount} registro(s) usan esta categoría (${activitiesCount} experiencias, ${propertiesCount} propiedades, ${eventsCount} eventos)`
    );
  }

  await deleteCategory(id);
  return { message: "Categoría eliminada correctamente" };
}