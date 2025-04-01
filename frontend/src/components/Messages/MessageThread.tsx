// src/components/Messages/MessageThread.tsx
import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "../Common/Avatar";
import { useWebSocket } from "@/components/Providers/WebSocketProvider";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
  isRead?: boolean;
  conversationId?: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tempId?: string;
}

export interface User {
  id: string;
  name: string;
  profileImage?: string;
}

export interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  otherUser: User;
  conversationId: string;
  loading?: boolean;
  onMessageReceived?: (message: Message) => void;
}

interface TypingIndicatorData {
  userId: string;
  name: string;
  conversationId: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages: initialMessages,
  currentUserId,
  otherUser,
  conversationId,
  loading = false,
  onMessageReceived,
}) => {
  // Removed unused 'user' from useAuth()
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, connected, connectToConversation } = useWebSocket();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const hasJoinedRoom = useRef(false);
  const processedMessageIds = useRef(new Set<string>());
  const firstRenderRef = useRef(true);
  const initialMessagesRef = useRef(initialMessages);

  // Reset message state when conversation ID changes
  useEffect(() => {
    console.log("Conversation ID changed:", conversationId);
    processedMessageIds.current.clear();
    setMessages([]);
    firstRenderRef.current = true;
  }, [conversationId]);

  // Use a ref to avoid re-renders triggering excessive callbacks
  useEffect(() => {
    initialMessagesRef.current = initialMessages;
  }, [initialMessages]);

  // Force reconnection to ensure we're in the room
  useEffect(() => {
    if (socket && connected && conversationId) {
      // Force leave and rejoin to ensure we're properly in the room
      socket.emit("leaveConversation", conversationId);

      // Short delay before rejoining
      setTimeout(() => {
        console.log(
          `Re-joining conversation ${conversationId} from MessageThread`
        );
        connectToConversation(conversationId);
      }, 300);
    }
  }, [socket, connected, conversationId, connectToConversation]);

  // Join the conversation when component mounts
  useEffect(() => {
    if (socket && connected && conversationId && !hasJoinedRoom.current) {
      console.log(`Joining conversation ${conversationId} from MessageThread`);
      connectToConversation(conversationId);
      hasJoinedRoom.current = true;

      // Refresh connection every 30 seconds to ensure we stay in the room
      const intervalId = setInterval(() => {
        if (socket && connected) {
          console.log(`Refreshing conversation connection: ${conversationId}`);
          connectToConversation(conversationId);
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [socket, connected, conversationId, connectToConversation]);

  // Initialize the processed message IDs set and handle initial messages
  useEffect(() => {
    // Skip empty message arrays
    if (!initialMessages || initialMessages.length === 0) return;

    console.log(`Processing initial messages: ${initialMessages.length}`);

    // Don't update if it's the same message array
    if (
      !firstRenderRef.current &&
      messages.length === initialMessages.length &&
      messages.every(
        (msg, idx) =>
          msg.id === initialMessages[idx].id ||
          msg.tempId === initialMessages[idx].tempId
      )
    ) {
      console.log("Same message array, skipping update");
      return;
    }

    // Reset the message cache on first render
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      processedMessageIds.current.clear();
    }

    // Create a new array with only unique messages based on ID
    const uniqueMessages: Message[] = [];
    const seenIds = new Set<string>();

    for (const msg of initialMessages) {
      const msgId = msg.id || msg.tempId;

      // Skip messages that don't have an ID or add them if no ID
      if (!msgId) {
        uniqueMessages.push(msg);
        continue;
      }

      // Only add if we haven't seen this ID before
      if (!seenIds.has(msgId)) {
        seenIds.add(msgId);
        uniqueMessages.push(msg);
        processedMessageIds.current.add(msgId);
      }
    }

    console.log(
      `Set ${uniqueMessages.length} unique messages from initial ${initialMessages.length} messages`
    );
    setMessages(uniqueMessages);
  }, [initialMessages, messages]);

  // Listen for new messages and typing indicators - FIXED TO NOT CAUSE RENDER ISSUES
  useEffect(() => {
    if (!socket || !conversationId) return;

    console.log(
      `Setting up message listeners for conversation ${conversationId}`
    );

    const handleNewMessage = (message: Message) => {
      console.log("New message received via WebSocket:", message);

      // Check if this is for our conversation
      if (message.conversationId !== conversationId) {
        console.log("Message is for a different conversation, ignoring");
        return;
      }

      // Most important log for debugging
      console.log("Message details:", {
        id: message.id,
        tempId: message.tempId,
        senderId: message.senderId,
        currentUserId: currentUserId,
        content: message.content,
      });

      // Check if we've already processed this message (by id or tempId)
      const messageId = message.id || message.tempId;
      if (!messageId) {
        console.log("Message has no ID, processing anyway");
      } else if (processedMessageIds.current.has(messageId)) {
        console.log("Message already processed, skipping:", messageId);
        return;
      } else {
        // Add to processed IDs
        processedMessageIds.current.add(messageId);
      }

      console.log("Adding message to thread:", message.content);

      // The critical fix: check for messages that are already in the state
      setMessages((prev) => {
        // Check if the exact same message already exists by comparing all properties
        for (const existingMsg of prev) {
          // Check by ID first (most reliable)
          if (
            (existingMsg.id && existingMsg.id === message.id) ||
            (existingMsg.tempId && existingMsg.tempId === message.tempId)
          ) {
            console.log(
              "Message with matching ID already exists, not adding duplicate"
            );
            return prev;
          }

          // Then check by content + sender + approximate time (within 5 seconds)
          if (
            existingMsg.content === message.content &&
            existingMsg.senderId === message.senderId &&
            Math.abs(
              new Date(existingMsg.sentAt).getTime() -
                new Date(message.sentAt).getTime()
            ) < 5000
          ) {
            console.log(
              "Message with matching content/sender/time already exists, not adding duplicate"
            );
            return prev;
          }
        }

        // If message is not a duplicate and we have a callback, call it
        // in the next tick to avoid React state update issues
        if (onMessageReceived) {
          setTimeout(() => {
            onMessageReceived(message);
          }, 0);
        }

        // Message is unique, add it
        return [...prev, message];
      });
    };

    const handleMessageSent = (data: { tempId: string; message: Message }) => {
      console.log("Message sent confirmation received:", data);

      // Make sure we track the real message ID
      if (data.message.id) {
        processedMessageIds.current.add(data.message.id);
      }

      // Update the temporary message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === data.tempId
            ? { ...data.message, tempId: data.tempId }
            : msg
        )
      );
    };

    const handleTyping = (data: TypingIndicatorData) => {
      console.log("Typing indicator received:", data);
      // Only show typing indicator for the other user
      if (data.userId && data.userId !== currentUserId) {
        setTypingUser(data.name || otherUser.name);
      }
    };

    const handleStopTyping = (data: TypingIndicatorData) => {
      console.log("Stop typing indicator received:", data);
      // Only clear typing indicator if it's from the other user
      if (data.userId && data.userId !== currentUserId) {
        setTypingUser(null);
      }
    };

    // Clean up all other socket handlers first to avoid duplicates
    socket.off("newMessage");
    socket.off("messageSent");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("message");
    socket.off("chatMessage");

    // Register all event listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("message", handleNewMessage);
    socket.on("chatMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStopTyping);

    // Debug logging for all incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`[Socket Event] ${eventName}:`, args);
    });

    return () => {
      console.log("Removing message listeners");
      socket.off("newMessage", handleNewMessage);
      socket.off("message", handleNewMessage);
      socket.off("chatMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStopTyping);
      socket.offAny();
    };
  }, [
    socket,
    currentUserId,
    conversationId,
    onMessageReceived,
    otherUser.name,
  ]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Format time from message
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Format date for message groups
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "";
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{
    [date: string]: Message[];
  }>((groups, message) => {
    const date = new Date(message.sentAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-2 sm:p-4">
        <div className="w-8 h-8 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 text-sm sm:text-base">
          Loading messages...
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-2 sm:p-4 text-gray-500">
        <p className="text-sm sm:text-base">No messages yet</p>
        <p className="text-xs sm:text-sm">
          Start the conversation by sending a message!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 w-full">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-2 w-full">
          <div className="flex justify-center">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {formatDate(dateMessages[0].sentAt)}
            </span>
          </div>

          {dateMessages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUserId;

            // Create a truly unique key using message ID/tempID + index + date
            const messageKey = `${
              message.id || message.tempId || "msg"
            }-${date}-${index}`;

            return (
              <div
                key={messageKey}
                className={`flex ${isCurrentUser ? "justify-end" : ""} w-full`}
              >
                <div
                  className={`flex ${
                    isCurrentUser
                      ? "max-w-[80%] sm:max-w-[75%]"
                      : "max-w-[80%] sm:max-w-[75%]"
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="mr-1 sm:mr-2 mt-1 flex-shrink-0">
                      <Avatar
                        src={otherUser.profileImage || ""}
                        alt={otherUser.name || "User"}
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="max-w-full overflow-hidden">
                    {!isCurrentUser && (
                      <div className="text-xs text-gray-500 mb-1 truncate">
                        {otherUser.name || "User"}
                      </div>
                    )}

                    <div
                      className={`p-2 sm:p-3 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <div className="text-sm sm:text-base break-words">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.sentAt)}
                        {message.tempId && !message.id && (
                          <span className="ml-1">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex w-full">
          <div className="flex max-w-[80%] sm:max-w-[75%]">
            <div className="mr-1 sm:mr-2 mt-1 flex-shrink-0">
              <Avatar
                src={otherUser.profileImage || ""}
                alt={otherUser.name || "User"}
                size="sm"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 truncate">
                {typingUser}
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gray-100 text-gray-800 rounded-tl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WebSocket connection indicator */}
      {!connected && (
        <div className="flex justify-center">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            WebSocket disconnected - Messages may be delayed
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
