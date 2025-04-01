// src/utils/messageWebSocket.ts
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

// --- Types for events ---

// Generic callback type: accepts any array of unknown values.
type Callback = (...args: unknown[]) => void;

// Example event data types. Adjust as needed.
interface NewMessageData {
  id: string;
  [key: string]: unknown;
}

interface MessageNotificationData {
  conversation?: { id: string };
  [key: string]: unknown;
}

interface MessagesReadData {
  conversationId: string;
  [key: string]: unknown;
}

interface MessageSentData {
  tempId: string;
  [key: string]: unknown;
}

interface ConversationJoinedData {
  conversationId: string;
  [key: string]: unknown;
}

// --- End event types ---

// Logging
const DEBUG = true;
const log = (...args: unknown[]): void => {
  if (DEBUG) console.log("[Socket]", ...args);
};

// Socket.IO instance and reconnect settings
let socket: Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds
const RECONNECT_DELAY_MAX = 30000; // 30 seconds
const SOCKET_TIMEOUT = 10000; // 10 seconds timeout

// Callbacks for event listeners
const callbacks = {
  newMessage: new Set<Callback>(),
  messageNotification: new Set<Callback>(),
  userTyping: new Set<Callback>(),
  userStoppedTyping: new Set<Callback>(),
  messagesRead: new Set<Callback>(),
  error: new Set<Callback>(),
  connect: new Set<Callback>(),
  disconnect: new Set<Callback>(),
  reconnect: new Set<Callback>(),
  reconnectAttempt: new Set<Callback>(),
  reconnectError: new Set<Callback>(),
  messageSent: new Set<Callback>(),
  conversationJoined: new Set<Callback>(),
};

/**
 * Initialize Socket.IO connection.
 */
export function initializeSocket(): Socket | null {
  // If already connected, return the existing socket
  if (socket && socket.connected) return socket;

  try {
    // Get token from local storage (for authentication)
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      log("Cannot initialize socket without authentication token");
      return null;
    }

    // Create socket connection with reconnection options
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: RECONNECT_DELAY_MAX,
      timeout: SOCKET_TIMEOUT,
    });

    // Setup connection event handlers
    socket.on("connect", (): void => {
      log("Socket connected");
      reconnectAttempts = 0;
      callbacks.connect.forEach((cb) => cb());
    });

    socket.on("disconnect", (reason: string): void => {
      log(`Socket disconnected: ${reason}`);
      callbacks.disconnect.forEach((cb) => cb(reason));
      if (reason === "io server disconnect") {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => reconnectSocket(), RECONNECT_DELAY);
      }
    });

    // Reconnection events
    socket.io.on("reconnect", (attempt: number): void => {
      log(`Socket reconnected after ${attempt} attempts`);
      callbacks.reconnect.forEach((cb) => cb(attempt));
    });

    socket.io.on("reconnect_attempt", (attempt: number): void => {
      log(`Socket reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
      callbacks.reconnectAttempt.forEach((cb) => cb(attempt));
    });

    socket.io.on("reconnect_error", (error: Error): void => {
      log(`Socket reconnection error: ${error.message}`);
      callbacks.reconnectError.forEach((cb) => cb(error));
    });

    socket.io.on("reconnect_failed", (): void => {
      log("Socket reconnection failed after max attempts");
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const delay = Math.min(
        RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        RECONNECT_DELAY_MAX
      );
      reconnectTimer = setTimeout(() => reconnectSocket(), delay);
    });

    // Message events
    socket.on("newMessage", (message: NewMessageData): void => {
      log("New message received:", message.id);
      callbacks.newMessage.forEach((cb) => cb(message));
    });

    socket.on("messageNotification", (data: MessageNotificationData): void => {
      log(
        "Message notification received for conversation:",
        data.conversation?.id
      );
      callbacks.messageNotification.forEach((cb) => cb(data));
    });

    socket.on("userTyping", (data: unknown): void => {
      callbacks.userTyping.forEach((cb) => cb(data));
    });

    socket.on("userStoppedTyping", (data: unknown): void => {
      callbacks.userStoppedTyping.forEach((cb) => cb(data));
    });

    socket.on("messagesRead", (data: MessagesReadData): void => {
      log("Messages marked as read in conversation:", data.conversationId);
      callbacks.messagesRead.forEach((cb) => cb(data));
    });

    socket.on("messageSent", (data: MessageSentData): void => {
      log("Message sent confirmation received, tempId:", data.tempId);
      callbacks.messageSent.forEach((cb) => cb(data));
    });

    socket.on("conversationJoined", (data: ConversationJoinedData): void => {
      log("Joined conversation:", data.conversationId);
      callbacks.conversationJoined.forEach((cb) => cb(data));
    });

    // Error handling
    socket.on("error", (error: Error): void => {
      log(`Socket error: ${error.message}`);
      callbacks.error.forEach((cb) => cb(error));
    });

    socket.on("connect_error", (error: Error): void => {
      log(`Socket connection error: ${error.message}`);
      callbacks.error.forEach((cb) => cb(error));
    });

    log("Socket.IO initialized");
    return socket;
  } catch (error: unknown) {
    log(`Error initializing socket: ${error}`);
    return null;
  }
}

/**
 * Attempt to reconnect the socket.
 */
function reconnectSocket(): void {
  reconnectAttempts++;
  log(`Manual reconnection attempt ${reconnectAttempts}`);
  if (socket) {
    socket.disconnect();
    socket.connect();
  } else {
    initializeSocket();
  }
}

/**
 * Join a conversation room.
 * @param conversationId - The conversation ID to join.
 */
export function joinConversation(conversationId: string): boolean {
  if (!socket || !socket.connected) {
    const newSocket = initializeSocket();
    if (!newSocket || !newSocket.connected) {
      log("Cannot join conversation: Socket not initialized or disconnected");
      return false;
    }
  }
  socket!.emit("joinConversation", conversationId);
  log(`Attempting to join conversation: ${conversationId}`);
  return true;
}

/**
 * Leave a conversation room.
 * @param conversationId - The conversation ID to leave.
 */
export function leaveConversation(conversationId: string): boolean {
  if (socket && socket.connected) {
    socket.emit("leaveConversation", conversationId);
    log(`Left conversation: ${conversationId}`);
    return true;
  }
  log("Cannot leave conversation: Socket not initialized or disconnected");
  return false;
}

/**
 * Send a message through the socket.
 * @param conversationId - The conversation ID.
 * @param content - The message content.
 * @param tempId - Temporary ID for optimistic updates.
 * @returns Boolean indicating success.
 */
export function sendSocketMessage(
  conversationId: string,
  content: string,
  tempId: string
): boolean {
  if (!socket || !socket.connected) {
    const newSocket = initializeSocket();
    if (!newSocket || !newSocket.connected) {
      log("Cannot send message: Socket not initialized or disconnected");
      return false;
    }
  }
  socket!.emit("sendMessage", { conversationId, content, tempId });
  log(`Message sent to conversation: ${conversationId} with tempId: ${tempId}`);
  return true;
}

/**
 * Send typing indicator.
 * @param conversationId - The conversation ID.
 */
export function sendTypingIndicator(conversationId: string): void {
  if (socket && socket.connected) {
    socket.emit("typing", conversationId);
  }
}
