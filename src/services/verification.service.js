import { prisma } from "../config/db.js";
import { sendVerificationEmail } from "../config/email.js";

/**
 * Obtener códigos de verificación pendientes de un usuario
 */
export async function getUserVerificationCodes(userId) {
  return await prisma.verificationCode.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtener TODOS los códigos de verificación (solo admin)
 */
export async function getAllVerificationCodes() {
  return await prisma.verificationCode.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Eliminar un código de verificación específico
 */
export async function deleteVerificationCode(codeId) {
  return await prisma.verificationCode.delete({
    where: { id: Number(codeId) }
  });
}

/**
 * Eliminar todos los códigos de un usuario
 */
export async function deleteAllUserVerificationCodes(userId) {
  return await prisma.verificationCode.deleteMany({
    where: { userId: Number(userId) }
  });
}

/**
 * Generar y enviar nuevo código de verificación
 */
export async function resendVerificationCodeAdmin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.isVerified) {
    throw new Error("Este usuario ya está verificado");
  }

  // Eliminar códigos anteriores
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id }
  });

  // Generar nuevo código
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: verificationCode,
      expiresAt
    }
  });

  // Enviar email
  try {
    await sendVerificationEmail(user.email, user.name, verificationCode);
    return {
      message: "Código de verificación reenviado correctamente",
      code: verificationCode, // Para mostrar en admin
      expiresAt
    };
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}

/**
 * Limpiar códigos expirados (función de mantenimiento)
 */
export async function cleanExpiredCodes() {
  const deleted = await prisma.verificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return {
    message: `${deleted.count} código(s) expirado(s) eliminado(s)`,
    count: deleted.count
  };
}