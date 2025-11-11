import { prisma } from "../config/db.js";
import {
  createPropertyService,
  getAllPropertiesService,
  getPropertyByIdService,
  updatePropertyService,
  deletePropertyService,
} from "../services/property.service.js";
import {
  logPropertyCreated,
  logPropertyUpdated,
  logPropertyDeleted,
} from "../services/log.service.js";

/**
 * Crear propiedad
 * Requiere: userId (implícito por token), title, description, type, price, capacity, bedrooms, bathrooms, address, city, state
 * Opcionales: zipCode, latitude, longitude, categoryIds
 */
export async function createProperty(req, res) {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      type,
      price,
      capacity,
      bedrooms,
      bathrooms,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      categoryIds,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const result = await createPropertyService({
      userId: Number(userId),
      title,
      description,
      type,
      price,
      capacity,
      bedrooms,
      bathrooms,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
    });

    // Guardar categorías
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await prisma.propertyCategoryRelation.createMany({
        data: categoryIds.map((catId) => ({
          propertyId: result.property.id,
          categoryId: Number(catId),
        })),
        skipDuplicates: true,
      });
    }

    // 📝 Log de creación de propiedad
    await logPropertyCreated(req, result.property);

    return res.status(201).json(result);
  } catch (err) {
    console.error("Error al crear propiedad:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Listar propiedades
 * Soporta filtros: status, search, hostId
 */
export async function getProperties(req, res) {
  try {
    const { status, search, hostId } = req.query;
    
    const filters = {};
    
    if (status === 'active') {
      filters.availability = true;
    } else if (status === 'inactive') {
      filters.availability = false;
    }
    
    if (search && search.trim()) {
      filters.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }
    
    if (hostId) {
      filters.userId = parseInt(hostId);
    }
    
    const properties = await getAllPropertiesService(filters);
    return res.status(200).json(properties);
  } catch (err) {
    console.error("Error al listar propiedades:", err);
    return res.status(500).json({ error: "Error al obtener las propiedades" });
  }
}

/**
 * Obtener propiedad por ID
 */
export async function getPropertyById(req, res) {
  try {
    const { id } = req.params;
    const property = await getPropertyByIdService(Number(id));
    return res.status(200).json(property);
  } catch (err) {
    console.error("Error al obtener propiedad:", err);
    return res.status(404).json({ error: err.message });
  }
}

/**
 * Actualizar propiedad
 * Ahora soporta actualizar categorías
 */
export async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const { categoryIds, amenities, ...data } = req.body; // 👈 EXTRAER amenities

    const role = req.user?.role;
    const userId = req.user?.id;

    const existing = await getPropertyByIdService(Number(id));
    if (!existing) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    if (role === "HOST" && existing.user?.id !== userId) {
      return res.status(403).json({ error: "No eres dueño de esta propiedad" });
    }

    // 👇 NO INCLUIR amenities en data
    const updated = await updatePropertyService(Number(id), data);

    // Actualizar categorías
    if (categoryIds !== undefined) {
      await prisma.propertyCategoryRelation.deleteMany({
        where: { propertyId: Number(id) },
      });

      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await prisma.propertyCategoryRelation.createMany({
          data: categoryIds.map((catId) => ({
            propertyId: Number(id),
            categoryId: Number(catId),
          })),
          skipDuplicates: true,
        });
      }
    }

    // 👇 Actualizar amenidades por separado
    if (amenities !== undefined) {
      await prisma.propertyAmenity.deleteMany({
        where: { propertyId: Number(id) },
      });

      if (Array.isArray(amenities) && amenities.length > 0) {
        await prisma.propertyAmenity.createMany({
          data: amenities.map((name) => ({
            propertyId: Number(id),
            name: name,
          })),
          skipDuplicates: true,
        });
      }
    }

    await logPropertyUpdated(req, Number(id), updated.title);

    return res.status(200).json({
      message: "Propiedad actualizada correctamente",
      property: updated,
    });
  } catch (err) {
    console.error("Error al actualizar propiedad:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Eliminar propiedad
 */
export async function removeProperty(req, res) {
  try {
    const { id } = req.params;
    const propertyId = Number(id);
    const userId = req.user?.id;
    const role = req.user?.role;

    const property = await getPropertyByIdService(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    if (role === "EMPLOYEE") {
      const updated = await updatePropertyService(propertyId, { availability: false });
      
      // Log de baja lógica
      await logPropertyUpdated(req, propertyId, `${property.title} (baja lógica)`);
      
      return res.status(200).json({
        message: "Baja lógica aplicada a la propiedad",
        property: updated,
      });
    }

    if (role === "HOST") {
      if (property.user?.id !== userId) {
        return res.status(403).json({ error: "No eres dueño de esta propiedad" });
      }
      
      // Log de eliminación
      await logPropertyDeleted(req, propertyId, property.title);
      
      const result = await deletePropertyService(propertyId);
      return res.status(200).json(result);
    }

    if (role === "ADMIN") {
      // Log de eliminación
      await logPropertyDeleted(req, propertyId, property.title);
      
      const result = await deletePropertyService(propertyId);
      return res.status(200).json(result);
    }

    return res.status(403).json({ error: "Rol no autorizado para eliminar propiedades" });
  } catch (err) {
    console.error("Error al eliminar propiedad:", err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Subir media (imágenes) a una propiedad existente
 */
export async function addPropertyMedia(req, res) {
  try {
    const propertyId = Number(req.params.id);
    if (!propertyId) {
      return res.status(400).json({ error: "Falta el parámetro :id" });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true },
    });
    if (!property) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: "No se recibieron imágenes" });
    }

    const records = files.map((f, idx) => ({
      propertyId,
      type: "IMAGE",
      url: f.path.replace(/\\/g, "/"),
      order: idx + 1,
      description: null,
    }));

    await prisma.propertyMedia.createMany({ data: records });

    const media = await prisma.propertyMedia.findMany({
      where: { propertyId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    // Log de subida de imágenes
    await logPropertyUpdated(req, propertyId, `${property.title} - ${files.length} imagen(es) agregada(s)`);

    return res.status(201).json({
      message: "Imágenes subidas correctamente",
      count: files.length,
      media,
    });
  } catch (err) {
    console.error("Error al subir media de propiedad:", err);
    return res.status(500).json({ error: "Error al procesar las imágenes" });
  }
}

/**
 * Actualizar orden de las imágenes de una propiedad
 * PUT /api/accommodations/:id/media/reorder
 * Body: { mediaIds: [3, 1, 2, 4] } // Array de IDs en el nuevo orden
 */
export async function reorderPropertyMedia(req, res) {
  try {
    const propertyId = Number(req.params.id);
    const { mediaIds } = req.body;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de mediaIds" });
    }

    // Verificar que la propiedad existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    // Actualizar el orden de cada imagen
    const updates = mediaIds.map((mediaId, index) =>
      prisma.propertyMedia.update({
        where: { id: Number(mediaId) },
        data: { order: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    // Retornar las imágenes actualizadas
    const media = await prisma.propertyMedia.findMany({
      where: { propertyId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    // Log de reordenamiento de imágenes
    await logPropertyUpdated(req, propertyId, `${property.title} - Orden de imágenes actualizado`);

    return res.status(200).json({
      message: "Orden actualizado correctamente",
      media,
    });
  } catch (err) {
    console.error("Error al reordenar media:", err);
    return res.status(500).json({ error: "Error al actualizar el orden" });
  }
}