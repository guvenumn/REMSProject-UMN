// file: /frontend/src/components/Providers/WebSocketProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Socket, io } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

// Define message sender type
interface MessageSender {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Define socket error type
interface SocketError {
  message: string;
  details?: unknown;
}

// Define custom socket type with data property
interface CustomSocket extends Socket {
  data?: {
    user: {
      id: string;
      name: string;
    };
  };
}

// Define the type for the WebSocket context
interface WebSocketContextType {
  socket: CustomSocket | null;
  connected: boolean;
  connectToConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    tempId: string
  ) => boolean;
  isTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

// Default values for the WebSocket context
const defaultContext: WebSocketContextType = {
  socket: null,
  connected: false,
  connectToConversation: () => {},
  leaveConversation: () => {},
  sendMessage: () => false,
  isTyping: () => {},
  stopTyping: () => {},
};

// Create the context
const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

// Create a hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// Define a type for the window with socketIO property
interface CustomWindow extends Window {
  socketIO?: CustomSocket;
}

// Helper function to safely access localStorage
const safelyGetFromLocalStorage = (key: string) => {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(key);
    return value;
  } catch (err) {
    console.warn(`Error accessing localStorage for key: ${key}`, err);
    return null;
  }
};

// Get the socket URL properly, with secure protocol when needed
const getSocketUrl = () => {
  // First, try to get the specific socket URL from environment
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (socketUrl) {
    // Check if we're on HTTPS and need to enforce a secure websocket
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:"
    ) {
      // If it starts with http://, convert to https://
      if (socketUrl.startsWith("http://")) {
        return socketUrl.replace("http://", "https://");
      }
      // If it starts with ws://, convert to wss://
      if (socketUrl.startsWith("ws://")) {
        return socketUrl.replace("ws://", "wss://");
      }
      return socketUrl;
    }
    return socketUrl;
  }

  // Fallback: derive from API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const baseUrl = apiUrl.endsWith("/api")
    ? apiUrl.replace(/\/api$/, "")
    : apiUrl;

  // If we're on HTTPS, ensure WSS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (baseUrl.startsWith("http://")) {
      return baseUrl.replace("http://", "https://");
    }
    return baseUrl; // Should already be https://
  }

  return baseUrl;
};

// WebSocket provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<CustomSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // Helper to debug log only in development
  const debugLog = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[WebSocket]", ...args);
    }
  };

  // Initialize the WebSocket connection when the user is authenticated
  useEffect(() => {
    let socketInstance: CustomSocket | null = null;

    const cleanup = () => {
      if (socketInstance) {
        debugLog("Cleaning up WebSocket connection");
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);

        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (typeof window !== "undefined") {
          const customWindow = window as CustomWindow;
          customWindow.socketIO = undefined;
        }
      }
    };

    // Don't establish connection if not authenticated
    if (!isAuthenticated || !user) {
      cleanup();
      return cleanup;
    }

    // Get secure socket URL
    const SOCKET_URL = getSocketUrl();
    const token = safelyGetFromLocalStorage("token");

    if (!token) {
      console.warn("No token found, cannot initialize WebSocket");
      return cleanup;
    }

    debugLog("Initializing WebSocket connection to:", SOCKET_URL);

    socketInstance = io(SOCKET_URL, {
      auth: {
        token,
        clientId: Math.random().toString(36).substring(2, 15),
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    }) as CustomSocket;

    socketInstance.data = {
      user: { id: user.id, name: user.name },
    };

    socketInstance.on("connect", () => {
      debugLog("WebSocket connected with ID:", socketInstance?.id);
      setConnected(true);

      // Rejoin all conversations the user was previously in
      joinedRoomsRef.current.forEach((roomId) => {
        debugLog(`Rejoining conversation ${roomId} after reconnect`);
        socketInstance?.emit("joinConversation", roomId);
      });
    });

    socketInstance.on("disconnect", (reason) => {
      debugLog(`WebSocket disconnected: ${reason}`);
      setConnected(false);
    });

    socketInstance.on("error", (error: SocketError) => {
      console.error("WebSocket error:", error);
    });

    socketInstance.on("error:auth", (error: SocketError) => {
      console.error("WebSocket authentication error:", error);
      // If we get an auth error, clean up and don't retry
      cleanup();
    });

    socketInstance.on("connect_error", (error: SocketError) => {
      console.error("WebSocket connection error:", error);
    });

    socketInstance.io.on("reconnect_attempt", (attempt: number) => {
      debugLog(`Socket reconnection attempt: ${attempt}`);
    });

    socketInstance.io.on("reconnect", (attempt: number) => {
      debugLog(`Socket reconnected after ${attempt} attempts`);
    });

    // In development, log all socket events for debugging
    if (process.env.NODE_ENV !== "production") {
      socketInstance.onAny((event, ...args) => {
        debugLog(`Received event: ${event}`, args);
      });
    }

    setSocket(socketInstance);

    if (typeof window !== "undefined") {
      const customWindow = window as CustomWindow;
      customWindow.socketIO = socketInstance;
    }

    return cleanup;
  }, [isAuthenticated, user]);

  // Rest of your component remains the same...

  // Set up ping to keep connection alive
  useEffect(() => {
    if (socket && connected) {
      // Clear any existing ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Set up a ping every 30 seconds to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (socket.connected) {
          socket.emit("ping");
          debugLog("Ping sent to keep connection alive");
        }
      }, 30 * 1000);

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [socket, connected]);

  // Connect to a conversation
  const connectToConversation = (conversationId: string) => {
    if (!conversationId) return;

    if (socket && connected) {
      debugLog(`Joining conversation: ${conversationId}`);
      socket.emit("joinConversation", conversationId);
      joinedRoomsRef.current.add(conversationId);
    } else {
      console.warn("Cannot join conversation: WebSocket not connected");
      // Still add to joined rooms so we can join when we reconnect
      joinedRoomsRef.current.add(conversationId);
    }
  };

  // Leave a conversation
  const leaveConversation = (conversationId: string) => {
    if (!conversationId) return;

    if (socket && connected) {
      debugLog(`Leaving conversation: ${conversationId}`);
      socket.emit("leaveConversation", conversationId);
      joinedRoomsRef.current.delete(conversationId);
    } else {
      joinedRoomsRef.current.delete(conversationId);
    }
  };

  // Send a message
  const sendMessage = (
    conversationId: string,
    content: string,
    tempId: string
  ): boolean => {
    if (!conversationId || !content || !tempId) {
      console.warn("Missing required parameters for sendMessage");
      return false;
    }

    if (!socket || !connected) {
      console.warn("Cannot send message: WebSocket not connected");
      return false;
    }

    if (!user) {
      console.warn("Cannot send message: User not authenticated");
      return false;
    }

    debugLog(`Sending message to conversation: ${conversationId}`);

    const message = {
      conversationId,
      content,
      tempId,
      senderId: user.id,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      } as MessageSender,
      sentAt: new Date().toISOString(),
      isRead: false,
    };

    try {
      socket.emit("sendMessage", message);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  // Send typing indicator - only use one event name
  const isTyping = (conversationId: string) => {
    if (!conversationId || !user || !socket || !connected) return;

    debugLog(`Sending typing indicator for conversation: ${conversationId}`);
    // Just use one consistent event name
    socket.emit("userTyping", {
      conversationId,
      userId: user.id,
      name: user.name,
    });
  };

  // Send stop typing indicator - only use one event name
  const stopTyping = (conversationId: string) => {
    if (!conversationId || !user || !socket || !connected) return;

    debugLog(
      `Sending stop typing indicator for conversation: ${conversationId}`
    );
    // Just use one consistent event name
    socket.emit("userStoppedTyping", {
      conversationId,
      userId: user.id,
      name: user.name,
    });
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        connectToConversation,
        leaveConversation,
        sendMessage,
        isTyping,
        stopTyping,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
