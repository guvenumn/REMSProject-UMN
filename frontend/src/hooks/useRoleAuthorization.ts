// src/hooks/useRoleAuthorization.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type RoleType = "ADMIN" | "AGENT" | "USER";

/**
 * Hook to handle role-based authorization
 *
 * @param allowedRoles - Array of roles that are allowed to access the component
 * @param redirectPath - Path to redirect to if unauthorized (defaults to /dashboard)
 * @returns Object containing authorization state, loading state, and user
 */
export function useRoleAuthorization(
  allowedRoles: RoleType[] = ["ADMIN", "AGENT"],
  redirectPath: string = "/dashboard"
) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run authorization check when auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login with return path
        console.log("User not authenticated, redirecting to login");
        router.push(
          "/login?redirect=" + encodeURIComponent(window.location.pathname)
        );
        return;
      }

      if (user && allowedRoles.includes(user.role as RoleType)) {
        setIsAuthorized(true);
      } else {
        // User doesn't have permission, redirect to the specified path
        console.log("User lacks permission, redirecting");
        router.push(redirectPath);
      }
    }
  }, [user, isAuthenticated, isLoading, router, allowedRoles, redirectPath]);

  return {
    isAuthorized,
    isLoading: isLoading || (isAuthenticated && !isAuthorized && !user),
    user,
  };
}

export default useRoleAuthorization;
