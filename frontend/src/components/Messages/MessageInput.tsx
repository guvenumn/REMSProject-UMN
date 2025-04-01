// src/components/Messages/MessageInput.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../Common/Button";
import { useWebSocket } from "@/components/Providers/WebSocketProvider";
import { useAuth } from "@/contexts/AuthContext";

type MessageInputProps = {
  conversationId: string;
  onSendMessage: (message: string) => Promise<any>;
  disabled?: boolean;
  placeholder?: string;
  onOptimisticUpdate?: (message: any) => void;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  onOptimisticUpdate,
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { socket, connected, sendMessage: sendSocketMessage, isTyping, stopTyping } = useWebSocket();
  const [typingIndicatorActive, setTypingIndicatorActive] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRoom = useRef(false);

  // Connect to the conversation via WebSocket when component mounts
  useEffect(() => {
    // Check if WebSocket is connected and if so, join the conversation
    if (socket && connected && conversationId && !hasJoinedRoom.current) {
      console.log(`Joining conversation ${conversationId} via WebSocket from MessageInput`);
      socket.emit("joinConversation", conversationId);
      hasJoinedRoom.current = true;
    }
    
    // Clean up when component unmounts
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (socket && connected && conversationId) {
        stopTyping(conversationId);
      }
    };
  }, [socket, connected, conversationId, stopTyping]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !connected || !conversationId) return;
    
    // If we're not already sending a typing indicator, send one
    if (!typingIndicatorActive) {
      console.log("Sending typing indicator");
      isTyping(conversationId);
      setTypingIndicatorActive(true);
    }
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout to stop the typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      console.log("Sending stop typing indicator (timeout)");
      stopTyping(conversationId);
      setTypingIndicatorActive(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting || !conversationId) return;

    const messageToSend = message.trim();
    
    // Clear the input field immediately to prevent double-sends
    setMessage("");
    setIsSubmitting(true);
    
    // Stop typing indicator when sending a message
    if (typingIndicatorActive && socket && connected) {
      console.log("Sending stop typing indicator (submit)");
      stopTyping(conversationId);
      setTypingIndicatorActive(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    
    try {
      // Generate a temporary ID for optimistic updates
      const tempId = `temp-${Date.now()}`;
      
      // Create optimistic message
      const optimisticMessage = {
        id: tempId, // Temporarily use tempId as id for UI purposes
        tempId,
        content: messageToSend,
        senderId: user?.id || "",
        sentAt: new Date().toISOString(),
        isRead: false,
        conversationId,
        sender: {
          id: user?.id,
          name: user?.name,
          avatarUrl: user?.avatarUrl
        }
      };
      
      // Apply optimistic update if callback provided
      if (onOptimisticUpdate) {
        console.log("Applying optimistic update with tempId:", tempId);
        onOptimisticUpdate(optimisticMessage);
      }
      
      // Try to send via WebSocket first
      if (connected && socket) {
        console.log(`Attempting to send message via WebSocket to conversation: ${conversationId}`);
        
        // Actually send the message via socket
        const sent = sendSocketMessage(conversationId, messageToSend, tempId);
        
        if (sent) {
          console.log("Message sent via WebSocket");
          setIsSubmitting(false);
          return;
        } else {
          console.log("WebSocket send failed, falling back to REST API");
        }
      }
      
      // Fallback to REST API
      console.log("Using REST API for message sending");
      const response = await onSendMessage(messageToSend);
      
      // If we successfully sent via API but still have a WebSocket connection,
      // notify other clients about the new message
      if (response && connected && socket) {
        const apiMessage = {
          ...response,
          conversationId
        };
        socket.emit("apiMessage", apiMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // If there was an error, put the message back in the input
      setMessage(messageToSend);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !message.trim()}
        >
          {isSubmitting ? "Sending..." : "Send"}
          {connected && <span className="ml-1 w-2 h-2 inline-block rounded-full bg-green-500"></span>}
        </Button>
      </div>
      {!connected && (
        <p className="text-xs text-gray-500 mt-1">
          WebSocket disconnected. Messages will be sent using API.
        </p>
      )}
    </form>
  );
};