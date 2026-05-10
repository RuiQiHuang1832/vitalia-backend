import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import prisma from "./prisma.js";

// Initialize — bolt socket.io onto the existing HTTP server so REST and websockets share the same port.
//   Auth — verify the JWT cookie at handshake time so unauthenticated clients never get a connection.
// Join rooms — on connect, put the socket into user: <id> and every conv:<id> they're a participant in, so they're wired up to receive broadcasts immediately.
//   Expose io — module-level singleton with a getIo() accessor so controllers elsewhere (like your message controller) can call io.to("conv:42").emit(...) after a DB write.

// Module-level singleton — set once by initSocket() at startup, then read
// by controllers via getIo() when they need to broadcast events. Storing
// it here (vs attaching to express's app) keeps the surface flat: any
// controller / service can import getIo without threading req around.
let io = null;

// CORS allowlist mirrors the express config in src/app.js. Sockets and
// HTTP both run on port 8080 sharing the same HTTP server, so they need
// matching origin rules — otherwise the handshake (which is HTTP under
// the hood) would be blocked before the upgrade to websocket.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://vitalia-frontend-three.vercel.app",
];

// Pulls the accessToken value out of the Cookie header. We can't use
// cookie-parser here because socket.io's handshake exposes raw headers.
// Returns null if the cookie isn't present or the header is missing.
function readAccessTokenCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("accessToken="));
  if (!match) return null;
  return match.slice("accessToken=".length);
}

// Called once from server.js after the HTTP server is created. Attaches
// socket.io to that same server (so websockets and REST share port 8080),
// installs the auth middleware, and wires the connection handler.
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
  });

  // Handshake-time auth: runs BEFORE the connection event fires. If next()
  // is called with an Error, the client gets a connect_error and never
  // sees `connection`. We use the same JWT + cookie scheme as requireAuth,
  // so a logged-in browser can connect with no extra setup.
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = readAccessTokenCookie(cookieHeader);
      if (!token) return next(new Error("Unauthorized: no access token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // socket.data is the documented place for per-connection state.
      // Avoiding socket.user to not collide with anything socket.io uses.
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Unauthorized: invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.user?.id;
    if (!userId) {
      // Defensive — auth middleware should have rejected, but guard anyway.
      socket.disconnect(true);
      return;
    }

    // Two kinds of rooms per socket:
    //   user:<userId>  — addressable by user, used to add this socket to
    //                    new conversation rooms when a conversation is
    //                    created mid-session (sub-step 3 work).
    //   conv:<convId>  — addressable by conversation, used to broadcast
    //                    message:new and message:read events.
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
      // Rooms not joined → user just won't get live updates this session.
      // Their REST flow still works, so we log and continue.
      console.error(`Failed to join conversation rooms for user ${userId}:`, err);
    }
  });

  return io;
}

// Accessor for controllers/services that need to broadcast. Throws if
// called before initSocket — surfaces a clear error rather than silently
// no-oping if the boot order is wrong.
export function getIo() {
  if (!io) throw new Error("socket.io has not been initialized");
  return io;
}
