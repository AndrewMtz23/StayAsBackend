// RUTA: backend/controllers/activities.controller.js
import { prisma } from "../config/db.js";
import {
  createActivityService,
  getAllActivitiesService,
  getActivityByIdService,
  updateActivityService,
  deleteActivityService,
} from "../services/activity.service.js";
import {
  logActivityCreated,
  logActivityUpdated,
  logActivityDeleted,
} from "../services/log.service.js";

/**
 * Crear experiencia
 * Requiere: userId (implícito por token), title, description, price, capacity
 * Opcionales: address, city, state, latitude, longitude, categoryIds
 */
export async function createActivity(req, res) {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      price,
      capacity,
      address,
      city,
      state,
      latitude,
      longitude,
      categoryIds,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const result = await createActivityService({
      userId: Number(userId),
      title,
      description,
      price,
      capacity,
      address,
      city,
      state,
      latitude,
      longitude,
    });

    // Guardar categorías
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await prisma.activityCategoryRelation.createMany({
        data: categoryIds.map((catId) => ({
          activityId: result.activity.id,
          categoryId: Number(catId),
        })),
        skipDuplicates: true,
      });
    }

    // Log de creación de actividad
    await logActivityCreated(req, result.activity);

    return res.status(201).json(result);
  } catch (err) {
    console.error("Error al crear experiencia:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Listar experiencias
 * Soporta filtros: status, search, hostId
 * ✅ ACTUALIZADO: HOST solo ve sus propias experiencias
 */
export async function getActivities(req, res) {
  try {
    const { status, search, hostId, admin } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;
    
    const filters = {};
    
    // ✅ SOLO filtrar por userId si viene admin=true Y es HOST
    if (admin === "true" && role === "HOST") {
      console.log("✅ Panel Admin - HOST ve solo sus experiencias (userId:", userId, ")");
      filters.userId = userId;
    }
    // Si es ADMIN/EMPLOYEE en panel admin, puede filtrar por hostId específico
    else if (admin === "true" && hostId) {
      console.log("✅ Panel Admin - Filtrando por hostId:", hostId);
      filters.userId = parseInt(hostId);
    }
    // Si NO viene admin=true, es vista pública - todos ven todo
    else {
      console.log("👁️ Vista pública - Mostrando todas las experiencias");
    }
    
    // Filtro de estado
    if (status === 'active') {
      filters.availability = true;
    } else if (status === 'inactive') {
      filters.availability = false;
    }
    
    // Filtro de búsqueda
    if (search && search.trim()) {
      filters.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }
    
    const activities = await getAllActivitiesService(filters);
    return res.status(200).json(activities);
  } catch (err) {
    console.error("Error al listar experiencias:", err);
    return res.status(500).json({ error: "Error al obtener las experiencias" });
  }
}

/**
 * Obtener experiencia por ID
 */
export async function getActivityById(req, res) {
  try {
    const { id } = req.params;
    const activity = await getActivityByIdService(Number(id));
    return res.status(200).json(activity);
  } catch (err) {
    console.error("Error al obtener experiencia:", err);
    return res.status(404).json({ error: err.message });
  }
}

/**
 * Actualizar experiencia
 * Ahora soporta actualizar categorías
 */
export async function updateActivity(req, res) {
  try {
    const { id } = req.params;
    const { categoryIds, ...data } = req.body;

    const role = req.user?.role;
    const userId = req.user?.id;

    const existing = await getActivityByIdService(Number(id));
    if (!existing) {
      return res.status(404).json({ error: "Experiencia no encontrada" });
    }

    if (role === "HOST" && existing.user?.id !== userId) {
      return res.status(403).json({ error: "No eres dueño de esta experiencia" });
    }

    const updated = await updateActivityService(Number(id), data);

    // Actualizar categorías si vienen en el request
    if (categoryIds !== undefined) {
      await prisma.activityCategoryRelation.deleteMany({
        where: { activityId: Number(id) },
      });

      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await prisma.activityCategoryRelation.createMany({
          data: categoryIds.map((catId) => ({
            activityId: Number(id),
            categoryId: Number(catId),
          })),
          skipDuplicates: true,
        });
      }
    }

    // Log de actualización de actividad
    await logActivityUpdated(req, Number(id), updated.title);

    return res.status(200).json({
      message: "Experiencia actualizada correctamente",
      activity: updated,
    });
  } catch (err) {
    console.error("Error al actualizar experiencia:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Eliminar experiencia
 */
export async function removeActivity(req, res) {
  try {
    const { id } = req.params;
    const activityId = Number(id);
    const userId = req.user?.id;
    const role = req.user?.role;

    const activity = await getActivityByIdService(activityId);
    if (!activity) {
      return res.status(404).json({ error: "Experiencia no encontrada" });
    }

    if (role === "EMPLOYEE") {
      const updated = await updateActivityService(activityId, { availability: false });
      
      // Log de baja lógica
      await logActivityUpdated(req, activityId, `${activity.title} (baja lógica)`);
      
      return res.status(200).json({
        message: "Baja lógica aplicada a la experiencia",
        activity: updated,
      });
    }

    if (role === "HOST") {
      if (activity.user?.id !== userId) {
        return res.status(403).json({ error: "No eres dueño de esta experiencia" });
      }
      
      // Log de eliminación
      await logActivityDeleted(req, activityId, activity.title);
      
      const result = await deleteActivityService(activityId);
      return res.status(200).json(result);
    }

    if (role === "ADMIN") {
      // Log de eliminación
      await logActivityDeleted(req, activityId, activity.title);
      
      const result = await deleteActivityService(activityId);
      return res.status(200).json(result);
    }

    return res.status(403).json({ error: "Rol no autorizado para eliminar experiencias" });
  } catch (err) {
    console.error("Error al eliminar experiencia:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Subir media (imágenes) a una experiencia existente
 */
export async function addActivityMedia(req, res) {
  try {
    const activityId = Number(req.params.id);
    if (!activityId) {
      return res.status(400).json({ error: "Falta el parámetro :id" });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, title: true },
    });
    if (!activity) {
      return res.status(404).json({ error: "Experiencia no encontrada" });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: "No se recibieron imágenes" });
    }

    const records = files.map((f, idx) => ({
      activityId,
      type: "IMAGE",
      url: f.path.replace(/\\/g, "/"),
      order: idx + 1,
      description: null,
    }));

    await prisma.mediaActivity.createMany({ data: records });

    const media = await prisma.mediaActivity.findMany({
      where: { activityId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    // Log de subida de imágenes
    await logActivityUpdated(req, activityId, `${activity.title} - ${files.length} imagen(es) agregada(s)`);

    return res.status(201).json({
      message: "Imágenes subidas correctamente",
      count: files.length,
      media,
    });
  } catch (err) {
    console.error("Error al subir media de experiencia:", err);
    return res.status(500).json({ error: "Error al procesar las imágenes" });
  }
}

/**
 * Actualizar orden de las imágenes de una experiencia
 * PUT /api/experiences/:id/media/reorder
 * Body: { mediaIds: [3, 1, 2, 4] } // Array de IDs en el nuevo orden
 */
export async function reorderActivityMedia(req, res) {
  try {
    const activityId = Number(req.params.id);
    const { mediaIds } = req.body;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de mediaIds" });
    }

    // Verificar que la actividad existe
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, title: true },
    });

    if (!activity) {
      return res.status(404).json({ error: "Experiencia no encontrada" });
    }

    // Actualizar el orden de cada imagen
    const updates = mediaIds.map((mediaId, index) =>
      prisma.mediaActivity.update({
        where: { id: Number(mediaId) },
        data: { order: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    // Retornar las imágenes actualizadas
    const media = await prisma.mediaActivity.findMany({
      where: { activityId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    // Log de reordenamiento de imágenes
    await logActivityUpdated(req, activityId, `${activity.title} - Orden de imágenes actualizado`);

    return res.status(200).json({
      message: "Orden actualizado correctamente",
      media,
    });
  } catch (err) {
    console.error("Error al reordenar media:", err);
    return res.status(500).json({ error: "Error al actualizar el orden" });
  }
}