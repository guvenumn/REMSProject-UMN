// File: /frontend/src/app/messages/[conversationId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useParams, useRouter } from "next/navigation";
import { MessageThread } from "@/components/Messages/MessageThread";
import { MessageInput } from "@/components/Messages/MessageInput";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  updateConversationStatus,
} from "@/utils/messageClient";
import { Button } from "@/components/Common/Button";
import Link from "next/link";
// import { Sidebar } from "@/components/Layout/Sidebar";
import { useWebSocket } from "@/components/Providers/WebSocketProvider";
import Image from "next/image";

// Import MessageThread component's Message type
import type { Message as MessageThreadMessage } from "@/components/Messages/MessageThread";

// Define proper types
// Use ConversationMessage to avoid conflict with MessageThread's Message type
interface ConversationMessage {
  id?: string;
  tempId?: string;
  conversationId?: string;
  content: string;
  senderId: string;
  sentAt: string; // Changed from createdAt to match MessageThread's Message type
  status?: string;
  isRead?: boolean;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface Participant {
  id: string;
  name?: string;
  avatarUrl?: string;
}

interface Property {
  id: string;
  title: string;
}

interface Conversation {
  id: string;
  participants?: Participant[];
  property?: Property;
  isInquiry?: boolean;
  inquiryStatus?: "NEW" | "RESPONDED" | "CLOSED";
}

// Define response types for the API
type MessageApiResponse =
  | ConversationMessage[]
  | {
      messages?: ConversationMessage[];
      [key: string]: unknown;
    };

// Define type for temp message with promise
interface TempMessageWithPromise {
  tempMessage: ConversationMessage;
  messagePromise: Promise<ConversationMessage | null>;
}

// Utility type to represent API response
type ApiMessageResponse = Partial<ConversationMessage> | TempMessageWithPromise;

export default withSuspense(function ConversationPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { user } = useAuth();
  const router = useRouter();
  const { socket, connected } = useWebSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Track processed message IDs to avoid duplicates
  const [processedMessageIds] = useState<Set<string>>(new Set());

  // Handle optimistic message updates for better UX - converted to useCallback
  const handleOptimisticUpdate = useCallback(
    (message: ConversationMessage | MessageThreadMessage) => {
      console.log("Handling optimistic message update:", message);

      // Check if we already have this message by ID or tempId
      const messageId = message.id || message.tempId;
      if (messageId && processedMessageIds.has(messageId)) {
        console.log("Message already processed, skipping update:", messageId);
        return;
      }

      // Add to processed IDs if it has an ID
      if (messageId) {
        processedMessageIds.add(messageId);
      }

      setMessages((prev) => {
        // Check if we already have this message
        const exists = prev.some(
          (m) =>
            (m.id && m.id === message.id) ||
            (m.tempId && message.tempId && m.tempId === message.tempId)
        );

        if (!exists) {
          console.log("Adding optimistic message to state");
          // Convert MessageThreadMessage to ConversationMessage if needed
          const conversationMessage: ConversationMessage = {
            id: message.id,
            tempId: message.tempId,
            conversationId: message.conversationId,
            content: message.content,
            senderId: message.senderId,
            sentAt:
              "sentAt" in message ? message.sentAt : new Date().toISOString(),
            isRead: "isRead" in message ? message.isRead : undefined,
            sender: "sender" in message ? message.sender : undefined,
          };
          return [...prev, conversationMessage];
        }

        return prev;
      });
    },
    [processedMessageIds]
  );

  // Fetch conversation and messages data
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!conversationId || !user) return;

      try {
        setLoading(true);

        // Get conversation details
        const conversationData = await getConversation(conversationId);
        setConversation(conversationData);

        // Get messages
        const messagesData = (await getMessages(
          conversationId
        )) as MessageApiResponse;
        // Check if messagesData is an array or an object with messages property
        let messagesArray: ConversationMessage[] = [];

        if (Array.isArray(messagesData)) {
          messagesArray = messagesData;
        } else if (messagesData && typeof messagesData === "object") {
          // Handle both messagesData.messages and any other structure
          const messages =
            "messages" in messagesData && messagesData.messages
              ? messagesData.messages
              : [];
          messagesArray = Array.isArray(messages) ? messages : [];
        }

        // Track message IDs to avoid duplicates
        messagesArray.forEach((msg: ConversationMessage) => {
          if (msg.id || msg.tempId) {
            processedMessageIds.add(msg.id || msg.tempId || "");
          }
        });

        // Transform messages to ensure they have the correct ConversationMessage structure
        const formattedMessages: ConversationMessage[] = messagesArray.map(
          (msg: ConversationMessage) => ({
            id: msg.id,
            tempId: msg.tempId,
            conversationId: msg.conversationId,
            content: msg.content,
            senderId: msg.senderId,
            sentAt: msg.sentAt || new Date().toISOString(),
            status: msg.status,
            isRead: msg.isRead,
            sender: msg.sender,
          })
        );

        setMessages(formattedMessages);

        // Mark conversation as read
        await markConversationAsRead(conversationId);
      } catch (err) {
        console.error("Error fetching conversation:", err);
        setError("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchConversationData();
  }, [conversationId, user, processedMessageIds]);

  // Listen for new real-time messages from websocket
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (
      message: ConversationMessage | MessageThreadMessage
    ) => {
      console.log("New message via socket in conversation page:", message);

      // Check if message belongs to this conversation
      if (message.conversationId && message.conversationId !== conversationId) {
        console.log("Message for different conversation, ignoring");
        return;
      }

      // Check if already processed by ID or tempId
      const messageId = message.id || message.tempId;
      if (messageId && processedMessageIds.has(messageId)) {
        console.log(
          "Message already processed, skipping socket update:",
          messageId
        );
        return;
      }

      // Add to processed IDs if it has an ID
      if (messageId) {
        processedMessageIds.add(messageId);
      }

      // Add message to the state
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (m) =>
            (m.id && m.id === message.id) ||
            (m.tempId && message.tempId && m.tempId === message.tempId)
        );

        if (!messageExists) {
          console.log("Adding NEW message to conversation page:", message);
          // Convert MessageThreadMessage to ConversationMessage if needed
          const conversationMessage: ConversationMessage = {
            id: message.id,
            tempId: message.tempId,
            conversationId: message.conversationId,
            content: message.content,
            senderId: message.senderId,
            sentAt:
              "sentAt" in message ? message.sentAt : new Date().toISOString(),
            isRead: "isRead" in message ? message.isRead : undefined,
            sender: "sender" in message ? message.sender : undefined,
          };
          return [...prevMessages, conversationMessage];
        }

        return prevMessages;
      });
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("message", handleNewMessage);
    socket.on("chatMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("message", handleNewMessage);
      socket.off("chatMessage", handleNewMessage);
    };
  }, [socket, conversationId, processedMessageIds]);

  // Handle sending a message
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !conversationId) return;

    try {
      console.log(
        `Sending message to conversation ${conversationId}: ${messageContent.substring(
          0,
          20
        )}...`
      );

      // Create a safe type-guard function to check if a response is a TempMessageWithPromise
      const isTempMessageWithPromise = (
        obj: unknown
      ): obj is TempMessageWithPromise => {
        return (
          obj !== null &&
          typeof obj === "object" &&
          "tempMessage" in (obj as Record<string, unknown>) &&
          "messagePromise" in (obj as Record<string, unknown>)
        );
      };

      const response = (await sendMessage(
        conversationId,
        messageContent
      )) as ApiMessageResponse;

      if (response) {
        // Handle different response types (could be a message or a temp message with promise)
        if (isTempMessageWithPromise(response)) {
          // Handle temporary message with promise
          if (response.tempMessage.id) {
            processedMessageIds.add(response.tempMessage.id);
          } else if (response.tempMessage.tempId) {
            processedMessageIds.add(response.tempMessage.tempId);
          }

          // Use the temp message for immediate display
          setMessages((prev) => [...prev, response.tempMessage]);

          // Wait for the actual message and update when it's available
          const actualMessage = await response.messagePromise;
          if (actualMessage && actualMessage.id) {
            processedMessageIds.add(actualMessage.id);

            // Update the temporary message with the actual one
            setMessages((prev) =>
              prev.map((msg) =>
                msg.tempId &&
                actualMessage.tempId &&
                msg.tempId === actualMessage.tempId
                  ? actualMessage
                  : msg
              )
            );
          }
        } else {
          // Regular message response - now safely typed as Partial<ConversationMessage>
          // Add message ID to processed set
          if ("id" in response && typeof response.id === "string") {
            processedMessageIds.add(response.id);
          }

          // Ensure the message has the correct type structure
          const newMessage: ConversationMessage = {
            id:
              "id" in response && typeof response.id === "string"
                ? response.id
                : undefined,
            tempId:
              "tempId" in response && typeof response.tempId === "string"
                ? response.tempId
                : undefined,
            conversationId:
              "conversationId" in response &&
              typeof response.conversationId === "string"
                ? response.conversationId
                : conversationId,
            content:
              "content" in response && typeof response.content === "string"
                ? response.content
                : messageContent,
            senderId:
              "senderId" in response && typeof response.senderId === "string"
                ? response.senderId
                : user?.id || "",
            sentAt:
              "sentAt" in response && typeof response.sentAt === "string"
                ? response.sentAt
                : "createdAt" in response &&
                  typeof (response as { createdAt: string }).createdAt ===
                    "string"
                ? (response as { createdAt: string }).createdAt
                : new Date().toISOString(),
            status:
              "status" in response && typeof response.status === "string"
                ? response.status
                : undefined,
            isRead:
              "isRead" in response && typeof response.isRead === "boolean"
                ? response.isRead
                : undefined,
            sender:
              "sender" in response &&
              response.sender &&
              typeof response.sender === "object"
                ? (response.sender as {
                    id: string;
                    name: string;
                    avatarUrl?: string;
                  })
                : undefined,
          };

          setMessages((prev) => [...prev, newMessage]);
        }

        // If this is an inquiry and currently in NEW status,
        // automatically update status to RESPONDED when agent sends a message
        if (conversation?.isInquiry && conversation?.inquiryStatus === "NEW") {
          handleStatusChange("RESPONDED");
        }
      }

      return response;
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  // Handle status change
  const handleStatusChange = async (
    newStatus: "NEW" | "RESPONDED" | "CLOSED"
  ) => {
    if (!conversationId || !conversation?.isInquiry) return;

    setStatusUpdating(true);
    try {
      const updatedConversation = await updateConversationStatus(
        conversationId,
        newStatus
      );

      if (updatedConversation) {
        setConversation({
          ...conversation,
          inquiryStatus: newStatus,
        });
        console.log(`Status updated to ${newStatus} successfully`);
      } else {
        // Even if the API call failed, update the UI for better UX
        setConversation({
          ...conversation,
          inquiryStatus: newStatus,
        });
        console.log(
          `Status may have updated to ${newStatus}, but API did not return confirmation`
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Error notification could be shown here
    } finally {
      setStatusUpdating(false);
      setStatusDropdownOpen(false);
    }
  };

  // Get the status badge style
  const getStatusBadgeClass = (status: string | undefined) => {
    switch (status) {
      case "NEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESPONDED":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get the other participant (not current user)
  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return (
      conversation.participants?.find((p: Participant) => p.id !== user.id) ||
      null
    );
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* <Sidebar /> */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-full sm:max-w-6xl">
          <div className="mb-3 sm:mb-6">
            <Link
              href="/messages"
              className="text-primary hover:underline flex items-center text-sm sm:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Messages
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-24 sm:h-32 bg-gray-200 rounded mb-4"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
              <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
              <Button
                onClick={() => router.push("/messages")}
                size="sm"
                className="sm:text-base"
              >
                Back to Messages
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow w-full overflow-hidden">
              {/* Conversation header */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full overflow-hidden mr-2 sm:mr-3 flex-shrink-0">
                    {otherParticipant?.avatarUrl && (
                      <Image
                        src={otherParticipant.avatarUrl}
                        alt={otherParticipant.name || "User"}
                        className="w-full h-full object-cover"
                        width={40}
                        height={40}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm sm:text-base truncate">
                      {otherParticipant?.name || "User"}
                    </h2>
                    {conversation?.property && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Re: {conversation.property.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                  {/* Status indicator for inquiries */}
                  {conversation?.isInquiry && (
                    <div className="relative">
                      <button
                        className={`inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-xs rounded-full ${getStatusBadgeClass(
                          conversation.inquiryStatus
                        )} ${
                          statusDropdownOpen
                            ? "ring-2 ring-offset-1 ring-primary"
                            : ""
                        }`}
                        onClick={() =>
                          setStatusDropdownOpen(!statusDropdownOpen)
                        }
                        disabled={statusUpdating}
                      >
                        <span className="truncate">
                          {conversation.inquiryStatus || "NEW"}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-3 w-3 sm:h-4 sm:w-4 ml-1 ${
                            statusUpdating ? "animate-spin" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                              statusUpdating
                                ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                : "M19 9l-7 7-7-7"
                            }
                          />
                        </svg>
                      </button>

                      {/* Status dropdown */}
                      {statusDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-36 sm:w-48 bg-white rounded-md shadow-lg z-10">
                          <div className="py-1">
                            <button
                              className={`block w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                                conversation.inquiryStatus === "NEW"
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              onClick={() => handleStatusChange("NEW")}
                              disabled={conversation.inquiryStatus === "NEW"}
                            >
                              New
                            </button>
                            <button
                              className={`block w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                                conversation.inquiryStatus === "RESPONDED"
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              onClick={() => handleStatusChange("RESPONDED")}
                              disabled={
                                conversation.inquiryStatus === "RESPONDED"
                              }
                            >
                              Responded
                            </button>
                            <button
                              className={`block w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                                conversation.inquiryStatus === "CLOSED"
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              onClick={() => handleStatusChange("CLOSED")}
                              disabled={conversation.inquiryStatus === "CLOSED"}
                            >
                              Closed
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WebSocket connection indicator */}
                  {connected ? (
                    <span className="text-green-600 flex items-center text-xs">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                      <span className="hidden sm:inline">Connected</span>
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center text-xs">
                      <span className="w-2 h-2 bg-red-600 rounded-full mr-1"></span>
                      <span className="hidden sm:inline">Not Connected</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Message thread */}
              <div className="h-[350px] sm:h-[500px] overflow-y-auto w-full">
                <MessageThread
                  messages={messages.map((msg) => ({
                    id: msg.id || "",
                    tempId: msg.tempId,
                    content: msg.content,
                    senderId: msg.senderId,
                    sentAt: msg.sentAt,
                    isRead: msg.isRead,
                    conversationId: msg.conversationId,
                    sender: msg.sender,
                  }))}
                  currentUserId={user?.id || ""}
                  otherUser={{
                    id: otherParticipant?.id || "",
                    name: otherParticipant?.name || "User",
                    profileImage: otherParticipant?.avatarUrl,
                  }}
                  conversationId={conversationId}
                  loading={loading}
                  onMessageReceived={handleOptimisticUpdate}
                />
              </div>

              {/* Message input */}
              <div className="border-t w-full">
                <MessageInput
                  conversationId={conversationId}
                  onSendMessage={handleSendMessage}
                  placeholder={
                    conversation?.isInquiry
                      ? "Reply to this inquiry..."
                      : "Type a message..."
                  }
                  onOptimisticUpdate={handleOptimisticUpdate}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
