import { findAllUsers, findUserById } from "../models/user.model.js";
import { 
  createUserService, 
  updateUserService, 
  deleteUserService, 
  toggleUserStatusService 
} from "../services/user.service.js";
import { 
  logUserCreated, 
  logUserUpdated, 
  logUserDeleted, 
  logUserVerificationChanged 
} from "../services/log.service.js";

/**
 * Obtener todos los usuarios (solo ADMIN)
 */
export async function getAllUsers(req, res) {
  try {
    const users = await findAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener la lista de usuarios." });
  }
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    // Si no es admin, solo puede ver su propio perfil
    if (req.user.role !== "ADMIN" && req.user.id !== Number(id)) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil." });
    }

    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    res.status(500).json({ error: "Error al obtener el usuario." });
  }
}

/**
 * Crear un nuevo usuario (solo ADMIN)
 */
export async function createUser(req, res) {
  try {
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);
    
    const { name, email, password, role } = req.body;
    const profileImage = req.file;

    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: name, email, password" 
      });
    }

    const user = await createUserService({ 
      name, 
      email, 
      password, 
      role,
      profileImage
    });

    // Registrar en logs
    await logUserCreated(req, user);
    
    res.status(201).json({
      message: "Usuario creado correctamente",
      user,
    });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Actualizar un usuario existente (solo ADMIN)
 */
export async function updateUser(req, res) {
  try {
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);
    
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const profileImage = req.file;

    // Validar que al menos venga un campo para actualizar
    if (!name && !email && !password && !role && !profileImage) {
      return res.status(400).json({ 
        error: "Debes proporcionar al menos un campo para actualizar" 
      });
    }

    const updatedUser = await updateUserService(id, { 
      name, 
      email, 
      password, 
      role,
      profileImage
    });

    // Registrar en logs
    await logUserUpdated(req, parseInt(id), updatedUser.name);
    
    res.status(200).json({
      message: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Eliminar un usuario (solo ADMIN)
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Evitar que el admin se elimine a sí mismo
    if (req.user.id === Number(id)) {
      return res.status(400).json({ 
        error: "No puedes eliminar tu propia cuenta" 
      });
    }

    // Obtener usuario antes de eliminar para el log
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const result = await deleteUserService(id);

    // Registrar en logs
    await logUserDeleted(req, parseInt(id), user.name);
    
    res.status(200).json(result);
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Cambiar estado de verificación de un usuario (solo ADMIN)
 */
export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    // Validar que venga el campo isVerified
    if (typeof isVerified !== "boolean") {
      return res.status(400).json({ 
        error: "El campo isVerified debe ser true o false" 
      });
    }

    const updatedUser = await toggleUserStatusService(id, isVerified);

    // Registrar en logs
    await logUserVerificationChanged(req, parseInt(id), updatedUser.name, isVerified);
    
    res.status(200).json({
      message: "Estado de verificación actualizado",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    res.status(400).json({ error: err.message });
  }
}