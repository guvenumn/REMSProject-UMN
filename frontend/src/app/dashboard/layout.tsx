// path: /frontend/src/app/dashboard/layout.tsx

"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Layout/Sidebar";

export default withSuspense(function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated, but only on client
  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.push("/login?redirect=/dashboard");
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  // Show loading state when we don't know auth status yet
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't show any UI if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-grow p-6">{children}</div>
    </div>
  );
});
