import { logAudit } from "../services/auditLogService.js";
import * as conversationService from "../services/conversationService.js";
import * as messageService from "../services/messageService.js";
import prisma from "../src/lib/prisma.js";
import { getIo } from "../src/lib/socket.js";

// Centralized broadcast helpers — controllers call these after a successful
// DB write so a websocket failure can't roll back a persisted message.
// All errors are logged-and-swallowed: the REST response is the source of
// truth, real-time delivery is a "nice to have on top." Putting these as
// local helpers (not in a service) keeps them out of the layer that the
// socket connection handler itself imports — avoids a circular ref.
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

// When a conversation is created, both participants need their existing
// connected sockets to join the new room — otherwise message:new emits
// would never reach them until they reconnect. socketsJoin() iterates
// every socket in the source room (user:<id>) and adds it to the target.
//retro active for new conversations when two users are already connected.
function joinConversationRoom(conversationId, userIds) {
  try {
    const io = getIo();
    for (const uid of userIds) {
      //Find every already-connected socket currently in the user:<uid> room (which is this user across all their tabs and devices), and add each of them to the conv:<conversationId> list, so future broadcasts to that conversation will reach them.
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
    // V1: messaging is between PATIENT and PROVIDER only (one of each)
    const allowedPair =
      (req.user.role === "PATIENT" && other.role === "PROVIDER") ||
      (req.user.role === "PROVIDER" && other.role === "PATIENT");
    if (!allowedPair) {
      return res.status(403).json({ message: "Conversations are only allowed between a patient and a provider" });
    }

    // Idempotent — if a 1-on-1 thread between these two already exists,
    // return it instead of creating a duplicate.
    const existing = await conversationService.findDirectConversation(meId, participantId);
    if (existing) {
      const full = await conversationService.getConversationById(existing.id);
      return res.status(200).json(full);
    }

    const created = await conversationService.createDirectConversation(meId, participantId);
    // Pull existing connected sockets for both users into the new room
    // so subsequent message:new broadcasts reach them without a refresh.
    joinConversationRoom(created.id, [meId, participantId]);
    // Audit conversation creation only — message-level audit is intentionally
    // out of scope for V1 (write amplification with low forensic value).
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

    // Fan out to every connected socket in this conversation's room. Includes
    // the sender's other tabs (if any) — frontend dedupes by message id since
    // the sender's submitting tab already has the message from this response.
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
    // Tell the room "user X has read up to time Y" — the other side uses
    // this for read-receipt UI; the reader's own other tabs use it to
    // clear unread badges without a refetch.
    broadcastRead(conversationId, req.user.id, updated.lastReadAt);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
