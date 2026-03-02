import { createLog } from "../models/log.model.js";
import { prisma } from "../config/db.js";

/**
 * Registrar una acción en el sistema
 */
export async function logAction({
  userId,
  action,
  entity,
  entityId,
  description,
  req
}) {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress;
    const userAgent = req?.headers['user-agent'];

    await createLog({
      userId,
      action,
      entity,
      entityId,
      description,
      ipAddress,
      userAgent,
    });

    console.log(`📝 LOG: ${action} - ${description}`);
  } catch (error) {
    console.error("❌ Error al registrar log:", error);
  }
}

// ========================================
// FUNCIONES ESPECÍFICAS POR ENTIDAD
// ========================================

// USUARIOS
export async function logUserCreated(req, user) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    description: `Usuario "${user.name}" creado con rol ${user.role}`,
    req
  });
}

export async function logUserUpdated(req, userId, userName) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_USER",
    entity: "User",
    entityId: userId,
    description: `Usuario #${userId} "${userName}" actualizado`,
    req
  });
}

export async function logUserDeleted(req, userId, userName) {
  await logAction({
    userId: req.user?.id,
    action: "DELETE_USER",
    entity: "User",
    entityId: userId,
    description: `Usuario #${userId} "${userName}" eliminado`,
    req
  });
}

export async function logUserVerificationChanged(req, userId, userName, isVerified) {
  await logAction({
    userId: req.user?.id,
    action: "TOGGLE_USER_VERIFICATION",
    entity: "User",
    entityId: userId,
    description: `Usuario #${userId} "${userName}" ${isVerified ? 'verificado' : 'desverificado'}`,
    req
  });
}

// AUTENTICACIÓN
export async function logLogin(req, user) {
  await logAction({
    userId: user.id,
    action: "LOGIN",
    entity: "Auth",
    entityId: user.id,
    description: `Usuario "${user.name}" inició sesión`,
    req
  });
}

export async function logLogout(req, userId, userName) {
  await logAction({
    userId: userId,
    action: "LOGOUT",
    entity: "Auth",
    entityId: userId,
    description: `Usuario "${userName}" cerró sesión`,
    req
  });
}

export async function logFailedLogin(req, email) {
  await logAction({
    userId: null,
    action: "FAILED_LOGIN",
    entity: "Auth",
    entityId: null,
    description: `Intento de inicio de sesión fallido con email: ${email}`,
    req
  });
}

export async function logRegister(req, user) {
  await logAction({
    userId: user.id,
    action: "REGISTER",
    entity: "Auth",
    entityId: user.id,
    description: `Nuevo usuario registrado: "${user.name}" (${user.email})`,
    req
  });
}

export async function logVerifyEmail(req, userId, email) {
  await logAction({
    userId: userId,
    action: "VERIFY_EMAIL",
    entity: "Auth",
    entityId: userId,
    description: `Email verificado: ${email}`,
    req
  });
}

export async function logResendVerificationCode(req, email) {
  await logAction({
    userId: null,
    action: "RESEND_VERIFICATION_CODE",
    entity: "Auth",
    entityId: null,
    description: `Código de verificación reenviado a: ${email}`,
    req
  });
}

export async function logRequestPasswordReset(req, email) {
  await logAction({
    userId: null,
    action: "REQUEST_PASSWORD_RESET",
    entity: "Auth",
    entityId: null,
    description: `Solicitud de recuperación de contraseña para: ${email}`,
    req
  });
}

export async function logPasswordReset(req, userId) {
  await logAction({
    userId: userId,
    action: "PASSWORD_RESET",
    entity: "Auth",
    entityId: userId,
    description: `Contraseña restablecida exitosamente`,
    req
  });
}

// ACTIVIDADES
export async function logActivityCreated(req, activity) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_ACTIVITY",
    entity: "Activity",
    entityId: activity.id,
    description: `Actividad "${activity.title}" creada`,
    req
  });
}

export async function logActivityUpdated(req, activityId, activityTitle) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_ACTIVITY",
    entity: "Activity",
    entityId: activityId,
    description: `Actividad #${activityId} "${activityTitle}" actualizada`,
    req
  });
}

export async function logActivityDeleted(req, activityId, activityTitle) {
  await logAction({
    userId: req.user?.id,
    action: "DELETE_ACTIVITY",
    entity: "Activity",
    entityId: activityId,
    description: `Actividad #${activityId} "${activityTitle}" eliminada`,
    req
  });
}

// RESERVACIONES
export async function logReservationCreated(req, reservation, type) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_RESERVATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservation.id,
    description: `Reservación #${reservation.id} creada`,
    req
  });
}

export async function logReservationStatusChanged(req, reservationId, newStatus, type) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_RESERVATION_STATUS",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} cambió a estado: ${newStatus}`,
    req
  });
}

export async function logReservationCancelled(req, reservationId, type) {
  await logAction({
    userId: req.user?.id,
    action: "CANCEL_RESERVATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} cancelada`,
    req
  });
}

// PAGOS
export async function logPaymentCompleted(req, payment, type) {
  await logAction({
    userId: req.user?.id,
    action: "PAYMENT_COMPLETED",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: payment.id,
    description: `Pago #${payment.id} completado por $${payment.amount}`,
    req
  });
}

// RESEÑAS
export async function logReviewCreated(req, review, type) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_REVIEW",
    entity: type === 'activity' ? 'ReviewActivity' : 'ReviewProperty',
    entityId: review.id,
    description: `Reseña #${review.id} creada con ${review.rating} estrellas`,
    req
  });
}

// CATEGORÍAS
export async function logCategoryCreated(req, category) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_CATEGORY",
    entity: "ActivityCategory",
    entityId: category.id,
    description: `Categoría "${category.name}" creada`,
    req
  });
}

export async function logCategoryUpdated(req, categoryId, categoryName) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_CATEGORY",
    entity: "ActivityCategory",
    entityId: categoryId,
    description: `Categoría #${categoryId} "${categoryName}" actualizada`,
    req
  });
}

export async function logCategoryDeleted(req, categoryId, categoryName) {
  await logAction({
    userId: req.user?.id,
    action: "DELETE_CATEGORY",
    entity: "ActivityCategory",
    entityId: categoryId,
    description: `Categoría #${categoryId} "${categoryName}" eliminada`,
    req
  });
}

/**
 * Log de creación de propiedad
 */
export async function logPropertyCreated(req, property) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_PROPERTY",
    entity: "Property",
    entityId: property.id,
    description: `Propiedad "${property.title}" creada`,
    req
  });
}

/**
 * Log de actualización de propiedad
 */
export async function logPropertyUpdated(req, propertyId, title) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    description: `Propiedad #${propertyId} "${title}" actualizada`,
    req
  });
}

/**
 * Log de eliminación de propiedad
 */
export async function logPropertyDeleted(req, propertyId, title) {
  await logAction({
    userId: req.user?.id,
    action: "DELETE_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    description: `Propiedad #${propertyId} "${title}" eliminada`,
    req
  });
}

// EVENTOS DEL CALENDARIO
export async function logCalendarEventCreated(req, event) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_CALENDAR_EVENT",
    entity: "CalendarEvent",
    entityId: event.id,
    description: `Evento "${event.title}" creado`,
    req
  });
}

export async function logCalendarEventUpdated(req, eventId, eventTitle) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_CALENDAR_EVENT",
    entity: "CalendarEvent",
    entityId: eventId,
    description: `Evento #${eventId} "${eventTitle}" actualizado`,
    req
  });
}

export async function logCalendarEventDeleted(req, eventId, eventTitle) {
  await logAction({
    userId: req.user?.id,
    action: "DELETE_CALENDAR_EVENT",
    entity: "CalendarEvent",
    entityId: eventId,
    description: `Evento #${eventId} "${eventTitle}" eliminado`,
    req
  });
}

// ========================================
// HOST REQUESTS - LOGS
// ========================================

/**
 * Registrar creación de solicitud de Host
 */
export async function logHostRequestCreated(req, requestId, userName) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "CREATE",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Solicitud de Host creada por: ${userName}`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Solicitud de Host creada por ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log de solicitud:", error);
  }
}

/**
 * Registrar aprobación de solicitud
 */
export async function logHostRequestApproved(req, requestId, userName) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "APPROVE",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Solicitud de Host APROBADA para: ${userName}. Usuario ahora es HOST`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Solicitud de Host aprobada para ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log de aprobación:", error);
  }
}

/**
 * Registrar rechazo de solicitud
 */
export async function logHostRequestRejected(req, requestId, userName, reason) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "REJECT",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Solicitud de Host RECHAZADA para: ${userName}. Razón: ${reason}`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Solicitud de Host rechazada para ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log de rechazo:", error);
  }
}

/**
 * Registrar eliminación de solicitud
 */
export async function logHostRequestDeleted(req, requestId, userName) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "DELETE",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Solicitud de Host eliminada de: ${userName}`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Solicitud de Host eliminada de ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log de eliminación:", error);
  }
}

/**
 * Registrar envío de formulario
 */
export async function logHostRequestFormSent(req, requestId, userName) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "UPDATE",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Formulario de aplicación enviado a: ${userName}`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Formulario enviado a ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log:", error);
  }
}

/**
 * Registrar formulario completado
 */
export async function logHostRequestFormCompleted(req, requestId, userName) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || null,
        action: "UPDATE",
        entity: "HOST_REQUEST",
        entityId: requestId,
        description: `Formulario de aplicación completado por: ${userName}`,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
    console.log(`📝 LOG: Formulario completado por ${userName}`);
  } catch (error) {
    console.error("❌ Error al crear log:", error);
  }
}
// ========================================
// PAYMENT LOGS - DASHBOARD
// ========================================

/**
 * Log cuando se crea un pago
 */
export async function logPaymentCreated(req, payment, type, reservationInfo) {
  await logAction({
    userId: req.user?.id,
    action: "CREATE_PAYMENT",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: payment.id,
    description: `Pago creado: Folio ${payment.folio}, Monto $${payment.amount} MXN, Método: ${payment.method}, Reservación #${reservationInfo?.id || 'N/A'}`,
    req
  });
}

/**
 * Log cuando se cambia el estado de un pago
 */
export async function logPaymentStatusChanged(req, paymentId, oldStatus, newStatus, type) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_PAYMENT_STATUS",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: paymentId,
    description: `Pago #${paymentId} cambió de estado: ${oldStatus} → ${newStatus}`,
    req
  });
}

/**
 * Log cuando se visualiza un pago
 */
export async function logPaymentViewed(req, paymentId, type, folio) {
  await logAction({
    userId: req.user?.id,
    action: "VIEW_PAYMENT",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: paymentId,
    description: `Pago #${paymentId} (Folio: ${folio}) consultado`,
    req
  });
}

/**
 * Log cuando se descarga un PDF de pago
 */
export async function logPaymentPDFDownloaded(req, paymentId, type, folio) {
  await logAction({
    userId: req.user?.id,
    action: "DOWNLOAD_PAYMENT_PDF",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: paymentId,
    description: `PDF descargado: Folio ${folio}, Pago #${paymentId}`,
    req
  });
}

/**
 * Log cuando se reembolsa un pago
 */
export async function logPaymentRefunded(req, paymentId, amount, type, reason) {
  await logAction({
    userId: req.user?.id,
    action: "REFUND_PAYMENT",
    entity: type === 'activity' ? 'PaymentActivity' : 'PaymentProperty',
    entityId: paymentId,
    description: `Pago #${paymentId} reembolsado: $${amount} MXN. Razón: ${reason || 'No especificada'}`,
    req
  });
}

/**
 * Log cuando se accede a las estadísticas de pagos
 */
export async function logPaymentStatsAccessed(req) {
  await logAction({
    userId: req.user?.id,
    action: "VIEW_PAYMENT_STATS",
    entity: "PaymentStats",
    entityId: null,
    description: `Estadísticas de pagos consultadas`,
    req
  });
}

/**
 * Log cuando se accede al dashboard de pagos
 */
export async function logPaymentDashboardAccessed(req, filters) {
  const filterDesc = filters ? ` con filtros: ${JSON.stringify(filters)}` : '';
  await logAction({
    userId: req.user?.id,
    action: "VIEW_PAYMENT_DASHBOARD",
    entity: "PaymentDashboard",
    entityId: null,
    description: `Dashboard de pagos accedido${filterDesc}`,
    req
  });
}

// ========================================
// RESERVATION LOGS - DASHBOARD
// ========================================

/**
 * Log cuando se accede al dashboard de reservaciones
 */
export async function logReservationDashboardAccessed(req, filters) {
  const filterDesc = filters ? ` con filtros: ${JSON.stringify(filters)}` : '';
  await logAction({
    userId: req.user?.id,
    action: "VIEW_RESERVATION_DASHBOARD",
    entity: "ReservationDashboard",
    entityId: null,
    description: `Dashboard de reservaciones accedido${filterDesc}`,
    req
  });
}

/**
 * Log cuando se consultan estadísticas de reservaciones
 */
export async function logReservationStatsAccessed(req) {
  await logAction({
    userId: req.user?.id,
    action: "VIEW_RESERVATION_STATS",
    entity: "ReservationStats",
    entityId: null,
    description: `Estadísticas de reservaciones consultadas`,
    req
  });
}

/**
 * Log cuando se visualiza una reservación
 */
export async function logReservationViewed(req, reservationId, type) {
  await logAction({
    userId: req.user?.id,
    action: "VIEW_RESERVATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} (${type}) consultada`,
    req
  });
}

/**
 * Log cuando se cambia el estado de una reservación (desde dashboard)
 */
export async function logReservationStatusUpdated(req, reservationId, oldStatus, newStatus, type) {
  await logAction({
    userId: req.user?.id,
    action: "UPDATE_RESERVATION_STATUS",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} cambió de estado: ${oldStatus} → ${newStatus}`,
    req
  });
}

/**
 * Log cuando se confirma una reservación
 */
export async function logReservationConfirmed(req, reservationId, type) {
  await logAction({
    userId: req.user?.id,
    action: "CONFIRM_RESERVATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} confirmada`,
    req
  });
}

/**
 * Log cuando se completa una reservación
 */
export async function logReservationCompleted(req, reservationId, type) {
  await logAction({
    userId: req.user?.id,
    action: "COMPLETE_RESERVATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Reservación #${reservationId} marcada como completada`,
    req
  });
}

/**
 * Log cuando se exportan datos de reservaciones
 */
export async function logReservationsExported(req, count, filters) {
  const filterDesc = filters ? ` con filtros: ${JSON.stringify(filters)}` : '';
  await logAction({
    userId: req.user?.id,
    action: "EXPORT_RESERVATIONS",
    entity: "ReservationDashboard",
    entityId: null,
    description: `Exportadas ${count} reservaciones${filterDesc}`,
    req
  });
}

/**
 * Log cuando se envía notificación a usuario
 */
export async function logReservationNotificationSent(req, reservationId, type, reason) {
  await logAction({
    userId: req.user?.id,
    action: "SEND_RESERVATION_NOTIFICATION",
    entity: type === 'activity' ? 'ReservationActivity' : 'ReservationProperty',
    entityId: reservationId,
    description: `Notificación enviada para reservación #${reservationId}. Razón: ${reason}`,
    req
  });
}