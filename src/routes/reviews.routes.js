// ============================================
// REVIEWS ROUTES - COMPLETO CON REVIEW RESPONSES
// ============================================
// Define todas las rutas para:
// 1. Reseñas de clientes (crear, actualizar, eliminar, listar)
// 2. Respuestas de hosts (crear, actualizar, eliminar, obtener)
//
// ESTRUCTURA DE RUTAS:
//
// RESEÑAS (CLIENTES):
// POST   /activities/:activityId/reviews        - Crear reseña de actividad
// POST   /properties/:propertyId/reviews        - Crear reseña de propiedad
// GET    /activities/:activityId/reviews        - Obtener reseñas de actividad (público)
// GET    /properties/:propertyId/reviews        - Obtener reseñas de propiedad (público)
// PUT    /reviews/:reviewId                     - Actualizar reseña propia
// DELETE /reviews/:reviewId                     - Eliminar reseña propia
//
// RESPUESTAS (HOSTS):
// GET    /reviews/:reviewId/response            - Obtener respuesta (público)
// GET    /reviews/:reviewId/can-respond         - Verificar si puede responder
// POST   /reviews/:reviewId/response            - Crear respuesta
// PUT    /reviews/responses/:responseId         - Actualizar respuesta
// DELETE /reviews/responses/:responseId         - Eliminar respuesta
// GET    /reviews/responses/my-responses        - Obtener mis respuestas
// ============================================

import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createActivityReviewController,
  createPropertyReviewController,
  getActivityReviewsController,
  getPropertyReviewsController,
  updateReviewController,
  deleteReviewController,
  createResponseController,
  updateResponseController,
  deleteResponseController,
  getResponseController,
  checkCanRespondController,
  getMyResponsesController,
} from "../controllers/reviews.controller.js";

const router = Router();

// ============================================
// RUTAS DE RESEÑAS (CLIENTES)
// ============================================

// Crear reseña de actividad (requiere login)
router.post(
  "/activities/:activityId/reviews",
  verifyToken,
  createActivityReviewController
);

// Crear reseña de propiedad (requiere login)
router.post(
  "/properties/:propertyId/reviews",
  verifyToken,
  createPropertyReviewController
);

// Obtener reseñas públicas de actividad (no requiere login)
router.get("/activities/:activityId/reviews", getActivityReviewsController);

// Obtener reseñas públicas de propiedad (no requiere login)
router.get("/properties/:propertyId/reviews", getPropertyReviewsController);

// Editar reseña propia (requiere login)
router.put("/reviews/:reviewId", verifyToken, updateReviewController);

// Eliminar reseña propia (requiere login)
router.delete("/reviews/:reviewId", verifyToken, deleteReviewController);

// ============================================
// RUTAS DE RESPUESTAS A RESEÑAS (HOSTS)
// ============================================

// Obtener respuesta de una reseña (público - no requiere login)
router.get("/reviews/:reviewId/response", getResponseController);

// Verificar si el usuario puede responder a una reseña (requiere login)
// Útil para el frontend: muestra/oculta el botón de responder
router.get(
  "/reviews/:reviewId/can-respond",
  verifyToken,
  checkCanRespondController
);

// Crear una respuesta a una reseña (requiere login - solo hosts/dueños)
router.post("/reviews/:reviewId/response", verifyToken, createResponseController);

// Actualizar una respuesta existente (requiere login - solo quien la creó)
router.put(
  "/reviews/responses/:responseId",
  verifyToken,
  updateResponseController
);

// Eliminar una respuesta (requiere login - solo quien la creó)
router.delete(
  "/reviews/responses/:responseId",
  verifyToken,
  deleteResponseController
);

// Obtener todas las respuestas del usuario autenticado (requiere login)
// Útil para que los hosts vean un historial de sus respuestas
router.get(
  "/reviews/responses/my-responses",
  verifyToken,
  getMyResponsesController
);

export default router;