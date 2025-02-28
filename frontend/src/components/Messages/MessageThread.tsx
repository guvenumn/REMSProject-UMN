"use client";

// Path: /frontend/src/components/Messages/MessageThread.tsx
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  isCurrentUser: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  recipientName: string;
  propertyTitle?: string;
  onSendMessage: (content: string) => void;
  className?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  recipientName,
  propertyTitle,
  onSendMessage,
  className,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Conversation Header */}
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">{recipientName}</h2>
        {propertyTitle && (
          <p className="text-sm text-foreground-light">
            Property: {propertyTitle}
          </p>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[75%] rounded-lg p-3",
              message.isCurrentUser
                ? "ml-auto bg-primary bg-opacity-10"
                : "bg-accent"
            )}
          >
            <p className="text-sm text-foreground">{message.content}</p>
            <p className="text-xs text-foreground-light mt-1">
              {message.timestamp}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-5 border-t border-border">
        <div className="relative">
          <textarea
            className="w-full p-4 pr-12 h-20 bg-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="absolute right-4 bottom-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export { MessageThread };
