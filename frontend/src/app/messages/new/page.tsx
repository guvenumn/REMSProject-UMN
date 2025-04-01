// Path: src/app/messages/new/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MessageComposer from "@/components/Messages/MessageComposer";
import { createConversation } from "@/utils/messageClient";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Card } from "@/components/Common/Card";

// Loading fallback component
const LoadingFallback = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-64 bg-gray-100 rounded mb-4"></div>
  </div>
);

// Component that uses useSearchParams wrapped in Suspense
const MessagePageContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get any recipient or property info from URL params safely
  const recipientId = searchParams?.get("recipientId") ?? undefined;
  const recipientName = searchParams?.get("recipientName") ?? undefined;
  const propertyId = searchParams?.get("propertyId") ?? undefined;
  const propertyTitle = searchParams?.get("propertyTitle") ?? undefined;
  const isInquiry = searchParams?.get("inquiry") === "true";

  const [error, setError] = useState<string | null>(null);
  const [apiConnectionError, setApiConnectionError] = useState<boolean>(false);

  // Handle message send with propertyId optional
  const handleSendMessage = async (
    recipientId: string,
    messageContent: string,
    propertyId?: string
  ): Promise<void> => {
    if (!user) {
      router.push("/login");
      return;
    }

    setError(null);
    setApiConnectionError(false);

    try {
      console.log("Sending message with data:", {
        recipientId,
        messageContent,
        propertyId,
        isInquiry,
      });

      // Create a new conversation with the provided details
      const response = await createConversation({
        recipientId,
        initialMessage: messageContent,
        propertyId,
        isInquiry,
      });

      console.log("Response from createConversation:", response);

      if (response && response.id) {
        // Navigate to the newly created conversation
        router.push(`/messages/${response.id}`);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error creating conversation:", errorObj);

      // Check if it's a timeout or connection error
      if (
        errorObj.message &&
        (errorObj.message.includes("timeout") ||
          errorObj.message.includes("Failed to fetch") ||
          errorObj.message.includes("Network error"))
      ) {
        setApiConnectionError(true);
        setError(
          "Cannot connect to the server. Please check your internet connection and try again later."
        );
      } else {
        setError("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link
          href="/messages"
          className="text-primary hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
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

      <h1 className="text-2xl font-bold mb-6">
        {isInquiry ? "Send Property Inquiry" : "New Message"}
      </h1>

      <Card>
        {error && (
          <div className="bg-red-50 p-4 mb-4 rounded-md text-red-600">
            {error}
          </div>
        )}

        {apiConnectionError && (
          <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md mb-4">
            <p className="font-medium text-yellow-800">
              Server connection issues detected
            </p>
            <p className="text-sm mt-1 mb-3">
              The server is currently unreachable. Your message will be saved
              locally and can be sent when the connection is restored.
            </p>
            <button
              className="text-primary hover:underline"
              onClick={() => {
                // Store message data in localStorage for retry later
                if (recipientId && propertyId) {
                  localStorage.setItem(
                    "pendingMessage",
                    JSON.stringify({
                      recipientId,
                      propertyId,
                      propertyTitle,
                      isInquiry,
                      message:
                        (
                          document.querySelector(
                            "textarea"
                          ) as HTMLTextAreaElement
                        )?.value || "",
                    })
                  );
                  router.push("/messages");
                }
              }}
            >
              Save for later
            </button>
          </div>
        )}

        <MessageComposer
          onSend={handleSendMessage}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          initialRecipientId={recipientId}
          initialRecipientName={recipientName}
          placeholder={
            isInquiry
              ? "Type your inquiry about this property..."
              : "Type your message here..."
          }
        />
      </Card>
    </>
  );
};

// Main component with Suspense boundary
export default function NewMessagePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<LoadingFallback />}>
        <MessagePageContent />
      </Suspense>
    </div>
  );
}
