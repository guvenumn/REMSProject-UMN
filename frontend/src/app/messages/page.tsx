// Path: /frontend/src/app/messages/page.tsx
"use client";

import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { ConversationList, MessageThread } from "@/components/Messages";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  isCurrentUser: boolean;
}

// Mock data for conversations
const mockConversations = [
  {
    id: "1",
    name: "Elisha Carpenter",
    lastMessage: "Property inquiry about...",
    time: "12:30 PM",
    propertyId: "123",
  },
  {
    id: "2",
    name: "Aaron Zehnpfennig",
    lastMessage: "Thanks for the info...",
    time: "Yesterday",
    propertyId: "456",
  },
  {
    id: "3",
    name: "Ryo Umetani",
    lastMessage: "Is this property still available?",
    time: "Monday",
    propertyId: "789",
  },
  {
    id: "4",
    name: "Guven Yildiz",
    lastMessage: "I would like to schedule a viewing",
    time: "Feb 27",
    propertyId: "101",
  },
];

// Mock data for messages
const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      content:
        "Hi, I'm interested in scheduling a viewing for the property at 123 Wonder Street. Is it still available?",
      timestamp: "12:25 PM",
      senderId: "user1",
      isCurrentUser: false,
    },
    {
      id: "m2",
      content:
        "Sure! I can show you the property tomorrow at 2 PM or 4 PM. Which time works better for you?",
      timestamp: "12:30 PM",
      senderId: "currentUser",
      isCurrentUser: true,
    },
  ],
  "2": [
    {
      id: "m3",
      content:
        "I'm looking for information about the property on Titan Avenue.",
      timestamp: "Yesterday, 3:45 PM",
      senderId: "user2",
      isCurrentUser: false,
    },
    {
      id: "m4",
      content:
        "I've sent you all the details via email. Let me know if you need anything else!",
      timestamp: "Yesterday, 4:15 PM",
      senderId: "currentUser",
      isCurrentUser: true,
    },
    {
      id: "m5",
      content: "Thanks for the info, I'll review it and get back to you soon.",
      timestamp: "Yesterday, 4:30 PM",
      senderId: "user2",
      isCurrentUser: false,
    },
  ],
  "3": [
    {
      id: "m6",
      content: "Is the property on Kushiro area still available for viewing?",
      timestamp: "Monday, 10:00 AM",
      senderId: "user3",
      isCurrentUser: false,
    },
  ],
  "4": [
    {
      id: "m7",
      content:
        "I would like to schedule a viewing for the place on The Garden of Peace.",
      timestamp: "Oct 15, 2:30 PM",
      senderId: "user4",
      isCurrentUser: false,
    },
  ],
};

// Mock property titles
const propertyTitles: Record<string, string> = {
  "123": "123 Wonder Street",
  "456": "456 Titan Avenue",
  "789": "789 Kushiro area",
  "101": "101 The Garden of Peace",
};

export default function MessagesPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>("1");

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content);
    // In a real app,we will add the message to the state and send it to my backend
  };

  // Find the active conversation
  const activeConversation = mockConversations.find(
    (conv) => conv.id === activeConversationId
  );

  return (
    <Layout variant="default">
      <div className="container mx-auto py-8">
        <div className="h-[700px] flex rounded-lg overflow-hidden">
          {/* Left side - Conversations */}
          <div className="w-1/4 bg-white border-r border-border">
            <ConversationList
              conversations={mockConversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
            />
          </div>

          {/* Right side - Message Thread */}
          <div className="w-3/4 bg-white">
            {activeConversation ? (
              <MessageThread
                messages={mockMessages[activeConversationId] || []}
                recipientName={activeConversation.name}
                propertyTitle={
                  propertyTitles[activeConversation.propertyId || ""]
                }
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-foreground-light">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
