import { logAudit } from "../services/auditLogService.js";
import * as conversationService from "../services/conversationService.js";
import * as messageService from "../services/messageService.js";
import prisma from "../src/lib/prisma.js";
import { getIo } from "../src/lib/socket.js";

// Broadcast helpers are local (not in a service) to avoid a circular ref
// with the socket connection handler. Errors are logged-and-swallowed —
// REST is the source of truth, real-time is best-effort.
function broadcastNewMessage(conversationId, message) {
  try {
    getIo().to(`conv:${conversationId}`).emit("message:new", message);
  } catch (err) {
    console.error("Failed to broadcast message:new:", err);
  }
}

function broadcastRead(conversationId, userId, lastReadAt) {
  try {
    getIo()
      .to(`conv:${conversationId}`)
      .emit("message:read", { conversationId, userId, lastReadAt });
  } catch (err) {
    console.error("Failed to broadcast message:read:", err);
  }
}

// Pull both participants' already-connected sockets into the new conv room
// so subsequent broadcasts reach them without requiring a reconnect.
function joinConversationRoom(conversationId, userIds) {
  try {
    const io = getIo();
    for (const uid of userIds) {
      io.in(`user:${uid}`).socketsJoin(`conv:${conversationId}`);
    }
  } catch (err) {
    console.error("Failed to add sockets to new conversation room:", err);
  }
}

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.listConversationsForUser(req.user.id);
    res.status(200).json({ data: conversations });
  } catch (error) {
    next(error);
  }
};

export const createOrGetConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const meId = req.user.id;

    if (!participantId || typeof participantId !== "number") {
      return res.status(400).json({ message: "participantId (number) is required" });
    }
    if (participantId === meId) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    const other = await prisma.user.findUnique({ where: { id: participantId } });
    if (!other) {
      return res.status(404).json({ message: "User not found" });
    }
    // V1: PATIENT ↔ PROVIDER only.
    const allowedPair =
      (req.user.role === "PATIENT" && other.role === "PROVIDER") ||
      (req.user.role === "PROVIDER" && other.role === "PATIENT");
    if (!allowedPair) {
      return res.status(403).json({ message: "Conversations are only allowed between a patient and a provider" });
    }

    // Idempotent: return existing 1-on-1 thread if one exists.
    const existing = await conversationService.findDirectConversation(meId, participantId);
    if (existing) {
      const full = await conversationService.getConversationById(existing.id);
      return res.status(200).json(full);
    }

    const created = await conversationService.createDirectConversation(meId, participantId);
    joinConversationRoom(created.id, [meId, participantId]);
    // Audit conversation creation only — message-level audit is out of
    // scope for V1 (write amplification with low forensic value).
    await logAudit({
      user: req.user,
      action: "CREATE",
      entity: "CONVERSATION",
      entityId: created.id,
      details: {
        description: `Started conversation with user #${participantId}`,
        participantIds: [meId, participantId],
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const listConversationMessages = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }
    await conversationService.assertParticipant(conversationId, req.user.id);

    const { cursor, limit } = req.query;
    const result = await messageService.listMessages(conversationId, { cursor, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const { body } = req.body;
    if (typeof body !== "string" || body.trim().length === 0) {
      return res.status(400).json({ message: "Message body is required" });
    }
    if (body.length > 4000) {
      return res.status(400).json({ message: "Message body too long (max 4000 chars)" });
    }

    await conversationService.assertParticipant(conversationId, req.user.id);

    const message = await messageService.createMessage({
      conversationId,
      senderId: req.user.id,
      body: body.trim(),
    });
    await conversationService.touchLastMessageAt(conversationId, message.createdAt);

    broadcastNewMessage(conversationId, message);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }
    await conversationService.assertParticipant(conversationId, req.user.id);
    const updated = await conversationService.markRead(conversationId, req.user.id);
    broadcastRead(conversationId, req.user.id, updated.lastReadAt);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
