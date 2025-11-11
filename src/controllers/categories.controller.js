import {
  getAllCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/category.service.js";
import {
  logCategoryCreated,
  logCategoryUpdated,
  logCategoryDeleted,
} from "../services/log.service.js";

/**
 * GET /api/categories?type=ACTIVITY - Listar todas las categorías
 * Query params opcionales:
 * - type: "ACTIVITY" o "PROPERTY" (filtra por tipo)
 */
export async function getCategories(req, res) {
  try {
    const { type } = req.query;
    
    const categories = await getAllCategoriesService(type);
    return res.status(200).json(categories);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    return res.status(500).json({ error: "Error al obtener las categorías" });
  }
}

/**
 * GET /api/categories/:id - Obtener categoría por ID
 */
export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const category = await getCategoryByIdService(Number(id));
    return res.status(200).json(category);
  } catch (err) {
    console.error("Error al obtener categoría:", err);
    return res.status(404).json({ error: err.message });
  }
}

/**
 * POST /api/categories - Crear nueva categoría
 * Body: { name, slug, type, icon, color, description, order }
 */
export async function createCategory(req, res) {
  try {
    const { name, slug, type, icon, color, description, order } = req.body;

    const category = await createCategoryService({
      name,
      slug,
      type,
      icon,
      color,
      description,
      order,
    });

    // Log de creación de categoría
    await logCategoryCreated(req, category);

    return res.status(201).json({
      message: "Categoría creada correctamente",
      category,
    });
  } catch (err) {
    console.error("Error al crear categoría:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/categories/:id - Actualizar categoría
 */
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await updateCategoryService(Number(id), data);

    // Log de actualización de categoría
    await logCategoryUpdated(req, Number(id), updated.name);

    return res.status(200).json({
      message: "Categoría actualizada correctamente",
      category: updated,
    });
  } catch (err) {
    console.error("Error al actualizar categoría:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/categories/:id - Eliminar categoría
 */
export async function removeCategory(req, res) {
  try {
    const { id } = req.params;

    // Obtener categoría antes de eliminar para el log
    const category = await getCategoryByIdService(Number(id));
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const result = await deleteCategoryService(Number(id));

    // Log de eliminación de categoría
    await logCategoryDeleted(req, Number(id), category.name);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    return res.status(400).json({ error: err.message });
  }
}