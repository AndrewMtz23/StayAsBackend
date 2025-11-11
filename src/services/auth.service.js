import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/email.js";

// Verificar que JWT_SECRET esté configurado
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado en las variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

// Generar código de 6 dígitos
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sanitizar texto
function sanitizeText(text) {
  return text
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');
}

// Validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar contraseña fuerte
function isStrongPassword(password) {
  // Al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
}

// Validar rol
function isValidRole(role) {
  const validRoles = ["ADMIN", "EMPLOYEE", "HOST", "CLIENT"];
  return validRoles.includes(role);
}

/**
 * Registrar un nuevo usuario
 */
export async function registerUser({ name, email, password, role, profileImagePath }) {
  // Sanitizar inputs
  name = sanitizeText(name);
  email = email.toLowerCase().trim();
  
  // Validaciones
  if (!name || name.length < 3) {
    throw new Error("El nombre debe tener al menos 3 caracteres");
  }
  
  if (!isValidEmail(email)) {
    throw new Error("Formato de correo inválido");
  }
  
  // ✅ Validación consistente
  if (!isStrongPassword(password)) {
    throw new Error("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial");
  }
  
  if (!isValidRole(role)) {
    throw new Error("Rol inválido");
  }

  // Verificar si el correo ya existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("El correo ya está registrado");

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario (sin imagen todavía)
  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashedPassword, 
      role,
      profileImage: null,
      isVerified: false
    },
  });

  // ✅ Crear carpeta del usuario y asignar imagen
  try {
    const namePrefix = name.toLowerCase().slice(0, 3).replace(/\s/g, '');
    const folderName = `user-${user.id}-${namePrefix}`;
    const userFolderPath = path.join("uploads", "profiles", folderName);
    
    // Crear la carpeta del usuario
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    let finalImagePath;

    if (profileImagePath) {
      // Si el usuario subió una imagen, moverla a su carpeta
      const ext = path.extname(profileImagePath);
      finalImagePath = path.join(userFolderPath, `profile${ext}`);
      fs.renameSync(profileImagePath, finalImagePath);
    } else {
      // Si NO subió imagen, copiar la imagen por defecto
      const defaultImagePath = path.join("uploads", "profiles", "base", "character_00.png");
      finalImagePath = path.join(userFolderPath, "profile.png");
      
      // Verificar que existe la imagen por defecto
      if (fs.existsSync(defaultImagePath)) {
        fs.copyFileSync(defaultImagePath, finalImagePath);
      } else {
        // Si no existe la imagen por defecto, continuar sin imagen
        finalImagePath = null;
      }
    }

    // Actualizar la ruta en la base de datos (si hay imagen)
    if (finalImagePath) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: finalImagePath.replace(/\\/g, '/') }
      });

      user.profileImage = finalImagePath.replace(/\\/g, '/');
    }
    
  } catch (err) {
    console.error("Error al procesar imagen:", err.message);
    // Si falla, eliminar archivo temporal si existe
    if (profileImagePath && fs.existsSync(profileImagePath)) {
      fs.unlinkSync(profileImagePath);
    }
  }

  // Generar código de verificación
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: verificationCode,
      expiresAt,
    },
  });

  // Enviar email con el código
  try {
    await sendVerificationEmail(email, name, verificationCode);
  } catch (error) {
    console.error("Error al enviar email:", error.message);
    throw new Error("Error al enviar el correo de verificación");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    message: "Usuario registrado. Por favor verifica tu correo electrónico.",
  };
}

/**
 * Verificar código de email
 */
export async function verifyEmail({ email, code }) {
  email = email.toLowerCase().trim();

  // Buscar usuario
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuario no encontrado");

  if (user.isVerified) {
    throw new Error("Este correo ya está verificado");
  }

  // Buscar código de verificación
  const verificationRecord = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      code: code,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!verificationRecord) {
    throw new Error("Código inválido");
  }

  // Verificar si el código expiró
  if (new Date() > verificationRecord.expiresAt) {
    throw new Error("El código ha expirado");
  }

  // Marcar usuario como verificado
  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  // Eliminar códigos de verificación usados
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id },
  });

  return {
    message: "Email verificado correctamente",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: true,
    },
  };
}

/**
 * Reenviar código de verificación
 */
export async function resendVerificationCode({ email }) {
  email = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuario no encontrado");

  if (user.isVerified) {
    throw new Error("Este correo ya está verificado");
  }

  // Eliminar códigos anteriores
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id },
  });

  // Generar nuevo código
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: verificationCode,
      expiresAt,
    },
  });

  // Enviar email
  await sendVerificationEmail(email, user.name, verificationCode);

  return {
    message: "Código reenviado correctamente",
  };
}

/**
 * Iniciar sesión
 */
export async function loginUser({ email, password }) {
  email = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuario no encontrado");

  // Verificar si el email está verificado
  if (!user.isVerified) {
    throw new Error("Debes verificar tu correo electrónico antes de iniciar sesión");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Contraseña incorrecta");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
    },
  };
}

/**
 * Solicitar recuperación de contraseña
 */
export async function requestPasswordReset({ email }) {
  email = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Por seguridad, no revelamos si el email existe o no
    return {
      message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña",
    };
  }

  // Generar token único
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora

  // Eliminar tokens antiguos del usuario
  await prisma.passwordReset.deleteMany({
    where: { userId: user.id },
  });

  // Crear nuevo token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt,
    },
  });

  // Enviar email con el link
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  
  try {
    await sendPasswordResetEmail(email, user.name, resetLink);
  } catch (error) {
    console.error("Error al enviar email:", error.message);
    throw new Error("Error al enviar el correo de recuperación");
  }

  return {
    message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña",
  };
}

/**
 * Restablecer contraseña con token
 */
export async function resetPassword({ token, newPassword }) {
  // Validar token
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new Error("Token inválido o expirado");
  }

  // Verificar si el token expiró
  if (new Date() > resetRecord.expiresAt) {
    throw new Error("El token ha expirado");
  }

  // ✅ Validar nueva contraseña
  if (!isStrongPassword(newPassword)) {
    throw new Error("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial");
  }

  // Encriptar nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { password: hashedPassword },
  });

  // Eliminar token usado
  await prisma.passwordReset.deleteMany({
    where: { userId: resetRecord.userId },
  });

  return {
    message: "Contraseña actualizada correctamente",
    userId: resetRecord.userId
  };
}