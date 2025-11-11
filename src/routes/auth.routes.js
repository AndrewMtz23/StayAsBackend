import express from "express";
import { 
  register, 
  login, 
  verify, 
  resendCode, 
  forgotPassword, 
  resetPasswordController,
  getMe,
  getUserProfile,
  updateMyProfile
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../middlewares/upload.middleware.js";

const router = express.Router();

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// Registro con middleware condicional para multer
router.post("/register", (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // Si es FormData (con archivo), usa multer
  if (contentType.includes('multipart/form-data')) {
    uploadProfile(req, res, (err) => {
      if (err) {
        console.error("❌ Error en upload:", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  } else {
    // Si es JSON, continúa sin multer
    next();
  }
}, register);

// Verificar email
router.post("/verify", verify);

// Reenviar código de verificación
router.post("/resend-code", resendCode);

// Inicio de sesión
router.post("/login", login);

// Recuperación de contraseña
router.post("/forgot-password", forgotPassword);

// Restablecer contraseña con token
router.post("/reset-password", resetPasswordController);

/**
 * GET /api/auth/me
 * Obtiene el perfil del usuario autenticado
 * Requiere token JWT válido
 */
router.get("/me", verifyToken, getMe);

/**
 * GET /api/auth/profile/:id
 * Obtiene el perfil público de un usuario
 * Requiere token JWT válido
 * Solo permite ver perfiles públicos (CLIENT/HOST) o el propio perfil
 */
router.get("/profile/:id", verifyToken, getUserProfile);

// Actualizar el perfil del usuario autenticado
router.put("/profile", verifyToken, uploadProfile, updateMyProfile);

/**
 * PUT /api/auth/profile
 * Actualizar mi propio perfil
 */
router.put("/profile", verifyToken, uploadProfile, updateMyProfile);

export default router;