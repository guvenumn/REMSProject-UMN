// file: /frontend/src/app/profile/layout.tsx
"use client";

import { withSuspense } from "@/utils/withSuspense";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileLayoutProps {
  children: ReactNode;
}

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

// Custom NavLink component
function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md"
    >
      {children}
    </Link>
  );
}

export default withSuspense(function ProfileLayout({
  children,
}: ProfileLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated, but only on client
  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  // Show loading state
  if (!isClient || isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  // Don't render anything until we know the user is authenticated
  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <nav className="space-y-1">
              <NavLink href="/profile">Profile Information</NavLink>
              <NavLink href="/profile/reset-password">Password Change</NavLink>
              {/* <NavLink href="/profile/preferences">Preferences</NavLink> */}
              <NavLink href="/profile/saved-properties">
                Saved Properties
              </NavLink>
              {/* <NavLink href="/profile/saved-searches">Saved Searches</NavLink> */}
              {user?.role === "AGENT" && (
                <NavLink href="/agent/dashboard">Agent Dashboard</NavLink>
              )}
              {user?.role === "ADMIN" && (
                <NavLink href="/admin/dashboard">Admin Dashboard</NavLink>
              )}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
});
