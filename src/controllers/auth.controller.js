import { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  resendVerificationCode, 
  requestPasswordReset, 
  resetPassword 
} from "../services/auth.service.js";
import { 
  logLogin, 
  logFailedLogin,
  logRegister,
  logVerifyEmail,
  logResendVerificationCode,
  logRequestPasswordReset,
  logPasswordReset
} from "../services/log.service.js";
import { findUserById, findUserByEmail, updateUserModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

/**
 * Controlador para registrar un nuevo usuario
 */
export async function register(req, res) {
  try {
    console.log("📦 Datos recibidos:", req.body);
    console.log("🖼️ Archivo recibido:", req.file);
    
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: name, email, password" 
      });
    }
    
    const profileImagePath = req.file ? req.file.path : null;
    
    const user = await registerUser({ 
      name, 
      email, 
      password, 
      role: role || "CLIENT",
      profileImagePath 
    });

    // Log de registro
    await logRegister(req, user);
    
    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
      user,
    });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Controlador para verificar email
 */
export async function verify(req, res) {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: email, code" 
      });
    }
    
    const result = await verifyEmail({ email, code });

    // Log de verificación de email
    await logVerifyEmail(req, result.user?.id, email);
    
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en verificación:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Controlador para reenviar código
 */
export async function resendCode(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }
    
    const result = await resendVerificationCode({ email });

    // Log de reenvío de código
    await logResendVerificationCode(req, email);
    
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error al reenviar código:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Controlador para iniciar sesión
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    // Log de login exitoso
    await logLogin(req, result.user);
    
    res.status(200).json(result);
  } catch (err) {
    // Log de login fallido
    const { email } = req.body;
    if (email) {
      await logFailedLogin(req, email);
    }
    
    res.status(401).json({ error: err.message });
  }
}

/**
 * Controlador para solicitar recuperación de contraseña
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }
    
    const result = await requestPasswordReset({ email });

    // Log de solicitud de recuperación
    await logRequestPasswordReset(req, email);
    
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en recuperación:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Controlador para restablecer contraseña
 */
export async function resetPasswordController(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: "Token y nueva contraseña son requeridos" 
      });
    }
    
    const result = await resetPassword({ token, newPassword });

    // Log de reseteo de contraseña
    await logPasswordReset(req, result.userId || null);
    
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error al resetear contraseña:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/auth/me
 * Obtiene el perfil del usuario autenticado
 */
export async function getMe(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: "Usuario no autenticado" 
      });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
    }

    res.status(200).json(user);

  } catch (err) {
    console.error("Error en /auth/me:", err);
    res.status(500).json({ 
      error: "Error al obtener perfil del usuario" 
    });
  }
}

/**
 * GET /api/users/:id/profile
 * Obtiene el perfil público de un usuario
 */
export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    const targetUser = await findUserById(Number(id));

    if (!targetUser) {
      return res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
    }

    const isOwnProfile = currentUserId === targetUser.id;

    if (isOwnProfile) {
      return res.status(200).json(targetUser);
    }

    if (currentUserRole === "ADMIN") {
      return res.status(200).json(targetUser);
    }

    if (targetUser.role === "EMPLOYEE" || targetUser.role === "ADMIN") {
      return res.status(403).json({ 
        error: "Este perfil no está disponible públicamente" 
      });
    }

    res.status(200).json(targetUser);

  } catch (err) {
    console.error("Error al obtener perfil público:", err);
    res.status(500).json({ 
      error: "Error al obtener el perfil" 
    });
  }
}

/**
 * PUT /api/auth/profile
 * Permite al usuario autenticado actualizar su propio perfil
 */
export async function updateMyProfile(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: "Usuario no autenticado" 
      });
    }

    const { name, email, password, currentPassword } = req.body;
    const profileImage = req.file;

    if (!name && !email && !password && !profileImage) {
      return res.status(400).json({ 
        error: "Debes proporcionar al menos un campo para actualizar" 
      });
    }

    const currentUser = await findUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const updateData = {};

    if (name !== undefined) {
      const sanitizedName = name.trim();
      if (sanitizedName.length < 3) {
        return res.status(400).json({ 
          error: "El nombre debe tener al menos 3 caracteres" 
        });
      }
      updateData.name = sanitizedName;
    }

    if (email !== undefined) {
      const sanitizedEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json({ 
          error: "Formato de correo inválido" 
        });
      }

      if (sanitizedEmail !== currentUser.email) {
        const emailInUse = await findUserByEmail(sanitizedEmail);
        
        if (emailInUse) {
          return res.status(400).json({ 
            error: "El correo ya está registrado por otro usuario" 
          });
        }
      }
      
      updateData.email = sanitizedEmail;
    }

    if (password !== undefined && password !== "") {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: "Debes proporcionar tu contraseña actual para cambiarla" 
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ 
          error: "La contraseña actual es incorrecta" 
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
          error: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial" 
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    if (profileImage) {
      try {
        const userName = updateData.name || currentUser.name;
        const namePrefix = userName.toLowerCase().slice(0, 3).replace(/\s/g, '');
        const folderName = `user-${userId}-${namePrefix}`;
        const userFolderPath = path.join("uploads", "profiles", folderName);

        if (!fs.existsSync(userFolderPath)) {
          fs.mkdirSync(userFolderPath, { recursive: true });
        }

        const ext = path.extname(profileImage.originalname);
        const finalImagePath = path.join(userFolderPath, `profile${ext}`);

        const existingFiles = fs.readdirSync(userFolderPath);
        existingFiles.forEach(file => {
          if (file.startsWith('profile.')) {
            fs.unlinkSync(path.join(userFolderPath, file));
          }
        });

        fs.renameSync(profileImage.path, finalImagePath);
        updateData.profileImage = finalImagePath.replace(/\\/g, '/');
        
      } catch (err) {
        console.error("Error al procesar imagen:", err);
        if (profileImage && fs.existsSync(profileImage.path)) {
          fs.unlinkSync(profileImage.path);
        }
        return res.status(500).json({ 
          error: "Error al procesar la imagen" 
        });
      }
    }

    const updatedUser = await updateUserModel(userId, updateData);

    const { logUserUpdated } = await import("../services/log.service.js");
    await logUserUpdated(req, userId, updatedUser.name);

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      user: updatedUser
    });

  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ 
      error: "Error al actualizar el perfil" 
    });
  }
}