import prisma from "../src/lib/prisma.js";

// Fetch messages newest-first in pages of `limit` (default 30, max 100).
// Cursor-based pagination — pass the nextCursor from the previous page to
// get the next batch. We fetch take+1 rows to peek ahead and check if a
// next page exists without a separate COUNT query. The extra row is sliced
// off before returning. nextCursor is the id of the last message in the
// current page — passing it back uses lt (less than) so we never re-fetch
// the cursor message itself, just everything older than it.
export const listMessages = async (conversationId, { cursor, limit = 30 } = {}) => {
  const take = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursor && { id: { lt: Number(cursor) } }),
    },
    orderBy: { id: "desc" },
    take: take + 1,
  });

  const hasMore = messages.length > take;
  const data = hasMore ? messages.slice(0, take) : messages;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
};

export const createMessage = async ({ conversationId, senderId, body }) => {
  return prisma.message.create({
    data: { conversationId, senderId, body },
  });
};
