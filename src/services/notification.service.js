// src/services/notification.service.js
import { prisma } from "../config/db.js";
import { emitToUser } from "./socket.service.js";

// ============================================
// FUNCIONES BASE
// ============================================

/**
 * Crear notificación y emitir por socket
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  icon,
  priority = "NORMAL",
  metadata,
  emitSocket = true,
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      icon,
      priority,
      metadata: metadata || undefined,
    },
  });

  if (emitSocket) {
    try {
      emitToUser(userId, "notification:new", notification);
    } catch (err) {
      console.error("Error emitiendo notificación por socket:", err);
    }
  }

  return notification;
}

/**
 * Obtener notificaciones del usuario
 */
export async function getUserNotifications(userId, { onlyUnread, take, skip }) {
  const where = { userId };
  if (onlyUnread) where.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take || 50,
      skip: skip || 0,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, total, unreadCount };
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notificación no encontrada");
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Marcar todas como leídas
 */
export async function markAllNotificationsAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Eliminar notificación
 */
export async function deleteNotification(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notificación no encontrada");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { message: "Notificación eliminada" };
}

// ============================================
// NOTIFICACIONES DE RESERVACIONES
// ============================================

/**
 * Notificar nueva reservación (para el cliente)
 */
export async function notifyReservationCreated(reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "RESERVATION",
    title: "¡Reservación creada! 🎉",
    message: `Tu reservación para "${itemTitle}" ha sido creada exitosamente.`,
    link: `/reservations/${reservation.id}?type=${itemType}`,
    icon: "📅",
    priority: "NORMAL",
    metadata: {
      reservationId: reservation.id,
      itemType,
      status: reservation.status,
    },
  });
}

/**
 * Notificar confirmación de reservación
 */
export async function notifyReservationConfirmed(reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "RESERVATION",
    title: "Reservación confirmada ✅",
    message: `Tu reservación para "${itemTitle}" ha sido confirmada.`,
    link: `/reservations/${reservation.id}?type=${itemType}`,
    icon: "✅",
    priority: "HIGH",
    metadata: {
      reservationId: reservation.id,
      itemType,
      status: "confirmed",
    },
  });
}

/**
 * Notificar cancelación de reservación
 */
export async function notifyReservationCancelled(reservation, itemType, reason) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "RESERVATION",
    title: "Reservación cancelada ❌",
    message: `Tu reservación para "${itemTitle}" ha sido cancelada. ${reason ? `Motivo: ${reason}` : ""}`,
    link: `/reservations/${reservation.id}?type=${itemType}`,
    icon: "❌",
    priority: "HIGH",
    metadata: {
      reservationId: reservation.id,
      itemType,
      status: "cancelled",
      reason,
    },
  });
}

/**
 * Notificar reservación completada
 */
export async function notifyReservationCompleted(reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "RESERVATION",
    title: "¡Gracias por tu visita! 🌟",
    message: `Tu reservación para "${itemTitle}" ha finalizado. ¿Nos dejas una reseña?`,
    link: `/reviews/create?type=${itemType}&id=${reservation.id}`,
    icon: "⭐",
    priority: "NORMAL",
    metadata: {
      reservationId: reservation.id,
      itemType,
      status: "completed",
    },
  });
}

/**
 * Notificar nueva reservación al HOST
 */
export async function notifyHostNewReservation(hostId, reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  const clientName = reservation.user?.name || "Un cliente";

  return await createNotification({
    userId: hostId,
    type: "RESERVATION",
    title: "Nueva reservación recibida 🎊",
    message: `${clientName} reservó "${itemTitle}".`,
    link: `/host/reservations/${reservation.id}?type=${itemType}`,
    icon: "🎊",
    priority: "HIGH",
    metadata: {
      reservationId: reservation.id,
      itemType,
      clientId: reservation.userId,
      status: reservation.status,
    },
  });
}

// ============================================
// NOTIFICACIONES DE PAGOS
// ============================================

/**
 * Notificar pago exitoso
 */
export async function notifyPaymentApproved(payment, reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "PAYMENT",
    title: "Pago aprobado ✅",
    message: `Tu pago de $${payment.amount} MXN para "${itemTitle}" ha sido aprobado.`,
    link: `/payments/${payment.id}?type=${itemType}`,
    icon: "💳",
    priority: "HIGH",
    metadata: {
      paymentId: payment.id,
      reservationId: reservation.id,
      amount: Number(payment.amount),
      folio: payment.folio,
    },
  });
}

/**
 * Notificar pago rechazado
 */
export async function notifyPaymentRejected(payment, reservation, itemType, reason) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "PAYMENT",
    title: "Pago rechazado ❌",
    message: `Tu pago para "${itemTitle}" fue rechazado. ${reason || "Intenta con otro método de pago."}`,
    link: `/reservations/${reservation.id}?type=${itemType}`,
    icon: "⚠️",
    priority: "URGENT",
    metadata: {
      paymentId: payment.id,
      reservationId: reservation.id,
      reason,
    },
  });
}

/**
 * Notificar reembolso procesado
 */
export async function notifyPaymentRefunded(payment, reservation, itemType) {
  const itemTitle = itemType === "activity" 
    ? reservation.activity?.title 
    : reservation.property?.title;

  return await createNotification({
    userId: reservation.userId,
    type: "PAYMENT",
    title: "Reembolso procesado 💰",
    message: `Tu reembolso de $${payment.amount} MXN para "${itemTitle}" ha sido procesado.`,
    link: `/payments/${payment.id}?type=${itemType}`,
    icon: "💰",
    priority: "HIGH",
    metadata: {
      paymentId: payment.id,
      reservationId: reservation.id,
      amount: Number(payment.amount),
    },
  });
}

// ============================================
// NOTIFICACIONES DE SOLICITUDES DE HOST
// ============================================

/**
 * Notificar que la solicitud de host fue enviada
 */
export async function notifyHostRequestSubmitted(userId) {
  return await createNotification({
    userId,
    type: "SYSTEM",
    title: "Solicitud enviada ✅",
    message: "Tu solicitud para ser Host ha sido enviada. Te contactaremos pronto.",
    link: "/become-host/status",
    icon: "🏠",
    priority: "NORMAL",
    metadata: {
      requestType: "HOST_REQUEST",
      status: "PENDING",
    },
  });
}

/**
 * Notificar que debe completar el formulario
 */
export async function notifyHostRequestFormSent(userId) {
  return await createNotification({
    userId,
    type: "SYSTEM",
    title: "Completa tu solicitud 📝",
    message: "Hemos revisado tu solicitud inicial. Por favor completa el formulario de aplicación.",
    link: "/become-host/form",
    icon: "📝",
    priority: "HIGH",
    metadata: {
      requestType: "HOST_REQUEST",
      status: "IN_REVIEW",
    },
  });
}

/**
 * Notificar aprobación de solicitud de host
 */
export async function notifyHostRequestApproved(userId) {
  return await createNotification({
    userId,
    type: "SYSTEM",
    title: "¡Felicidades! 🎉",
    message: "Tu solicitud para ser Host ha sido aprobada. ¡Bienvenido a la comunidad!",
    link: "/host/dashboard",
    icon: "🎊",
    priority: "URGENT",
    metadata: {
      requestType: "HOST_REQUEST",
      status: "APPROVED",
    },
  });
}

/**
 * Notificar rechazo de solicitud de host
 */
export async function notifyHostRequestRejected(userId, reason) {
  return await createNotification({
    userId,
    type: "SYSTEM",
    title: "Solicitud no aprobada",
    message: `Tu solicitud para ser Host no fue aprobada. ${reason || ""}`,
    link: "/become-host/status",
    icon: "ℹ️",
    priority: "HIGH",
    metadata: {
      requestType: "HOST_REQUEST",
      status: "REJECTED",
      reason,
    },
  });
}

// ============================================
// NOTIFICACIONES DE SISTEMA
// ============================================

/**
 * Notificar bienvenida al nuevo usuario
 */
export async function notifyWelcome(userId, userName) {
  return await createNotification({
    userId,
    type: "SYSTEM",
    title: `¡Bienvenido a StayAS, ${userName}! 👋`,
    message: "Gracias por unirte. Explora nuestras experiencias y hospedajes únicos.",
    link: "/explore",
    icon: "👋",
    priority: "NORMAL",
    metadata: {
      type: "WELCOME",
    },
  });
}