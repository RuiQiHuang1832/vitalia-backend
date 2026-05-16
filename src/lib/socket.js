import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import prisma from "./prisma.js";

let io = null;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://vitalia-frontend-three.vercel.app",
];

// Raw cookie parsing — socket.io's handshake exposes raw headers, no
// cookie-parser middleware available here.
function readAccessTokenCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("accessToken="));
  if (!match) return null;
  return match.slice("accessToken=".length);
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = readAccessTokenCookie(cookieHeader);
      if (!token) return next(new Error("Unauthorized: no access token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Unauthorized: invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // user:<id> rooms let us add a socket to a new conversation room
    // mid-session when a conversation is created.
    socket.join(`user:${userId}`);

    try {
      const parts = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      for (const p of parts) {
        socket.join(`conv:${p.conversationId}`);
      }
    } catch (err) {
      console.error(`Failed to join conversation rooms for user ${userId}:`, err);
    }

    // Typing indicators are pure relay. Authorization piggybacks on room
    // membership: non-participants aren't in conv:<id> and get dropped.
    function relayTyping(event) {
      socket.on(event, (payload) => {
        const conversationId = payload?.conversationId;
        if (typeof conversationId !== "number") return;
        if (!socket.rooms.has(`conv:${conversationId}`)) return;
        socket.to(`conv:${conversationId}`).emit(event, {
          conversationId,
          userId,
        });
      });
    }
    relayTyping("typing:start");
    relayTyping("typing:stop");
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error("socket.io has not been initialized");
  return io;
}
