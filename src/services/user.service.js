import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { 
  findUserByEmail, 
  createUserModel, 
  updateUserModel, 
  deleteUserModel,
  toggleUserVerification,
  findUserById
} from "../models/user.model.js";

// ========================================
// FUNCIONES DE VALIDACIÓN
// ========================================

function sanitizeText(text) {
  return text
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

//  Validación consistente - mínimo 8 caracteres
function isStrongPassword(password) {
  // Al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
}

function isValidRole(role) {
  const validRoles = ["ADMIN", "EMPLOYEE", "HOST", "CLIENT"];
  return validRoles.includes(role);
}

// ========================================
// FUNCIÓN PARA PROCESAR IMAGEN
// ========================================

async function processProfileImage(userId, userName, tempFile) {
  try {
    const namePrefix = userName.toLowerCase().slice(0, 3).replace(/\s/g, '');
    const folderName = `user-${userId}-${namePrefix}`;
    const userFolderPath = path.join("uploads", "profiles", folderName);

    // Crear carpeta del usuario si no existe
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    // Obtener extensión del archivo temporal
    const ext = path.extname(tempFile.originalname);
    const finalImagePath = path.join(userFolderPath, `profile${ext}`);

    // Eliminar imagen anterior si existe
    const existingFiles = fs.readdirSync(userFolderPath);
    existingFiles.forEach(file => {
      if (file.startsWith('profile.')) {
        fs.unlinkSync(path.join(userFolderPath, file));
      }
    });

    // Mover archivo temporal a su ubicación final
    fs.renameSync(tempFile.path, finalImagePath);
    
    return finalImagePath.replace(/\\/g, '/');
  } catch (err) {
    console.error("Error al procesar imagen:", err.message);
    // Si falla, eliminar archivo temporal
    if (tempFile && fs.existsSync(tempFile.path)) {
      fs.unlinkSync(tempFile.path);
    }
    throw err;
  }
}

// ========================================
// CREAR USUARIO (ADMIN)
// ========================================

export async function createUserService({ name, email, password, role, profileImage }) {
  // Sanitizar inputs
  name = sanitizeText(name);
  email = email.toLowerCase().trim();
  role = role || "CLIENT";

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

  // Verificar si el email ya existe
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("El correo ya está registrado");
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario (sin imagen primero)
  const user = await createUserModel({
    name,
    email,
    password: hashedPassword,
    role,
    profileImage: null,
    isVerified: false,
  });

  // Procesar imagen (subida o por defecto)
  let imagePath = null;

  if (profileImage) {
    // Si subió imagen
    imagePath = await processProfileImage(user.id, name, profileImage);
  } else {
    // Asignar imagen por defecto
    try {
      const namePrefix = name.toLowerCase().slice(0, 3).replace(/\s/g, '');
      const folderName = `user-${user.id}-${namePrefix}`;
      const userFolderPath = path.join("uploads", "profiles", folderName);

      if (!fs.existsSync(userFolderPath)) {
        fs.mkdirSync(userFolderPath, { recursive: true });
      }

      const defaultImagePath = path.join("uploads", "profiles", "base", "character_00.png");
      const finalImagePath = path.join(userFolderPath, "profile.png");

      if (fs.existsSync(defaultImagePath)) {
        fs.copyFileSync(defaultImagePath, finalImagePath);
        imagePath = finalImagePath.replace(/\\/g, '/');
      }
    } catch (err) {
      console.error("Error al asignar imagen por defecto:", err.message);
    }
  }

  // Actualizar usuario con la imagen
  if (imagePath) {
    const updatedUser = await updateUserModel(user.id, {
      profileImage: imagePath
    });
    return updatedUser;
  }

  return user;
}

// ========================================
// ACTUALIZAR USUARIO
// ========================================

export async function updateUserService(id, { name, email, password, role, profileImage }) {
  const userId = Number(id);

  // Verificar que el usuario existe
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const updateData = {};

  // Validar y actualizar nombre
  if (name !== undefined) {
    name = sanitizeText(name);
    if (name.length < 3) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    updateData.name = name;
  }

  // Validar y actualizar email
  if (email !== undefined) {
    email = email.toLowerCase().trim();
    if (!isValidEmail(email)) {
      throw new Error("Formato de correo inválido");
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email !== existingUser.email) {
      const emailInUse = await findUserByEmail(email);
      if (emailInUse) {
        throw new Error("El correo ya está registrado por otro usuario");
      }
    }
    updateData.email = email;
  }

  // Validar y actualizar contraseña
  if (password !== undefined && password !== "") {
    // ✅ Validación consistente
    if (!isStrongPassword(password)) {
      throw new Error("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial");
    }
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Validar y actualizar rol
  if (role !== undefined) {
    if (!isValidRole(role)) {
      throw new Error("Rol inválido");
    }
    updateData.role = role;
  }

  // Procesar nueva imagen si se subió
  if (profileImage) {
    const userName = name || existingUser.name;
    const imagePath = await processProfileImage(userId, userName, profileImage);
    updateData.profileImage = imagePath;
  }

  // Actualizar usuario
  const updatedUser = await updateUserModel(userId, updateData);
  return updatedUser;
}

// ========================================
// ELIMINAR USUARIO
// ========================================

export async function deleteUserService(id) {
  const userId = Number(id);

  // Verificar que el usuario existe
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  // Eliminar carpeta de imágenes del usuario
  try {
    if (existingUser.profileImage) {
      const userFolder = path.dirname(existingUser.profileImage);
      if (fs.existsSync(userFolder)) {
        fs.rmSync(userFolder, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error("Error al eliminar carpeta de usuario:", err.message);
  }

  // Eliminar usuario de la BD
  await deleteUserModel(userId);

  return { message: "Usuario eliminado correctamente" };
}

// ========================================
// CAMBIAR ESTADO DE VERIFICACIÓN
// ========================================

export async function toggleUserStatusService(id, isVerified) {
  const userId = Number(id);

  // Verificar que el usuario existe
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  // Cambiar estado
  const updatedUser = await toggleUserVerification(userId, isVerified);
  return updatedUser;
}