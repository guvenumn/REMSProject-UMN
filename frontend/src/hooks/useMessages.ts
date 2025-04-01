"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getConversations as fetchConversations,
  getConversation,
  getMessages as fetchMessages,
  sendMessage as sendMessageToApi,
  createConversation,
  markConversationAsRead,
  Message as ApiMessage,
} from "@/utils/messageClient";
import { useAuth } from "@/contexts/AuthContext";

// Define our internal Message interface that extends the API Message with additional fields
export interface Message extends Omit<ApiMessage, "sender"> {
  createdAt: string; // Make createdAt required in our internal interface
  sender?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  pending?: boolean;
}

// Define our internal Conversation interface that extends the API Conversation with additional fields
export interface Conversation {
  id: string;
  title: string | null; // Must match the messageClient.ts definition (null, not undefined)
  participants: {
    id: string;
    name: string;
    avatarUrl: string | null;
  }[];
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
  property?: {
    id: string;
    title: string;
  };
  // Add these fields that are used in the component but not in the API type
  propertyId?: string | null;
  isInquiry?: boolean;
  inquiryStatus?: "NEW" | "RESPONDED" | "CLOSED";
}

export const useMessages = (conversationId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversationsData = async () => {
      setLoading(true);
      try {
        const data = await fetchConversations();

        // Transform to the format our components expect
        const transformedConversations: Conversation[] = data.map((conv) => {
          console.log("Raw conversation data:", conv.id, conv.participants);

          const mappedParticipants = conv.participants.map((p) => {
            console.log("Processing participant:", p);
            let participantId = "";
            let participantName = "Unknown User";
            let participantAvatar: string | null = null;

            if ("userId" in p && p.userId) {
              participantId = p.userId;
            } else if ("id" in p && p.id) {
              participantId = p.id;
            }

            if ("user" in p && p.user && "name" in p.user && p.user.name) {
              participantName = p.user.name;
            } else if ("name" in p && p.name) {
              participantName = p.name;
            }

            if (
              "user" in p &&
              p.user &&
              "avatarUrl" in p.user &&
              p.user.avatarUrl
            ) {
              participantAvatar = p.user.avatarUrl;
            } else if ("avatarUrl" in p && p.avatarUrl) {
              participantAvatar = p.avatarUrl;
            }

            return {
              id: participantId,
              name: participantName,
              avatarUrl: participantAvatar,
            };
          });

          const conversation: Conversation = {
            id: conv.id,
            title: conv.title !== undefined ? conv.title : null,
            participants: mappedParticipants,
            unreadCount: conv.unreadCount || 0,
            property: conv.property,
            propertyId:
              "propertyId" in conv ? (conv.propertyId as string | null) : null,
            isInquiry:
              "isInquiry" in conv ? (conv.isInquiry as boolean) : undefined,
            inquiryStatus:
              "inquiryStatus" in conv
                ? (conv.inquiryStatus as "NEW" | "RESPONDED" | "CLOSED")
                : undefined,
          };

          if (conv.lastMessage) {
            conversation.lastMessage = {
              content: conv.lastMessage.content,
              sentAt:
                "sentAt" in conv.lastMessage
                  ? (conv.lastMessage.sentAt as string)
                  : "createdAt" in conv.lastMessage
                  ? conv.lastMessage.createdAt
                  : new Date().toISOString(),
              senderId: conv.lastMessage.senderId,
            };
          }

          return conversation;
        });

        setConversations(transformedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversationsData();
  }, [user]);

  // Load messages for a specific conversation
  useEffect(() => {
    if (!conversationId || !user) return;
    if (conversationId === "new") {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchConversationMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const conversationData = await getConversation(conversationId);

        if (conversationData) {
          console.log("Conversation data:", conversationData);

          const participants = (conversationData.participants || []).map(
            (p) => {
              let participantId = "";
              let participantName = "Unknown User";
              let participantAvatar: string | null = null;

              if ("userId" in p && p.userId !== undefined) {
                participantId = p.userId;
              } else if ("id" in p && p.id !== undefined) {
                participantId = p.id;
              }

              if ("user" in p && p.user && "name" in p.user && p.user.name) {
                participantName = p.user.name;
              } else if ("name" in p && p.name) {
                participantName = p.name;
              }

              if (
                "user" in p &&
                p.user &&
                "avatarUrl" in p.user &&
                p.user.avatarUrl
              ) {
                participantAvatar = p.user.avatarUrl;
              } else if ("avatarUrl" in p && p.avatarUrl) {
                participantAvatar = p.avatarUrl;
              }

              return {
                id: participantId,
                name: participantName,
                avatarUrl: participantAvatar,
              };
            }
          );

          const conversationObj: Conversation = {
            id: conversationData.id,
            title:
              conversationData.title !== undefined
                ? conversationData.title
                : null,
            participants,
            unreadCount: 0,
            property: conversationData.property,
          };

          if ("propertyId" in conversationData) {
            conversationObj.propertyId = conversationData.propertyId as
              | string
              | null;
          }
          if ("isInquiry" in conversationData) {
            conversationObj.isInquiry = conversationData.isInquiry as boolean;
          }
          if ("inquiryStatus" in conversationData) {
            conversationObj.inquiryStatus = conversationData.inquiryStatus as
              | "NEW"
              | "RESPONDED"
              | "CLOSED";
          }

          setCurrentConversation(conversationObj);

          const messagesData = await fetchMessages(conversationId);
          console.log("Messages data:", messagesData);

          const processedMessages: Message[] = messagesData.map((message) => {
            const createdAt =
              "createdAt" in message
                ? (message.createdAt as string)
                : "sentAt" in message
                ? message.sentAt
                : new Date().toISOString();

            const processedMessage: Message = {
              id: message.id,
              conversationId: message.conversationId,
              senderId: message.senderId,
              content: message.content,
              isRead: message.isRead,
              sentAt: message.sentAt,
              readAt: message.readAt,
              createdAt,
            };

            if (message.sender) {
              processedMessage.sender = {
                id: message.sender.id,
                name: message.sender.name || "Unknown User",
                avatarUrl: message.sender.avatarUrl || null,
              };
            }

            return processedMessage;
          });

          setMessages(processedMessages);

          await markConversationAsRead(conversationId);

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            )
          );
        } else {
          setMessages([]);
          setError("Conversation not found");
        }
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchConversationMessages();
  }, [conversationId, user]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || !user) return null;
      if (conversationId === "new") {
        setError(
          "Please create the conversation first before sending messages"
        );
        return null;
      }
      try {
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: user.id,
          content,
          isRead: true,
          sentAt: new Date().toISOString(),
          readAt: null,
          createdAt: new Date().toISOString(),
          sender: {
            id: user.id,
            name: user.name || "Me",
            avatarUrl: user.avatarUrl || null,
          },
          pending: true,
        };

        // Optimistically update UI
        setMessages((prev) => [...prev, tempMessage]);

        // Here we assume sendMessageToApi returns an object like:
        // { tempMessage: Message, messagePromise: Promise<Message | null> }
        const { messagePromise } = await sendMessageToApi(
          conversationId,
          content
        );
        const sentMessage = await messagePromise;

        if (sentMessage) {
          const newMessage: Message = {
            id: sentMessage.id,
            conversationId: sentMessage.conversationId,
            senderId: sentMessage.senderId,
            content: sentMessage.content,
            isRead: sentMessage.isRead,
            sentAt: sentMessage.sentAt,
            readAt: sentMessage.readAt,
            createdAt:
              "createdAt" in sentMessage
                ? (sentMessage.createdAt as string)
                : sentMessage.sentAt,
          };

          if (sentMessage.sender) {
            newMessage.sender = {
              id: sentMessage.sender.id,
              name: sentMessage.sender.name || "Unknown",
              avatarUrl: sentMessage.sender.avatarUrl || null,
            };
          }

          // Replace temporary message with the one returned from API
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg))
          );

          // Update conversations list with the new lastMessage
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === conversationId) {
                return {
                  ...conv,
                  lastMessage: {
                    content,
                    sentAt: new Date().toISOString(),
                    senderId: user.id,
                  },
                };
              }
              return conv;
            })
          );
        }

        return sentMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return null;
      }
    },
    [conversationId, user]
  );

  // Start a new conversation
  const startConversation = useCallback(
    async (
      recipientId: string,
      initialMessage: string,
      propertyId?: string,
      isInquiry?: boolean
    ) => {
      if (!user) return null;

      try {
        const newConversation = await createConversation({
          recipientId,
          initialMessage,
          propertyId,
          isInquiry,
        });

        if (newConversation) {
          const processedParticipants = (
            newConversation.participants || []
          ).map((p) => {
            let participantId = "";
            let participantName = "Unknown User";
            let participantAvatar: string | null = null;

            if ("userId" in p && p.userId !== undefined) {
              participantId = p.userId;
            } else if ("id" in p && p.id !== undefined) {
              participantId = p.id;
            }

            if ("user" in p && p.user && "name" in p.user && p.user.name) {
              participantName = p.user.name;
            } else if ("name" in p && p.name) {
              participantName = p.name;
            }

            if (
              "user" in p &&
              p.user &&
              "avatarUrl" in p.user &&
              p.user.avatarUrl
            ) {
              participantAvatar = p.user.avatarUrl;
            } else if ("avatarUrl" in p && p.avatarUrl) {
              participantAvatar = p.avatarUrl;
            }

            return {
              id: participantId,
              name: participantName,
              avatarUrl: participantAvatar,
            };
          });

          const transformedConversation: Conversation = {
            id: newConversation.id,
            title:
              newConversation.title !== undefined
                ? newConversation.title
                : null,
            participants: processedParticipants,
            unreadCount: 0,
            property: newConversation.property,
          };

          if ("propertyId" in newConversation) {
            transformedConversation.propertyId = newConversation.propertyId as
              | string
              | null;
          }
          if ("isInquiry" in newConversation) {
            transformedConversation.isInquiry =
              newConversation.isInquiry as boolean;
          }
          if ("inquiryStatus" in newConversation) {
            transformedConversation.inquiryStatus =
              newConversation.inquiryStatus as "NEW" | "RESPONDED" | "CLOSED";
          }

          if (newConversation.lastMessage) {
            transformedConversation.lastMessage = {
              content: newConversation.lastMessage.content,
              sentAt:
                "sentAt" in newConversation.lastMessage
                  ? (newConversation.lastMessage.sentAt as string)
                  : "createdAt" in newConversation.lastMessage
                  ? (newConversation.lastMessage.createdAt as string)
                  : new Date().toISOString(),
              senderId: newConversation.lastMessage.senderId,
            };
          }

          setConversations((prev) => [transformedConversation, ...prev]);

          return transformedConversation;
        }
        return null;
      } catch (error) {
        console.error("Error starting conversation:", error);
        setError("Failed to start conversation");
        return null;
      }
    },
    [user]
  );

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    sendMessage,
    startConversation,
  };
};

export default useMessages;
