// File: /frontend/src/app/(auth)/login/page.tsx
"use client";

import { withSuspense } from "@/utils/withSuspense";
import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createConversation } from "@/utils/messageClient";
import LoginForm from "@/components/Auth/LoginForm";

// Define the pending inquiry interface
interface PendingInquiry {
  agentId: string;
  propertyId: string;
  propertyTitle: string;
  message: string;
}

function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pendingInquiry, setPendingInquiry] = useState<PendingInquiry | null>(
    null
  );
  const [isProcessingInquiry, setIsProcessingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Get redirect path from URL
  const redirectPath = searchParams?.get("redirect") || "/dashboard";
  const action = searchParams?.get("action") || "";

  // Check for pending inquiry in session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedInquiry = sessionStorage.getItem("pendingInquiry");
      if (storedInquiry) {
        try {
          const parsedInquiry = JSON.parse(storedInquiry) as PendingInquiry;
          console.log("Found pending inquiry:", parsedInquiry);
          setPendingInquiry(parsedInquiry);
        } catch (err) {
          console.error("Error parsing stored inquiry:", err);
          sessionStorage.removeItem("pendingInquiry");
        }
      }
    }
  }, []);

  // Process pending inquiry after login
  useEffect(() => {
    const processPendingInquiry = async () => {
      if (isAuthenticated && user && pendingInquiry && !isProcessingInquiry) {
        console.log("Processing pending inquiry for user:", user.email);
        setIsProcessingInquiry(true);

        try {
          // Skip the inquiry endpoint and go directly to conversations since inquiry endpoint may not exist
          const response = await createConversation({
            recipientId: pendingInquiry.agentId,
            propertyId: pendingInquiry.propertyId,
            initialMessage: pendingInquiry.message,
            isInquiry: true,
          });

          console.log("Inquiry created via conversation:", response);

          // Clear the stored inquiry
          sessionStorage.removeItem("pendingInquiry");

          // Redirect to conversation if we received one
          if (response && response.id) {
            router.push(`/messages/${response.id}`);
          } else {
            // Default redirect to the property page
            router.push(`/${redirectPath}`);
          }
        } catch (err) {
          console.error("Error processing inquiry after login:", err);
          setInquiryError(
            "Failed to send inquiry. Please try again from the property page."
          );
          setIsProcessingInquiry(false);

          // Still redirect to the property page
          setTimeout(() => {
            router.push(`/${redirectPath}`);
          }, 3000);
        }
      }
    };

    processPendingInquiry();
  }, [
    isAuthenticated,
    user,
    pendingInquiry,
    isProcessingInquiry,
    router,
    redirectPath,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8">
        {isProcessingInquiry ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">
              Processing your inquiry...
            </h2>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
            <p className="text-gray-600">
              Please wait while we complete your property inquiry.
            </p>
            {inquiryError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {inquiryError}
              </div>
            )}
          </div>
        ) : (
          <>
            {pendingInquiry && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-800">
                  Sign in to send your inquiry about &quot;
                  {pendingInquiry.propertyTitle}&quot;
                </p>
              </div>
            )}
            <LoginForm
              redirectTo={redirectPath}
              message={
                action === "inquiry"
                  ? "Sign in to send your property inquiry"
                  : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

export default withSuspense(LoginPage);
