// src/routes/conversations.routes.js
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getMyConversationsController,
  startConversationController,
  getConversationByIdController,
  getConversationMessagesController,
} from "../controllers/conversations.controller.js";

const router = Router();

// Todas las rutas de conversaciones requieren estar autenticado
router.use(verifyToken);

// Listar conversaciones del usuario
router.get("/", getMyConversationsController);

// Iniciar conversación (por ejemplo, desde detalle de propiedad/actividad)
router.post("/", startConversationController);

// Obtener detalles de una conversación
router.get("/:id", getConversationByIdController);

// Obtener mensajes de una conversación
router.get("/:id/messages", getConversationMessagesController);

export default router;
