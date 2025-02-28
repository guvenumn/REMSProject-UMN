// Path: frontend/src/components/Layout/Layout.tsx
import React from "react";
import { Header } from "./Header/Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { cn } from "@/utils/cn";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dashboard" | "auth" | "minimal";
  transparentHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  variant = "default",
  transparentHeader = false,
}) => {
  // Different layout variants
  const layouts = {
    // Default layout with header and footer
    default: (
      <>
        <Header transparent={transparentHeader} />
        <main
          className={cn(
            "min-h-screen",
            // Don't add top padding if header is transparent
            transparentHeader ? "" : "pt-16",
            className
          )}
        >
          {children}
        </main>
        <Footer />
      </>
    ),

    // Dashboard layout with sidebar
    dashboard: (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className={cn("flex-1 p-6", className)}>{children}</main>
          <Footer className="border-t" />
        </div>
      </div>
    ),

    // Auth layout (centered content, minimal UI)
    auth: (
      <>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className={cn("w-full max-w-md space-y-8", className)}>
            {children}
          </div>
        </div>
      </>
    ),

    // Minimal layout with just header
    minimal: (
      <>
        <Header />
        <main className={cn("min-h-screen pt-16", className)}>{children}</main>
      </>
    ),
  };

  return layouts[variant];
};

export { Layout };
