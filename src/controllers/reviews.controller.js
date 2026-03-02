// ============================================
// REVIEWS CONTROLLER - COMPLETO CON REVIEW RESPONSES
// ============================================
// Este controlador maneja:
// 1. Crear/actualizar/eliminar reseñas de clientes
// 2. Crear/actualizar/eliminar RESPUESTAS de hosts
// 3. Obtener reseñas y respuestas
//
// ENDPOINTS DISPONIBLES:
// - POST /activities/:activityId/reviews - Crear reseña de actividad
// - POST /properties/:propertyId/reviews - Crear reseña de propiedad
// - GET /activities/:activityId/reviews - Obtener reseñas de actividad
// - GET /properties/:propertyId/reviews - Obtener reseñas de propiedad
// - PUT /reviews/:reviewId - Actualizar reseña
// - DELETE /reviews/:reviewId - Eliminar reseña
// - POST /reviews/:reviewId/response - Crear respuesta (HOST)
// - PUT /reviews/responses/:responseId - Actualizar respuesta
// - DELETE /reviews/responses/:responseId - Eliminar respuesta
// - GET /reviews/:reviewId/response - Obtener respuesta
// - GET /reviews/:reviewId/can-respond - Verificar si puede responder
// - GET /reviews/responses/my-responses - Obtener mis respuestas
// ============================================

import {
  createActivityReview,
  createPropertyReview,
  getActivityReviews,
  getPropertyReviews,
  updateReview,
  deleteReview,
  createReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
  getReviewResponse,
  canUserRespondToReview,
  getUserResponses,
} from "../services/review.service.js";

// ============================================
// CONTROLADORES DE RESEÑAS (CLIENTES)
// ============================================

/**
 * POST /activities/:activityId/reviews
 * Crear reseña de actividad
 */
export async function createActivityReviewController(req, res, next) {
  try {
    const userId = req.user.id; // viene del token (auth.middleware)
    const { activityId } = req.params;

    const review = await createActivityReview(
      userId,
      Number(activityId),
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Reseña creada correctamente",
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /properties/:propertyId/reviews
 * Crear reseña de propiedad
 */
export async function createPropertyReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const review = await createPropertyReview(
      userId,
      Number(propertyId),
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Reseña creada correctamente",
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /activities/:activityId/reviews
 * Obtener reseñas públicas de una actividad
 */
export async function getActivityReviewsController(req, res, next) {
  try {
    const { activityId } = req.params;
    const reviews = await getActivityReviews(Number(activityId));

    res.json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /properties/:propertyId/reviews
 * Obtener reseñas públicas de una propiedad
 */
export async function getPropertyReviewsController(req, res, next) {
  try {
    const { propertyId } = req.params;
    const reviews = await getPropertyReviews(Number(propertyId));

    res.json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /reviews/:reviewId
 * Actualizar reseña propia
 */
export async function updateReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const updated = await updateReview(userId, Number(reviewId), req.body);

    res.json({
      success: true,
      message: "Reseña actualizada correctamente",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /reviews/:reviewId
 * Eliminar reseña propia
 */
export async function deleteReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const deleted = await deleteReview(userId, Number(reviewId));

    res.json({
      success: true,
      message: "Reseña eliminada correctamente",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// CONTROLADORES DE RESPUESTAS (HOSTS)
// ============================================

/**
 * POST /reviews/:reviewId/response
 * Crear respuesta a una reseña (solo hosts/dueños)
 */
export async function createResponseController(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "El texto de la respuesta es requerido",
      });
    }

    const response = await createReviewResponse(userId, reviewId, text);

    res.status(201).json({
      success: true,
      message: "Respuesta creada exitosamente",
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /reviews/responses/:responseId
 * Actualizar respuesta (solo quien la creó)
 */
export async function updateResponseController(req, res, next) {
  try {
    const { responseId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "El texto de la respuesta es requerido",
      });
    }

    const response = await updateReviewResponse(userId, responseId, text);

    res.json({
      success: true,
      message: "Respuesta actualizada exitosamente",
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /reviews/responses/:responseId
 * Eliminar respuesta (solo quien la creó)
 */
export async function deleteResponseController(req, res, next) {
  try {
    const { responseId } = req.params;
    const userId = req.user.id;

    const result = await deleteReviewResponse(userId, responseId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reviews/:reviewId/response
 * Obtener respuesta de una reseña (público)
 */
export async function getResponseController(req, res, next) {
  try {
    const { reviewId } = req.params;

    const response = await getReviewResponse(reviewId);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Esta reseña no tiene respuesta",
      });
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reviews/:reviewId/can-respond
 * Verificar si el usuario puede responder a una reseña
 * Útil para mostrar/ocultar el botón de responder en el frontend
 */
export async function checkCanRespondController(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const result = await canUserRespondToReview(userId, reviewId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reviews/responses/my-responses
 * Obtener todas las respuestas del usuario autenticado (HOST)
 * Con paginación
 */
export async function getMyResponsesController(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getUserResponses(userId, page, limit);

    res.json({
      success: true,
      data: result.responses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}