import { prisma } from "../config/db.js";

/**
 * Obtiene todos los usuarios
 * ✅ ACTUALIZADO: Ahora incluye información de solicitud de Host
 */
export async function findAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
      hostRequest: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Obtiene un usuario por su ID
 * ✅ ACTUALIZADO: Ahora incluye información completa de solicitud de Host
 */
export async function findUserById(id) {
  return await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
      // ✅ NUEVO: Incluir solicitud de Host completa
      hostRequest: {
        select: {
          id: true,
          status: true,
          initialMessage: true,
          motivation: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true
        }
      }
    },
  });
}

/**
 * Obtiene un usuario por email
 */
export async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

/**
 * Crea un nuevo usuario (solo para admin)
 */
export async function createUserModel(data) {
  return await prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Actualiza un usuario existente
 */
export async function updateUserModel(id, data) {
  return await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Elimina un usuario
 */
export async function deleteUserModel(id) {
  return await prisma.user.delete({
    where: { id: Number(id) },
  });
}

/**
 * Cambia el estado de verificación de un usuario
 */
export async function toggleUserVerification(id, isVerified) {
  return await prisma.user.update({
    where: { id: Number(id) },
    data: { isVerified },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
    },
  });
}