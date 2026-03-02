// src/routes/notifications.routes.js
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getMyNotificationsController,
  createTestNotificationController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
} from "../controllers/notifications.controller.js";

const router = Router();

// Todas requieren estar logueado
router.use(verifyToken);

// Listar notificaciones del usuario
router.get("/", getMyNotificationsController);

// Crear notificación de prueba (en producción la puedes quitar o proteger por rol)
router.post("/test", createTestNotificationController);

// Marcar una como leída
router.patch("/:id/read", markNotificationAsReadController);

// Marcar todas como leídas
router.patch("/read-all", markAllNotificationsAsReadController);

// Eliminar una notificación
router.delete("/:id", deleteNotificationController);

export default router;
