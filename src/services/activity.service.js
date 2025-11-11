import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import {
  findAllActivities,
  findActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../models/activity.model.js";

/**
 * Crear una nueva experiencia
 * - Crea la carpeta automáticamente: uploads/activities/experiences/exp-<id>-<primeras5letras>
 */
export async function createActivityService({ userId, title, description, price, capacity, address, city, state, latitude, longitude }) {
  // Validaciones básicas
  if (!userId || !title || !description || !price || !capacity) {
    throw new Error("Faltan campos requeridos");
  }

  // 🔧 VALIDACIONES MEJORADAS
  if (price < 0) {
    throw new Error("El precio no puede ser negativo");
  }
  
  if (capacity < 1) {
    throw new Error("La capacidad mínima es 1 persona");
  }

  // Verificar que el usuario exista
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  // Crear la experiencia en BD
  const activity = await createActivity({
    userId,
    type: "EXPERIENCE",
    title: title.trim(),
    description: description.trim(),
    price: parseFloat(price),
    capacity: Number(capacity),
    address: address || null,
    city: city || null,
    state: state || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  });

  // Crear carpeta automáticamente
  try {
    const prefix = title.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const folderName = `exp-${activity.id}-${prefix}`;
    const basePath = path.join("uploads", "activities", "experiences");
    const fullPath = path.join(basePath, folderName);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    console.log(`✅ Carpeta creada para experiencia: ${fullPath}`);

    // 🐛 FIX: NO MODIFICAR LA DESCRIPCIÓN DEL USUARIO
    // Removido el update que agregaba la ruta al description

    return {
      message: "Experiencia creada correctamente",
      activity,
      folderPath: fullPath.replace(/\\/g, "/"),
    };
  } catch (err) {
    console.error("❌ Error al crear carpeta de experiencia:", err);
    throw new Error("No se pudo crear la carpeta de la experiencia");
  }
}


/**
 * Obtener todas las experiencias con filtros opcionales
 */
export async function getAllActivitiesService(filters = {}) {
  return await findAllActivities(filters);
}

/**
 * Obtener experiencia por ID
 */
export async function getActivityByIdService(id) {
  const activity = await findActivityById(id);
  if (!activity) throw new Error("Experiencia no encontrada");
  return activity;
}

/**
 * Actualizar una experiencia
 */
export async function updateActivityService(id, data) {
  const existing = await findActivityById(id);
  if (!existing) throw new Error("Experiencia no encontrada");

  // 🔧 VALIDACIONES MEJORADAS
  if (data.price !== undefined && data.price < 0) {
    throw new Error("El precio no puede ser negativo");
  }
  
  if (data.capacity !== undefined && data.capacity < 1) {
    throw new Error("La capacidad mínima es 1 persona");
  }

  return await updateActivity(id, data);
}

/**
 * Eliminar una experiencia y su carpeta
 */
export async function deleteActivityService(id) {
  const existing = await findActivityById(id);
  if (!existing) throw new Error("Experiencia no encontrada");

  // Eliminar carpeta asociada
  try {
    const prefix = existing.title.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const folderName = `exp-${existing.id}-${prefix}`;
    const fullPath = path.join("uploads", "activities", "experiences", folderName);

    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🧹 Carpeta eliminada: ${fullPath}`);
    }
  } catch (err) {
    console.warn("⚠️ Error al eliminar carpeta:", err);
  }

  await deleteActivity(id);

  return { message: "Experiencia eliminada correctamente" };
}