"use client";
// Path: src/components/Property/ContactForm.tsx
import React, { useState } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "../Common/Card";
import { TextArea } from "../Common/TextArea";
import { Button } from "../Common/Button";
import { createPropertyInquiry } from "@/utils/messageClient";

interface ContactFormProps {
  propertyId: string;
  propertyTitle: string;
  agentId: string;
}

// Define the expected response structure from createPropertyInquiry
interface InquiryResponse {
  id?: string;
  conversation?: {
    id: string;
  };
}

export const ContactForm: React.FC<ContactFormProps> = ({
  propertyId,
  propertyTitle,
  agentId,
}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState(
    `Hi, I'm interested in "${propertyTitle}". Please provide more information.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      // Store in sessionStorage to retrieve after login
      sessionStorage.setItem(
        "pendingInquiry",
        JSON.stringify({
          propertyId,
          propertyTitle,
          agentId,
          message,
        })
      );

      // Redirect to login page with return URL
      router.push(`/login?redirect=properties/${propertyId}`);
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setApiError(false);

    try {
      // Handle with direct API call if available
      const response = (await createPropertyInquiry(
        propertyId,
        agentId,
        message
      )) as InquiryResponse;

      console.log("Property inquiry response:", response);

      if (response) {
        // Show success message
        setSuccess(true);

        // Navigate to conversation if we have an ID
        if (
          response.id ||
          (response.conversation && response.conversation.id)
        ) {
          // Use optional chaining to safely access response.conversation.id
          const conversationId = response.id || response.conversation?.id;
          setTimeout(() => {
            router.push(`/messages/${conversationId}`);
          }, 1500);
        } else {
          // Fallback to message parameters
          const params = new URLSearchParams({
            recipientId: agentId,
            propertyId: propertyId,
            propertyTitle: propertyTitle,
            inquiry: "true",
          });

          setTimeout(() => {
            router.push(`/messages/new?${params.toString()}`);
          }, 1500);
        }
      } else {
        throw new Error("Failed to create inquiry");
      }
    } catch (error: unknown) {
      console.error("Error sending inquiry:", error);

      // Check if it's a server connection error
      if (
        error instanceof Error &&
        error.message &&
        (error.message.includes("timeout") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network error"))
      ) {
        setApiError(true);
        setError(
          "Server connection error. You can try sending your message directly."
        );
      } else {
        setError(
          "Failed to send inquiry. Please try again or contact support."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle fallback action when API is unavailable
  const handleFallbackAction = () => {
    const params = new URLSearchParams({
      recipientId: agentId,
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      inquiry: "true",
    });

    router.push(`/messages/new?${params.toString()}`);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Contact Agent</h2>

      {success ? (
        <div className="bg-green-50 text-green-800 p-4 rounded-md">
          <p className="font-medium">Message sent successfully!</p>
          <p className="text-sm mt-1">
            The agent will contact you shortly. Redirecting to your
            conversation...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Your Message
            </label>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message to the agent..."
              required
            />
          </div>

          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
              You&apos;ll need to sign in first to contact the agent.
            </div>
          )}

          {apiError && (
            <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md text-sm">
              <p className="font-medium text-yellow-800 mb-2">
                Server connection issues detected
              </p>
              <Button
                type="button"
                onClick={handleFallbackAction}
                size="sm"
                variant="outline"
              >
                Try alternative method
              </Button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Sending..."
              : isAuthenticated
              ? "Send Message"
              : "Sign in & Send Inquiry"}
          </Button>
        </form>
      )}
    </Card>
  );
};

export default withSuspense(ContactForm);
