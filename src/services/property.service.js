import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import {
  findAllProperties,
  findPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../models/property.model.js";

/**
 * Crear una nueva propiedad
 * - Crea la carpeta automáticamente: uploads/activities/accommodations/accommodation-<id>-<primeras5letras>
 */
export async function createPropertyService({ 
  userId, 
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
  longitude 
}) {
  // Validaciones básicas
  if (!userId || !title || !description || !type || !price || !capacity || !bedrooms || !bathrooms || !address || !city || !state) {
    throw new Error("Faltan campos requeridos");
  }

  // 🔧 VALIDACIONES MEJORADAS
  if (price < 0) {
    throw new Error("El precio no puede ser negativo");
  }
  
  if (capacity < 1) {
    throw new Error("La capacidad mínima es 1 persona");
  }

  if (bedrooms < 0) {
    throw new Error("El número de habitaciones no puede ser negativo");
  }

  if (bathrooms < 0) {
    throw new Error("El número de baños no puede ser negativo");
  }

  // Verificar que el usuario exista
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  // Crear la propiedad en BD
  const property = await createProperty({
    userId,
    title: title.trim(),
    description: description.trim(),
    type,
    price: parseFloat(price),
    capacity: Number(capacity),
    bedrooms: Number(bedrooms),
    bathrooms: Number(bathrooms),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    status: "PENDING", // Default
    availability: true,
  });

  // Crear carpeta automáticamente
  try {
    const prefix = title.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const folderName = `accommodation-${property.id}-${prefix}`;
    const basePath = path.join("uploads", "activities", "accommodations");
    const fullPath = path.join(basePath, folderName);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    console.log(`✅ Carpeta creada para propiedad: ${fullPath}`);

    return {
      message: "Propiedad creada correctamente",
      property,
      folderPath: fullPath.replace(/\\/g, "/"),
    };
  } catch (err) {
    console.error("❌ Error al crear carpeta de propiedad:", err);
    throw new Error("No se pudo crear la carpeta de la propiedad");
  }
}

/**
 * Obtener todas las propiedades con filtros opcionales
 */
export async function getAllPropertiesService(filters = {}) {
  return await findAllProperties(filters);
}

/**
 * Obtener propiedad por ID
 */
export async function getPropertyByIdService(id) {
  const property = await findPropertyById(id);
  if (!property) throw new Error("Propiedad no encontrada");
  return property;
}

/**
 * Actualizar una propiedad
 */
export async function updatePropertyService(id, data) {
  const existing = await findPropertyById(id);
  if (!existing) throw new Error("Propiedad no encontrada");

  // 🔧 VALIDACIONES MEJORADAS
  if (data.price !== undefined && data.price < 0) {
    throw new Error("El precio no puede ser negativo");
  }
  
  if (data.capacity !== undefined && data.capacity < 1) {
    throw new Error("La capacidad mínima es 1 persona");
  }

  if (data.bedrooms !== undefined && data.bedrooms < 0) {
    throw new Error("El número de habitaciones no puede ser negativo");
  }

  if (data.bathrooms !== undefined && data.bathrooms < 0) {
    throw new Error("El número de baños no puede ser negativo");
  }

  return await updateProperty(id, data);
}

/**
 * Eliminar una propiedad y su carpeta
 */
export async function deletePropertyService(id) {
  const existing = await findPropertyById(id);
  if (!existing) throw new Error("Propiedad no encontrada");

  // Eliminar carpeta asociada
  try {
    const prefix = existing.title.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const folderName = `accommodation-${existing.id}-${prefix}`;
    const fullPath = path.join("uploads", "activities", "accommodations", folderName);

    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🧹 Carpeta eliminada: ${fullPath}`);
    }
  } catch (err) {
    console.warn("⚠️ Error al eliminar carpeta:", err);
  }

  await deleteProperty(id);

  return { message: "Propiedad eliminada correctamente" };
}