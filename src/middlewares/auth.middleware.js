// RUTA: backend/middlewares/auth.middleware.js
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
  // 🐛 DEBUG: Ver headers
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 verifyToken - Verificando autenticación");
  console.log("📍 URL:", req.method, req.originalUrl);
  
  const header = req.headers["authorization"];
  console.log("🔑 Authorization Header:", header ? "PRESENTE" : "AUSENTE");

  if (!header) {
    console.log("❌ No se proporcionó header de autorización");
    return res.status(403).json({ error: "No se proporcionó token" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    console.log("❌ Token inválido en el header");
    return res.status(403).json({ error: "Token inválido" });
  }

  console.log("🎫 Token extraído:", token.substring(0, 20) + "...");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log("✅ Token decodificado exitosamente:");
    console.log("   - ID:", decoded.id);
    console.log("   - Email:", decoded.email);
    console.log("   - Role:", decoded.role);
    
    req.user = decoded; // guardamos la info del usuario (id, role, etc.)
    console.log("✅ req.user asignado:", req.user);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    next();
  } catch (err) {
    console.log("❌ Error al verificar token:", err.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * Middleware para validar roles
 * @param {Array<string>} roles - lista de roles permitidos
 */
export function checkRole(roles = []) {
  return (req, res, next) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔒 checkRole - Verificando permisos");
    console.log("🎭 Roles permitidos:", roles);
    console.log("👤 req.user:", req.user);
    
    if (!req.user) {
      console.log("❌ Usuario no autenticado");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    console.log("🎫 Role del usuario:", req.user.role);
    
    if (!roles.includes(req.user.role)) {
      console.log("❌ No tiene permiso - Role:", req.user.role);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return res.status(403).json({ error: "No tienes permiso para acceder" });
    }

    console.log("✅ Permiso concedido");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    next();
  };
}