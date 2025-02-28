"use client";

// Path: /frontend/src/components/Messages/ConversationList.tsx
import React from "react";
import { Input } from "@/components/Common/Input";
import { cn } from "@/utils/cn";

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unread?: boolean;
  propertyId?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  className,
}) => {
  return (
    <div className={cn("w-full flex flex-col h-full", className)}>
      <div className="p-5">
        <h2 className="text-lg font-bold text-foreground mb-5">Messages</h2>

        <div className="mb-6">
          <Input placeholder="Search messages..." className="bg-accent" />
        </div>

        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={cn(
                "w-full text-left p-4 rounded-md flex items-start",
                activeConversationId === conversation.id
                  ? "bg-primary bg-opacity-10"
                  : "hover:bg-accent"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-accent-dark flex items-center justify-center">
                  {conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conversation.name}
                  </p>
                  <p className="text-xs text-foreground-light">
                    {conversation.time}
                  </p>
                </div>
                <p className="text-xs text-foreground-light truncate mt-1">
                  {conversation.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { ConversationList };
