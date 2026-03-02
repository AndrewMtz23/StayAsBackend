// src/controllers/conversations.controller.js
import {
  getUserConversations,
  getConversationByIdForUser,
  startConversation,
} from "../services/conversation.service.js";
import { getConversationMessages } from "../services/message.service.js";

/**
 * GET /api/conversations
 */
export async function getMyConversationsController(req, res, next) {
  try {
    const userId = req.user.id;
    const conversations = await getUserConversations(userId);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/conversations
 * body: { type, propertyId?, activityId?, hostId }
 */
export async function startConversationController(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, propertyId, activityId, hostId } = req.body;

    const conversation = await startConversation({
      type,
      propertyId: propertyId ? Number(propertyId) : undefined,
      activityId: activityId ? Number(activityId) : undefined,
      clientId: userId,
      hostId: Number(hostId),
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversations/:id
 */
export async function getConversationByIdController(req, res, next) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await getConversationByIdForUser(
      conversationId,
      userId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversación no encontrada o sin permiso",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversations/:id/messages
 */
export async function getConversationMessagesController(req, res, next) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { skip, take } = req.query;

    const messages = await getConversationMessages(
      conversationId,
      userId,
      {
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
}
