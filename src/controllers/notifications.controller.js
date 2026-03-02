// src/controllers/notifications.controller.js
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notification.service.js";

/**
 * GET /api/notifications
 */
export async function getMyNotificationsController(req, res, next) {
  try {
    const userId = req.user.id;
    const { onlyUnread, take, skip } = req.query;

    const result = await getUserNotifications(userId, {
      onlyUnread: onlyUnread === "true",
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notifications/test
 * Crea una notificación de prueba (útil en desarrollo)
 */
export async function createTestNotificationController(req, res, next) {
  try {
    const userId = req.user.id;

    const notification = await createNotification({
      userId,
      type: "SYSTEM",
      title: "Notificación de prueba",
      message: "Este es un mensaje de prueba de notificaciones.",
      priority: "NORMAL",
      emitSocket: true,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/:id/read
 */
export async function markNotificationAsReadController(req, res, next) {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    const updated = await markNotificationAsRead(userId, notificationId);

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/read-all
 */
export async function markAllNotificationsAsReadController(req, res, next) {
  try {
    const userId = req.user.id;

    await markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: "Todas las notificaciones han sido marcadas como leídas",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notifications/:id
 */
export async function deleteNotificationController(req, res, next) {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    await deleteNotification(userId, notificationId);

    res.json({
      success: true,
      message: "Notificación eliminada correctamente",
    });
  } catch (err) {
    next(err);
  }
}
