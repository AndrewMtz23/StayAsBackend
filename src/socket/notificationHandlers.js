// src/socket/notificationHandlers.js
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";
import { userRoom } from "../services/socket.service.js";

/**
 * Manejo de notificaciones en tiempo real
 */
export default function registerNotificationHandlers(io, socket) {
  const user = socket.user;

  // Un room por usuario para recibir notificaciones directas
  socket.join(userRoom(user.id));

  // Suscribirse explícitamente (por si el front quiere controlar)
  socket.on("notifications:subscribe", (data, callback) => {
    socket.join(userRoom(user.id));
    callback?.({ ok: true });
  });

  // Marcar una notificación como leída
  socket.on("notifications:read", async (data, callback) => {
    try {
      const notificationId = Number(data.notificationId);
      const updated = await markNotificationAsRead(user.id, notificationId);

      // Avisar al cliente que se actualizó
      callback?.({ ok: true, notification: updated });
    } catch (err) {
      console.error("notifications:read error:", err);
      callback?.({
        ok: false,
        error: err.message || "Error al marcar notificación como leída",
      });
    }
  });

  // Marcar todas como leídas
  socket.on("notifications:read-all", async (data, callback) => {
    try {
      await markAllNotificationsAsRead(user.id);
      callback?.({ ok: true });
    } catch (err) {
      console.error("notifications:read-all error:", err);
      callback?.({
        ok: false,
        error: "Error al marcar todas las notificaciones como leídas",
      });
    }
  });
}
