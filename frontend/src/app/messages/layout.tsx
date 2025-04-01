// file /var/www/rems/frontend/src/app/messages/layout.tsx
"use client";

import React from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useTheme();

  return (
    <div className="flex min-h-screen">
      {/* Conditionally render sidebar in desktop view */}
      {!isMobile && <Sidebar />}

      {/* Main content area */}
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
