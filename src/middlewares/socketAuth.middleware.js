// src/middlewares/socketAuth.middleware.js
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado en las variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Autenticación de sockets usando el mismo JWT que en HTTP.
 * Espera el token en:
 * - socket.handshake.auth.token
 * - o en header "authorization: Bearer ..."
 * - o en query ?token=...
 */
export function socketAuth(socket, next) {
  try {
    const authToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!authToken) {
      return next(new Error("AUTH_REQUIRED"));
    }

    const token = authToken.startsWith("Bearer ")
      ? authToken.split(" ")[1]
      : authToken;

    const decoded = jwt.verify(token, JWT_SECRET);

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("Error en socketAuth:", err.message);
    next(new Error("INVALID_TOKEN"));
  }
}
