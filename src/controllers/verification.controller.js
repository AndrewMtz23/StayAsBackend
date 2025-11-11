import {
  getAllVerificationCodes,
  getUserVerificationCodes,
  deleteVerificationCode,
  deleteAllUserVerificationCodes,
  resendVerificationCodeAdmin,
  cleanExpiredCodes
} from "../services/verification.service.js";

/**
 * Obtener todos los códigos de verificación (ADMIN)
 */
export async function getVerificationCodes(req, res) {
  try {
    const codes = await getAllVerificationCodes();
    res.status(200).json(codes);
  } catch (err) {
    console.error("Error al obtener códigos:", err);
    res.status(500).json({ error: "Error al obtener códigos de verificación" });
  }
}

/**
 * Obtener códigos de un usuario específico
 */
export async function getUserCodes(req, res) {
  try {
    const { userId } = req.params;
    const codes = await getUserVerificationCodes(userId);
    res.status(200).json(codes);
  } catch (err) {
    console.error("Error al obtener códigos del usuario:", err);
    res.status(500).json({ error: "Error al obtener códigos" });
  }
}

/**
 * Eliminar un código específico
 */
export async function deleteCode(req, res) {
  try {
    const { id } = req.params;
    await deleteVerificationCode(id);
    res.status(200).json({ message: "Código eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar código:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Eliminar todos los códigos de un usuario
 */
export async function deleteUserCodes(req, res) {
  try {
    const { userId } = req.params;
    const result = await deleteAllUserVerificationCodes(userId);
    res.status(200).json({ 
      message: "Códigos eliminados correctamente",
      count: result.count 
    });
  } catch (err) {
    console.error("Error al eliminar códigos:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Reenviar código de verificación (ADMIN)
 */
export async function resendCode(req, res) {
  try {
    const { userId } = req.params;
    const result = await resendVerificationCodeAdmin(userId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error al reenviar código:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Limpiar códigos expirados
 */
export async function cleanExpired(req, res) {
  try {
    const result = await cleanExpiredCodes();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error al limpiar códigos:", err);
    res.status(500).json({ error: "Error al limpiar códigos expirados" });
  }
}