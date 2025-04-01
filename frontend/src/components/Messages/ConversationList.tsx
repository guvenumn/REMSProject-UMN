// Path: src/components/Messages/ConversationList.tsx
import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/components/Providers/WebSocketProvider";
import { Avatar } from "../Common/Avatar";

interface Conversation {
  id: string;
  title?: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount?: number;
  property?: {
    id: string;
    title: string;
    images?: Array<{ url: string }>;
  };
  updatedAt?: string;
  isInquiry?: boolean;
  inquiryStatus?: "NEW" | "RESPONDED" | "CLOSED";
}

// Define the message structure to replace the 'any' type
interface MessageNotification {
  id?: string;
  content: string;
  sentAt: string;
  senderId: string;
  conversationId?: string;
  tempId?: string;
  status?: string;
  isRead?: boolean;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  loading?: boolean;
  showInquiryBadges?: boolean;
  onConversationUpdate?: (updatedConversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  loading = false,
  showInquiryBadges = true,
  onConversationUpdate,
}) => {
  const { user } = useAuth();
  const { socket, connected } = useWebSocket();

  // Listen for message notifications to update conversation list
  useEffect(() => {
    if (!socket || !connected) return;

    // Handle message notifications to update conversation list in real-time
    const handleMessageNotification = (data: {
      message: MessageNotification;
      conversation: Conversation;
    }) => {
      console.log("Message notification received:", data);

      // Only process if we have the right data
      if (data.message && data.conversation && data.conversation.id) {
        // Find the conversation in our list
        const existingConversation = conversations.find(
          (c) => c.id === data.conversation.id
        );

        if (existingConversation) {
          // Update the conversation with the new message data
          const updatedConversation = {
            ...existingConversation,
            lastMessage: {
              content: data.message.content,
              sentAt: data.message.sentAt,
              senderId: data.message.senderId,
            },
            updatedAt: data.message.sentAt,
            // If this is not the active conversation, increment unread count
            unreadCount:
              activeConversationId === data.conversation.id
                ? 0
                : (existingConversation.unreadCount || 0) + 1,
          };

          // Notify parent component about the update
          if (onConversationUpdate) {
            onConversationUpdate(updatedConversation);
          }
        }
      }
    };

    // Clean up existing listener to avoid duplicates
    socket.off("messageNotification");

    // Listen for message notifications
    socket.on("messageNotification", handleMessageNotification);

    return () => {
      socket.off("messageNotification", handleMessageNotification);
    };
  }, [
    socket,
    connected,
    conversations,
    activeConversationId,
    onConversationUpdate,
  ]);

  // Helper to get the other participant in the conversation (not current user)
  const getOtherParticipant = (conversation: Conversation) => {
    return (
      conversation.participants.find((p) => p.id !== user?.id) ||
      conversation.participants[0]
    );
  };

  // Format relative time for messages
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Get badge style for inquiry status
  const getInquiryStatusColor = (status?: string) => {
    switch (status) {
      case "NEW":
        return "bg-yellow-500";
      case "RESPONDED":
        return "bg-blue-500";
      case "CLOSED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Sort conversations by most recent message
  const sortedConversations = [...conversations].sort((a, b) => {
    const aDate = new Date(a.lastMessage?.sentAt || a.updatedAt || 0);
    const bDate = new Date(b.lastMessage?.sentAt || b.updatedAt || 0);
    return bDate.getTime() - aDate.getTime();
  });

  if (loading) {
    return (
      <div className="divide-y divide-gray-200 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedConversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 w-full">
        <p>No conversations found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 w-full">
      {sortedConversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isActive = conversation.id === activeConversationId;
        const hasUnread =
          conversation.unreadCount && conversation.unreadCount > 0;

        return (
          <Link
            href={`/messages/${conversation.id}`}
            key={conversation.id}
            className={`block p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
              isActive ? "bg-gray-100" : ""
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={otherParticipant?.avatarUrl || ""}
                  alt={otherParticipant?.name || "User"}
                  size="md"
                />

                {/* Connection status indicator */}
                {connected && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                    title="Connected"
                  ></div>
                )}

                {/* Show inquiry badges if enabled */}
                {showInquiryBadges && conversation.isInquiry && (
                  <div
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getInquiryStatusColor(
                      conversation.inquiryStatus
                    )}`}
                    title={`Inquiry: ${conversation.inquiryStatus}`}
                  ></div>
                )}
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-center">
                  <p
                    className={`font-medium truncate text-sm sm:text-base ${
                      hasUnread ? "font-bold" : ""
                    }`}
                  >
                    {otherParticipant?.name || "Unknown User"}
                  </p>

                  <span className="text-xs text-gray-500 whitespace-nowrap ml-1 flex-shrink-0">
                    {formatTime(
                      conversation.lastMessage?.sentAt || conversation.updatedAt
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p
                    className={`text-xs sm:text-sm truncate ${
                      hasUnread
                        ? "text-gray-900 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {conversation.lastMessage?.content || "No messages yet"}
                  </p>

                  {/* Only render the badge if there are unread messages */}
                  {hasUnread ? (
                    <span className="ml-1 bg-primary text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>

                {/* Property reference */}
                {conversation.property && (
                  <div className="mt-1 overflow-hidden">
                    <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-full">
                      {conversation.property.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ConversationList;
