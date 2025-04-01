// Path: /var/www/rems/backend/src/websocket/messageHandler.ts

import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import config from "../config";

export function initializeWebSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      // Manually verify the token using jwt
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      socket.data.user = decoded;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}, user: ${socket.data.user.id}`);

    // Join a conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.data.user.id} joined conversation: ${conversationId}`
      );
      socket.emit("conversationJoined", { conversationId });
    });

    // Leave a conversation room
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(
        `User ${socket.data.user.id} left conversation: ${conversationId}`
      );
    });

    // Send message
    socket.on("sendMessage", async (data) => {
      console.log(
        `Message received from ${socket.data.user.id} to conversation: ${data.conversationId}`
      );
      // Here you would save the message to database and emit to all users in the conversation
      io.to(data.conversationId).emit("newMessage", {
        id: "server-temp-id",
        content: data.content,
        sender: socket.data.user,
        conversationId: data.conversationId,
        tempId: data.tempId,
      });

      socket.emit("messageSent", { tempId: data.tempId, status: "sent" });
    });

    // Typing indicators
    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("userTyping", {
        user: socket.data.user,
        conversationId,
      });
    });

    socket.on("stopTyping", (conversationId) => {
      socket.to(conversationId).emit("userStoppedTyping", {
        user: socket.data.user,
        conversationId,
      });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
