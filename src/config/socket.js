// src/config/socket.js
import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";
import registerSocketHandlers from "../socket/index.js";
import { setIO } from "../services/socket.service.js";

/**
 * Inicializa Socket.io sobre el servidor HTTP.
 */
export function initSocket(server) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [process.env.FRONTEND_URL || "http://localhost:3000"];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Guardar instancia global para usarla en servicios
  setIO(io);

  // Autenticación por JWT en handshake
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      `🔌 Socket conectado: ${socket.id} (userId=${socket.user?.id}, role=${socket.user?.role})`
    );

    registerSocketHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.id} (${reason})`);
    });
  });

  return io;
}
