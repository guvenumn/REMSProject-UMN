// file: /var/www/rems/frontend/src/components/Providers/ClientProviders.tsx

"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/components/Providers/WebSocketProvider";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  return (
    <AuthProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </AuthProvider>
  );
};

export default ClientProviders;
