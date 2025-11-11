import jwt from "jsonwebtoken";

// Verificar que JWT_SECRET esté configurado
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado en las variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar si el usuario tiene un token válido
 */
export function verifyToken(req, res, next) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(403).json({ error: "No se proporcionó token" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // guardamos la info del usuario (id, role, etc.)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * Middleware para validar roles
 * @param {Array<string>} roles - lista de roles permitidos
 */
export function checkRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permiso para acceder" });
    }

    next();
  };
}