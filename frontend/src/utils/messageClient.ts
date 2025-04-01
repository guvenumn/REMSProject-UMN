// src/utils/messageClient.ts
import apiClient from "./apiClient";
import { API_URLS } from "../config";

// Define missing types
interface MessageFilters {
  limit?: number;
  offset?: number;
  before?: string;
  after?: string;
  [key: string]: unknown;
}

export interface ConversationParams {
  recipientId: string;
  initialMessage?: string;
  propertyId?: string;
  isInquiry?: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: Array<{
    id: string;
    userId: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    isActive?: boolean;
    lastReadAt?: string;
    user?: {
      name?: string;
      email?: string;
      avatarUrl?: string;
    };
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
  property?: {
    id: string;
    title: string;
  };
  messages?: Array<{
    createdAt: string;
  }>;
  lastMessageAt?: string;
  inquiryStatus?: "NEW" | "RESPONDED" | "CLOSED";
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  readAt: string | null;
  sender?: {
    id: string;
    name?: string;
    avatarUrl?: string | null;
  };
  pending?: boolean;
}

// Toggle for debug logging
const DEBUG = process.env.NODE_ENV !== "production";
const log = (...args: unknown[]): void => {
  if (DEBUG) console.log("[MessageClient]", ...args);
};

/**
 * Normalize conversation participant format.
 * This handles different API response formats for participants.
 */
function normalizeParticipants(
  conversation: Conversation | Record<string, unknown>
): Conversation {
  if (!conversation || !("participants" in conversation)) {
    // Force conversion from unknown to Conversation
    return { ...conversation, participants: [] } as unknown as Conversation;
  }
  const normalizedParticipants = (
    conversation.participants as Array<Record<string, unknown>>
  ).map((participant) => {
    if (participant.user) {
      const userObj = participant.user as Record<string, unknown>;
      return {
        id: userObj.id as string,
        userId: userObj.id as string,
        name: userObj.name as string,
        email: userObj.email as string,
        avatarUrl: userObj.avatarUrl as string,
        isActive: participant.isActive,
        lastReadAt: participant.lastReadAt as string | undefined,
      };
    }
    if (participant.id || participant.userId) {
      return {
        id: (participant.id as string) || (participant.userId as string),
        userId: (participant.userId as string) || (participant.id as string),
        name: (participant.name as string) || "Unknown User",
        email: (participant.email as string) || "",
        avatarUrl: participant.avatarUrl as string,
        isActive:
          participant.isActive !== undefined ? participant.isActive : true,
        lastReadAt: participant.lastReadAt as string | undefined,
      };
    }
    return {
      id: "unknown",
      userId: "unknown",
      name: "Unknown User",
      email: "",
      avatarUrl: null,
      isActive: true,
      lastReadAt: null,
    };
  });
  return {
    ...conversation,
    participants: normalizedParticipants,
  } as Conversation;
}

/**
 * Normalize a list of conversations.
 */
function normalizeConversations(
  conversations: Array<Conversation | Record<string, unknown>>
): Conversation[] {
  if (!Array.isArray(conversations)) {
    return [];
  }
  return conversations.map((conversation) =>
    normalizeParticipants(conversation)
  );
}

/**
 * Get all conversations for the current user.
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    log("Fetching conversations");
    const data = await apiClient.get(API_URLS.MESSAGES.CONVERSATIONS);
    const conversations = ((
      data as { conversations?: Conversation[]; data?: Conversation[] }
    ).conversations ||
      (data as { data?: Conversation[] }).data ||
      data) as Conversation[];
    log(`Retrieved ${conversations.length} conversations`);
    return normalizeConversations(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

/**
 * Get a specific conversation.
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  if (
    !conversationId ||
    conversationId === "new" ||
    conversationId === "undefined" ||
    conversationId === "null"
  ) {
    log(`Invalid conversation ID: ${conversationId || "undefined"}`);
    return null;
  }
  try {
    log(`Fetching conversation: ${conversationId}`);
    const data = await apiClient.get(
      `${API_URLS.MESSAGES.CONVERSATIONS}/${conversationId}`
    );
    const conversation = ((
      data as { conversation?: Conversation; data?: Conversation }
    ).conversation ||
      (data as { data?: Conversation }).data ||
      data) as Conversation;
    log(`Retrieved conversation: ${conversationId}`);
    if (!conversation || !conversation.id) {
      log(
        `Invalid or empty conversation data returned for ID: ${conversationId}`
      );
      return null;
    }
    return normalizeParticipants(conversation);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error(`Error fetching conversation ${conversationId}:`, error);
    if (
      (error as { response?: { status?: number } }).response?.status === 404 ||
      (error.message && error.message.includes("not found"))
    ) {
      log(`Conversation not found: ${conversationId}`);
      return null;
    }
    return null;
  }
}

/**
 * Get messages for a conversation.
 */
export async function getMessages(
  conversationId: string,
  filters: MessageFilters = {}
): Promise<Message[]> {
  if (
    !conversationId ||
    conversationId === "new" ||
    conversationId === "undefined"
  ) {
    log(
      `Cannot fetch messages for invalid conversation ID: ${
        conversationId || "undefined"
      }`
    );
    return [];
  }
  try {
    log(`Fetching messages for conversation ${conversationId}`);
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const endpoint = `${
      API_URLS.MESSAGES.CONVERSATIONS
    }/${conversationId}/messages${queryString ? `?${queryString}` : ""}`;
    // Cast the API response to a known shape.
    const data = (await apiClient.get(endpoint)) as {
      messages?: Message[];
      data?: Message[];
    };
    const messages = data.messages || data.data || [];
    log(
      `Retrieved ${messages.length} messages for conversation ${conversationId}`
    );
    return messages;
  } catch (error) {
    console.error(
      `Error fetching messages for conversation ${conversationId}:`,
      error
    );
    return [];
  }
}

/**
 * Create a new conversation.
 */
export async function createConversation(
  params: ConversationParams
): Promise<Conversation | null> {
  try {
    log("Creating conversation with recipient:", params.recipientId);
    const apiParams = {
      recipientId: params.recipientId,
      initialMessage: params.initialMessage,
      propertyId: params.propertyId,
      isInquiry: params.isInquiry === true,
    };
    const data = await apiClient.post(
      API_URLS.MESSAGES.CONVERSATIONS,
      apiParams
    );
    const conversation = ((
      data as { conversation?: Conversation; data?: Conversation }
    ).conversation ||
      (data as { data?: Conversation }).data ||
      data) as Conversation;
    log(`Conversation created with ID: ${conversation?.id || "unknown"}`);
    return normalizeParticipants(conversation);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Error creating conversation:", error);
    if (
      typeof window !== "undefined" &&
      (error.message.includes("timeout") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network error"))
    ) {
      try {
        const pendingConversations = JSON.parse(
          localStorage.getItem("pendingConversations") || "[]"
        );
        pendingConversations.push({
          recipientId: params.recipientId,
          propertyId: params.propertyId,
          initialMessage: params.initialMessage,
          isInquiry: params.isInquiry,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(
          "pendingConversations",
          JSON.stringify(pendingConversations)
        );
        log("Stored conversation request locally for later retry");
      } catch {
        // Ignore storage errors
      }
    }
    return null;
  }
}

/**
 * Send a message with Socket.IO integration.
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ tempMessage: Message; messagePromise: Promise<Message | null> }> {
  if (
    !conversationId ||
    conversationId === "new" ||
    conversationId === "undefined"
  ) {
    console.error(
      `Cannot send message to invalid conversation ID: ${
        conversationId || "undefined"
      }`
    );
    throw new Error("Invalid conversation ID");
  }
  const tempId = `temp-${Date.now()}`;
  const userId = localStorage.getItem("userId") || "";
  const userName = localStorage.getItem("userName") || "You";
  const userAvatar = localStorage.getItem("userAvatar") || null;
  const tempMessage: Message = {
    id: tempId,
    conversationId,
    senderId: userId,
    content,
    isRead: false,
    sentAt: new Date().toISOString(),
    readAt: null,
    sender: { id: userId, name: userName, avatarUrl: userAvatar },
    pending: true,
  };
  const messagePromise = _sendMessageToServer(conversationId, content);
  return { tempMessage, messagePromise };
}

/**
 * Private function to send message to server.
 */
async function _sendMessageToServer(
  conversationId: string,
  content: string
): Promise<Message | null> {
  try {
    log(`Sending message to conversation ${conversationId}`);
    const endpoint = `${API_URLS.MESSAGES.CONVERSATIONS}/${conversationId}/messages`;
    const data = await apiClient.post(endpoint, { content });

    // Properly type the response data with TypeScript assertions
    const responseData = data as {
      message?: Message;
      data?: Message;
    };

    // Now safely access properties with type checking
    const message =
      responseData.message || responseData.data || (data as Message);

    log(`Message sent to conversation: ${conversationId}`);
    return message;
  } catch (error) {
    console.error(
      `Error sending message to conversation ${conversationId}:`,
      error
    );
    return null;
  }
}

/**
 * Mark conversation as read.
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<boolean> {
  if (
    !conversationId ||
    conversationId === "new" ||
    conversationId === "undefined"
  ) {
    log(
      `Cannot mark invalid conversation ID as read: ${
        conversationId || "undefined"
      }`
    );
    return true;
  }
  try {
    log(`Marking conversation as read: ${conversationId}`);
    const endpoint = `${API_URLS.MESSAGES.CONVERSATIONS}/${conversationId}/read`;
    const data = await apiClient.post(endpoint, {});
    log(`Conversation marked as read: ${conversationId}`);
    return (data as { success?: boolean }).success ?? true;
  } catch (error) {
    console.error(
      `Error marking conversation ${conversationId} as read:`,
      error
    );
    return false;
  }
}

/**
 * Archive a conversation.
 */
export async function archiveConversation(
  conversationId: string
): Promise<boolean> {
  if (
    !conversationId ||
    conversationId === "new" ||
    conversationId === "undefined"
  ) {
    log(
      `Cannot archive invalid conversation ID: ${conversationId || "undefined"}`
    );
    return true;
  }
  try {
    log(`Archiving conversation: ${conversationId}`);
    const endpoint = `${API_URLS.MESSAGES.CONVERSATIONS}/${conversationId}/archive`;
    const data = await apiClient.post(endpoint, {});
    log(`Conversation archived: ${conversationId}`);
    return (data as { success?: boolean }).success ?? true;
  } catch (error) {
    console.error(`Error archiving conversation ${conversationId}:`, error);
    return false;
  }
}

/**
 * Get unread message count.
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  try {
    log("Getting unread count");
    const data = await apiClient.get(API_URLS.MESSAGES.UNREAD);
    const unreadCount = (data as { count?: number }).count || 0;
    log(`Unread message count: ${unreadCount}`);
    return { count: unreadCount };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { count: 0 };
  }
}

/**
 * Define the special inquiry type that extends Conversation.
 */
export interface Inquiry extends Conversation {
  inquiryStatus: "NEW" | "RESPONDED" | "CLOSED";
}

/**
 * Updates the status of a conversation with local storage fallback.
 */
export async function updateConversationStatus(
  conversationId: string,
  status: "NEW" | "RESPONDED" | "CLOSED"
): Promise<Conversation | null> {
  if (!conversationId || conversationId === "undefined") {
    log(
      `Cannot update status for invalid conversation ID: ${
        conversationId || "undefined"
      }`
    );
    return null;
  }
  try {
    const inquiryStatusesStr = localStorage.getItem("inquiryStatuses") || "{}";
    const inquiryStatuses: Record<string, string> =
      JSON.parse(inquiryStatusesStr);
    inquiryStatuses[conversationId] = status;
    localStorage.setItem("inquiryStatuses", JSON.stringify(inquiryStatuses));
    log(
      `Saved status to local storage - ID: ${conversationId}, status: ${status}`
    );
  } catch {
    // Ignore storage errors
  }
  try {
    log(`Updating conversation ${conversationId} status to ${status}`);
    const endpoint = `${API_URLS.MESSAGES.CONVERSATIONS}/${conversationId}/status`;
    const response = await apiClient.put(endpoint, { status, isInquiry: true });
    log(
      "Conversation status updated successfully on server:",
      conversationId,
      status
    );

    // Fix TypeScript error by explicitly typing the response
    const responseData = response as { data?: Conversation };
    const conversation = responseData.data || (response as Conversation);

    return normalizeParticipants(conversation);
  } catch {
    log(
      `Server update failed for conversation ${conversationId} - using local storage fallback`
    );
    try {
      log(`Trying fallback inquiry status update for ${conversationId}`);
      const inquiryUrl = `/inquiries/${conversationId}/status`;
      try {
        await apiClient.post(inquiryUrl, { status });
        log("Used inquiry endpoint as fallback for status update");
      } catch {
        log("Fallback inquiry status update also failed");
      }
    } catch {
      log("Error in fallback logic");
    }
    return {
      id: conversationId,
      participants: [],
      unreadCount: 0,
      inquiryStatus: status,
    } as unknown as Conversation;
  }
}

/**
 * Create a property inquiry with fallback mechanism.
 */
export async function createPropertyInquiry(
  propertyId: string,
  recipientId: string,
  message: string
): Promise<unknown> {
  if (!propertyId || !recipientId) {
    log("Invalid property ID or recipient ID for inquiry");
    return null;
  }
  log(
    `Creating property inquiry for property: ${propertyId}, recipient: ${recipientId}`
  );
  try {
    log("Using conversations endpoint for inquiry");
    const data = await apiClient.post(API_URLS.MESSAGES.CONVERSATIONS, {
      recipientId,
      propertyId,
      initialMessage: message,
      isInquiry: true,
    });
    const result = (data as { data?: unknown }).data || data;
    log(
      `Created inquiry via conversation endpoint for property: ${propertyId}`
    );
    return result;
  } catch (error) {
    console.error("Error creating property inquiry:", error);
    if (typeof window !== "undefined") {
      try {
        const pendingConversations = JSON.parse(
          localStorage.getItem("pendingConversations") || "[]"
        );
        pendingConversations.push({
          propertyId,
          recipientId,
          message,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(
          "pendingConversations",
          JSON.stringify(pendingConversations)
        );
        log("Stored inquiry locally for later retry");
      } catch (storageError) {
        console.error("Failed to store inquiry locally:", storageError);
      }
    }
    return null;
  }
}

/**
 * Get filtered conversations (for messages/inquiries tabs).
 */
export async function getFilteredConversations(params: {
  isInquiry?: boolean;
  status?: "NEW" | "RESPONDED" | "CLOSED";
  propertyId?: string;
  limit?: number;
  offset?: number;
}): Promise<Inquiry[]> {
  try {
    log("Fetching filtered conversations");
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const endpoint = `${API_URLS.MESSAGES.CONVERSATIONS}${
      queryString ? `?${queryString}` : ""
    }`;
    log(`Calling API endpoint: ${endpoint}`);
    const data = await apiClient.get(endpoint);
    log("API response received:", data);
    const conversations = ((
      data as { conversations?: unknown[]; data?: unknown[] }
    ).conversations ||
      (data as { data?: unknown[] }).data ||
      data) as Array<Conversation | Record<string, unknown>>;
    log(
      `Retrieved ${
        Array.isArray(conversations) ? conversations.length : 0
      } filtered conversations`
    );
    let savedStatuses: Record<string, string> = {};
    try {
      const savedStatusesStr = localStorage.getItem("inquiryStatuses");
      if (savedStatusesStr) {
        savedStatuses = JSON.parse(savedStatusesStr);
      }
    } catch {
      // Ignore storage errors
    }
    const updatedConversations = conversations.map((conversation) => {
      const convId = (conversation as Record<string, unknown>).id as string;
      const savedStatus = savedStatuses[convId];
      if (savedStatus) {
        return { ...conversation, inquiryStatus: savedStatus };
      }
      return {
        ...conversation,
        inquiryStatus:
          ((conversation as Record<string, unknown>).inquiryStatus as string) ||
          "NEW",
      };
    });
    let filteredConversations = updatedConversations;
    if (params.status && Object.keys(savedStatuses).length > 0) {
      filteredConversations = updatedConversations.filter(
        (conv: Record<string, unknown>) => conv.inquiryStatus === params.status
      );
    }
    return normalizeConversations(filteredConversations) as Inquiry[];
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Error fetching filtered conversations:", error);
    return [];
  }
}

/**
 * Get inquiry statistics with better error handling for missing endpoints.
 */
export async function getInquiryStats(): Promise<{
  total: number;
  new: number;
  responded: number;
  closed: number;
}> {
  const defaultStats = { total: 0, new: 0, responded: 0, closed: 0 };
  try {
    log("Getting inquiry stats");
    const endpoint = `/messages/inquiries/stats`;
    const data = await apiClient.get(endpoint);
    const stats = (data as { data?: unknown }).data || data || defaultStats;
    return stats as {
      total: number;
      new: number;
      responded: number;
      closed: number;
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Error fetching inquiry stats:", error);
    if (
      (error as { message?: string }).message?.includes("Endpoint not found")
    ) {
      log(
        "Inquiry stats endpoint not available, attempting to calculate from conversations"
      );
      try {
        const inquiryConversations = await getFilteredConversations({
          isInquiry: true,
        });
        let newCount = 0,
          respondedCount = 0,
          closedCount = 0;
        inquiryConversations.forEach((conv) => {
          if (conv.inquiryStatus === "NEW") newCount++;
          else if (conv.inquiryStatus === "RESPONDED") respondedCount++;
          else if (conv.inquiryStatus === "CLOSED") closedCount++;
        });
        return {
          total: inquiryConversations.length,
          new: newCount,
          responded: respondedCount,
          closed: closedCount,
        };
      } catch (calcError) {
        console.warn(
          "Failed to calculate inquiry stats from conversations:",
          calcError
        );
      }
    }
    return defaultStats;
  }
}

/**
 * Helper function to retry pending operations.
 */
export async function retryPendingOperations(): Promise<{
  succeeded: number;
  failed: number;
}> {
  if (typeof window === "undefined") return { succeeded: 0, failed: 0 };
  const results = { succeeded: 0, failed: 0 };
  try {
    const pendingInquiries = JSON.parse(
      localStorage.getItem("pendingInquiries") || "[]"
    );
    if (pendingInquiries.length > 0) {
      log(`Retrying ${pendingInquiries.length} pending inquiries`);
      const newPendingList = [];
      for (const inquiry of pendingInquiries) {
        try {
          await createConversation({
            recipientId: inquiry.recipientId,
            propertyId: inquiry.propertyId,
            initialMessage: inquiry.message,
            isInquiry: true,
          });
          results.succeeded++;
        } catch {
          results.failed++;
          const timestamp = new Date(inquiry.timestamp || Date.now());
          const ageHours =
            (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
          if (ageHours < 24) {
            newPendingList.push(inquiry);
          }
        }
      }
      localStorage.setItem("pendingInquiries", JSON.stringify(newPendingList));
    }
    const pendingConversations = JSON.parse(
      localStorage.getItem("pendingConversations") || "[]"
    );
    if (pendingConversations.length > 0) {
      log(`Retrying ${pendingConversations.length} pending conversations`);
      const newPendingList = [];
      for (const conversation of pendingConversations) {
        try {
          await createConversation(conversation);
          results.succeeded++;
        } catch {
          results.failed++;
          const timestamp = new Date(conversation.timestamp || Date.now());
          const ageHours =
            (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
          if (ageHours < 24) {
            newPendingList.push(conversation);
          }
        }
      }
      localStorage.setItem(
        "pendingConversations",
        JSON.stringify(newPendingList)
      );
    }
  } catch (e) {
    console.error("Error retrying pending operations:", e);
  }
  return results;
}

/**
 * Format date for messages.
 */
export function formatMessageDate(dateString: string | Date): string {
  if (!dateString) return "";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
}

// Export named functions for better TypeScript compatibility
export { normalizeParticipants, normalizeConversations };

const messageClient = {
  getConversations,
  getConversation,
  getMessages,
  createConversation,
  sendMessage,
  markConversationAsRead,
  archiveConversation,
  getUnreadCount,
  createPropertyInquiry,
  updateConversationStatus,
  getFilteredConversations,
  getInquiryStats,
  formatMessageDate,
  retryPendingOperations,
  normalizeParticipants,
  normalizeConversations,
};

export default messageClient;
