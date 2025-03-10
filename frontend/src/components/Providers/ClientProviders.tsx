// src/components/Providers/ClientProviders.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { Toaster } from "react-hot-toast";

export const ClientProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        {children}
        <Toaster position="top-right" />
      </FavoritesProvider>
    </AuthProvider>
  );
};