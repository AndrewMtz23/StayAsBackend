// ============================================
// REVIEW SERVICE - COMPLETO CON REVIEW RESPONSES
// ============================================
// Este servicio gestiona:
// 1. Crear/actualizar/eliminar reseñas de clientes
// 2. Crear/actualizar/eliminar RESPUESTAS de hosts a reseñas
// 3. Recalcular ratings automáticamente
//
// CASOS DE USO:
// - Clientes dejan reseñas de actividades/propiedades
// - Hosts responden a las reseñas recibidas
// - Se mantiene el rating actualizado en tiempo real
// ============================================

import { prisma } from "../config/db.js";

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica si el usuario tiene una reservación confirmada/completada
 * para una actividad específica.
 */
async function userHasActivityReservation(userId, activityId) {
  const reservation = await prisma.reservationActivity.findFirst({
    where: {
      userId,
      activityId,
      status: { in: ["confirmed", "completed"] },
    },
  });
  return !!reservation;
}

/**
 * Verifica si el usuario tiene una reservación confirmada/completada
 * para una propiedad específica.
 */
async function userHasPropertyReservation(userId, propertyId) {
  const reservation = await prisma.reservationProperty.findFirst({
    where: {
      userId,
      propertyId,
      status: { in: ["confirmed", "completed"] },
    },
  });
  return !!reservation;
}

/**
 * Recalcula el rating agregado (averageRating, totalReviews, ratingBreakdown)
 * para una Activity o Property.
 */
async function recalculateRatingsForItem(itemType, itemId) {
  const where =
    itemType === "ACTIVITY"
      ? { activityId: itemId, isHidden: false }
      : { propertyId: itemId, isHidden: false };

  const reviews = await prisma.review.findMany({
    where,
    select: { rating: true },
  });

  if (reviews.length === 0) {
    // Si ya no hay reseñas, reseteamos
    if (itemType === "ACTIVITY") {
      await prisma.activity.update({
        where: { id: itemId },
        data: { averageRating: null, totalReviews: 0 },
      });
    } else {
      await prisma.property.update({
        where: { id: itemId },
        data: { averageRating: null, totalReviews: 0 },
      });
    }
    return;
  }

  const totalReviews = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / totalReviews;

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (breakdown[r.rating] != null) breakdown[r.rating]++;
  }

  const data = {
    averageRating: Number(average.toFixed(2)),
    totalReviews,
    ratingBreakdown: breakdown,
  };

  if (itemType === "ACTIVITY") {
    await prisma.activity.update({
      where: { id: itemId },
      data,
    });
  } else {
    await prisma.property.update({
      where: { id: itemId },
      data,
    });
  }
}

// ============================================
// GESTIÓN DE RESEÑAS (CLIENTES)
// ============================================

/**
 * Crea reseña para una Activity
 */
export async function createActivityReview(userId, activityId, payload) {
  // Validar rating 1-5
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    const error = new Error("El rating debe estar entre 1 y 5.");
    error.statusCode = 400;
    throw error;
  }

  const hasReservation = await userHasActivityReservation(userId, activityId);
  if (!hasReservation) {
    const error = new Error(
      "Solo puedes reseñar actividades que hayas reservado y completado."
    );
    error.statusCode = 400;
    throw error;
  }

  const review = await prisma.review.create({
    data: {
      userId,
      itemType: "ACTIVITY",
      activityId,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      pros: payload.pros,
      cons: payload.cons,
      images: payload.images || [],
      isVerified: true,
    },
  });

  await recalculateRatingsForItem("ACTIVITY", activityId);

  return review;
}

/**
 * Crea reseña para una Property
 */
export async function createPropertyReview(userId, propertyId, payload) {
  // Validar rating 1-5
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    const error = new Error("El rating debe estar entre 1 y 5.");
    error.statusCode = 400;
    throw error;
  }

  const hasReservation = await userHasPropertyReservation(userId, propertyId);
  if (!hasReservation) {
    const error = new Error(
      "Solo puedes reseñar propiedades que hayas reservado y completado."
    );
    error.statusCode = 400;
    throw error;
  }

  const review = await prisma.review.create({
    data: {
      userId,
      itemType: "PROPERTY",
      propertyId,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      pros: payload.pros,
      cons: payload.cons,
      images: payload.images || [],
      isVerified: true,
    },
  });

  await recalculateRatingsForItem("PROPERTY", propertyId);

  return review;
}

/**
 * Obtiene reseñas públicas de una Activity
 */
export async function getActivityReviews(activityId) {
  return prisma.review.findMany({
    where: {
      activityId,
      isHidden: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      response: true,
    },
  });
}

/**
 * Obtiene reseñas públicas de una Property
 */
export async function getPropertyReviews(propertyId) {
  return prisma.review.findMany({
    where: {
      propertyId,
      isHidden: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      response: true,
    },
  });
}

/**
 * Actualiza reseña propia
 */
export async function updateReview(userId, reviewId, payload) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    const error = new Error("Reseña no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (review.userId !== userId) {
    const error = new Error("No puedes editar una reseña de otro usuario.");
    error.statusCode = 403;
    throw error;
  }

  const dataToUpdate = {};

  if (payload.rating !== undefined) {
    if (payload.rating < 1 || payload.rating > 5) {
      const error = new Error("El rating debe estar entre 1 y 5.");
      error.statusCode = 400;
      throw error;
    }
    dataToUpdate.rating = payload.rating;
  }

  if (payload.title !== undefined) dataToUpdate.title = payload.title;
  if (payload.comment !== undefined) dataToUpdate.comment = payload.comment;
  if (payload.pros !== undefined) dataToUpdate.pros = payload.pros;
  if (payload.cons !== undefined) dataToUpdate.cons = payload.cons;
  if (payload.images !== undefined) dataToUpdate.images = payload.images;

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: dataToUpdate,
  });

  if (review.activityId) {
    await recalculateRatingsForItem("ACTIVITY", review.activityId);
  } else if (review.propertyId) {
    await recalculateRatingsForItem("PROPERTY", review.propertyId);
  }

  return updated;
}

/**
 * Elimina reseña propia
 */
export async function deleteReview(userId, reviewId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    const error = new Error("Reseña no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (review.userId !== userId) {
    const error = new Error("No puedes eliminar una reseña de otro usuario.");
    error.statusCode = 403;
    throw error;
  }

  const deleted = await prisma.review.delete({
    where: { id: reviewId },
  });

  if (review.activityId) {
    await recalculateRatingsForItem("ACTIVITY", review.activityId);
  } else if (review.propertyId) {
    await recalculateRatingsForItem("PROPERTY", review.propertyId);
  }

  return deleted;
}

// ============================================
// GESTIÓN DE RESPUESTAS A RESEÑAS (HOSTS)
// ============================================

/**
 * CREAR RESPUESTA A UNA RESEÑA
 * Solo el dueño de la propiedad/actividad puede responder
 */
export async function createReviewResponse(userId, reviewId, responseText) {
  // Validar que la respuesta no esté vacía
  if (!responseText || responseText.trim().length === 0) {
    const error = new Error("La respuesta no puede estar vacía.");
    error.statusCode = 400;
    throw error;
  }

  if (responseText.length > 1000) {
    const error = new Error("La respuesta no puede exceder 1000 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  // Buscar la reseña
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
    include: {
      activity: {
        select: { userId: true },
      },
      property: {
        select: { userId: true },
      },
      response: true, // Verificar si ya tiene respuesta
    },
  });

  if (!review) {
    const error = new Error("Reseña no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario sea el dueño de la propiedad/actividad
  const isOwner =
    (review.activity && review.activity.userId === userId) ||
    (review.property && review.property.userId === userId);

  if (!isOwner) {
    const error = new Error(
      "Solo el dueño de la propiedad/actividad puede responder a esta reseña."
    );
    error.statusCode = 403;
    throw error;
  }

  // Verificar que no exista ya una respuesta
  if (review.response) {
    const error = new Error(
      "Esta reseña ya tiene una respuesta. Usa la función de actualizar."
    );
    error.statusCode = 400;
    throw error;
  }

  // Crear la respuesta
  const response = await prisma.reviewResponse.create({
    data: {
      reviewId: parseInt(reviewId),
      userId,
      text: responseText.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return response;
}

/**
 * ACTUALIZAR RESPUESTA A RESEÑA
 * Solo quien creó la respuesta puede editarla
 */
export async function updateReviewResponse(userId, responseId, newText) {
  // Validar texto
  if (!newText || newText.trim().length === 0) {
    const error = new Error("La respuesta no puede estar vacía.");
    error.statusCode = 400;
    throw error;
  }

  if (newText.length > 1000) {
    const error = new Error("La respuesta no puede exceder 1000 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  // Buscar la respuesta
  const response = await prisma.reviewResponse.findUnique({
    where: { id: parseInt(responseId) },
  });

  if (!response) {
    const error = new Error("Respuesta no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario sea quien creó la respuesta
  if (response.userId !== userId) {
    const error = new Error("No puedes editar la respuesta de otro usuario.");
    error.statusCode = 403;
    throw error;
  }

  // Actualizar
  const updated = await prisma.reviewResponse.update({
    where: { id: parseInt(responseId) },
    data: {
      text: newText.trim(),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return updated;
}

/**
 * ELIMINAR RESPUESTA A RESEÑA
 * Solo quien creó la respuesta puede eliminarla
 */
export async function deleteReviewResponse(userId, responseId) {
  // Buscar la respuesta
  const response = await prisma.reviewResponse.findUnique({
    where: { id: parseInt(responseId) },
  });

  if (!response) {
    const error = new Error("Respuesta no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario sea quien creó la respuesta
  if (response.userId !== userId) {
    const error = new Error("No puedes eliminar la respuesta de otro usuario.");
    error.statusCode = 403;
    throw error;
  }

  // Eliminar
  await prisma.reviewResponse.delete({
    where: { id: parseInt(responseId) },
  });

  return { message: "Respuesta eliminada exitosamente" };
}

/**
 * OBTENER RESPUESTA DE UNA RESEÑA
 * Público - cualquiera puede ver la respuesta
 */
export async function getReviewResponse(reviewId) {
  const response = await prisma.reviewResponse.findUnique({
    where: { reviewId: parseInt(reviewId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return response;
}

/**
 * VERIFICAR SI EL USUARIO PUEDE RESPONDER UNA RESEÑA
 * Útil para el frontend (mostrar/ocultar botón)
 */
export async function canUserRespondToReview(userId, reviewId) {
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
    include: {
      activity: {
        select: { userId: true },
      },
      property: {
        select: { userId: true },
      },
      response: true,
    },
  });

  if (!review) {
    return { canRespond: false, reason: "Reseña no encontrada" };
  }

  if (review.response) {
    return { canRespond: false, reason: "La reseña ya tiene una respuesta" };
  }

  const isOwner =
    (review.activity && review.activity.userId === userId) ||
    (review.property && review.property.userId === userId);

  if (!isOwner) {
    return {
      canRespond: false,
      reason: "No eres el dueño de esta propiedad/actividad",
    };
  }

  return { canRespond: true };
}

/**
 * OBTENER TODAS LAS RESPUESTAS DEL USUARIO (HOST)
 * Lista de respuestas que el host ha dado a reseñas
 */
export async function getUserResponses(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [responses, total] = await Promise.all([
    prisma.reviewResponse.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            activity: {
              select: {
                id: true,
                title: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.reviewResponse.count({ where: { userId } }),
  ]);

  return {
    responses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}