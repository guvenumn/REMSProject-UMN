// src/types/message.ts
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string; // ISO date string
  isRead: boolean;
  readAt: string | null; // ISO date string
}

export interface Conversation {
  id: string;
  title?: string;
  propertyId?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
  unreadCount: number;
  isArchived?: boolean;
}

export interface MessageFormData {
  content: string;
}

export interface NewConversationData {
  recipientId: string;
  initialMessage: string;
  propertyId?: string;
}
