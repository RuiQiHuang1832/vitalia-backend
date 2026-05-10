import prisma from "../src/lib/prisma.js";
import { HttpError } from "../utils/HttpError.js";

// Reusable include shape — whenever we load a participant, also pull their
// User row and whichever profile (Patient or Provider) belongs to them.
const participantInclude = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, firstName: true, lastName: true, specialty: true } },
    },
  },
};

export const listConversationsForUser = async (userId) => {
  // Grab all conversations where this user is a participant, ordered by
  // most recently active. Each conversation includes all participants
  // (not just the requesting user) and the single most recent message.
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participants: { include: participantInclude },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Pull out just "my" participant row from each conversation so we can
  // access lastReadAt per conversation. We can't use conversations alone
  // because each conversation holds all participants, not just ours.
  const me = conversations
    .map((c) => c.participants.find((p) => p.userId === userId))
    .filter(Boolean);

  // For each conversation, count messages not sent by me that arrived
  // after the last time I read that conversation. Runs all queries in
  // parallel via Promise.all instead of one by one.
  // me[i] and conversations[i] line up by index intentionally.
  const unreadCounts = await Promise.all(
    conversations.map((c, i) => {
      const myPart = me[i];
      return prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          // If lastReadAt is null (never read), skip the date filter and
          // count all messages not sent by me.
          ...(myPart?.lastReadAt && { createdAt: { gt: myPart.lastReadAt } }),
        },
      });
    })
  );

  // Shape the final response — unreadCounts[i] lines up with conversations[i].
  return conversations.map((c, i) => ({
    id: c.id,
    createdAt: c.createdAt,
    lastMessageAt: c.lastMessageAt,
    participants: c.participants,
    lastMessage: c.messages[0] ?? null,
    unreadCount: unreadCounts[i],
  }));
};

// Find an existing 1-on-1 conversation between two users. We query for
// conversations that contain both users, then filter to exactly 2
// participants to avoid false matches in future group conversations.
export const findDirectConversation = async (userIdA, userIdB) => {
  const candidates = await prisma.conversation.findMany({
    where: {
      AND: [
        { participants: { some: { userId: userIdA } } },
        { participants: { some: { userId: userIdB } } },
      ],
    },
    include: { participants: true },
  });
  return candidates.find((c) => c.participants.length === 2) ?? null;
};

// Create a new conversation and add both users as participants in one
// atomic operation. Prisma creates the Conversation row first to get its
// id, then inserts both ConversationParticipant rows using that id.
// lastReadAt defaults to null for both — neither has read anything yet.
export const createDirectConversation = async (userIdA, userIdB) => {
  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userIdA }, { userId: userIdB }],
      },
    },
    include: { participants: { include: participantInclude } },
  });
};

export const getConversationById = async (id) => {
  return prisma.conversation.findUnique({
    where: { id },
    include: { participants: { include: participantInclude } },
  });
};

// Guard function — call this at the start of any route that touches a
// conversation. Throws 403 if the requesting user isn't a participant,
// killing the request before any data is read or written.
// Uses the composite primary key (conversationId + userId) to look up
// the participant row directly.
export const assertParticipant = async (conversationId, userId) => {
  const part = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!part) {
    throw new HttpError(403, "Forbidden: not a participant of this conversation");
  }
  return part;
};

// Update lastReadAt to now for this user in this conversation.
// Used to track unread counts — any message after this timestamp is unread.
export const markRead = async (conversationId, userId) => {
  return prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
};

// Stamp the conversation with the timestamp of the latest message so
// conversations can be sorted by most recently active. We pass in the
// message's own createdAt rather than calling new Date() again to keep
// lastMessageAt in exact sync with the message row.
export const touchLastMessageAt = async (conversationId, when) => {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: when },
  });
};
