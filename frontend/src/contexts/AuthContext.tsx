// Path: /frontend/src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

// Create context with default values to prevent undefined errors
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  checkAuth: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

// Debug flag
const ENABLE_DEBUG = true;
const debug = (...args: any[]) => {
  if (ENABLE_DEBUG) {
    console.log("[AuthContext]", ...args);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Track client-side mounting to help with hydration
  useEffect(() => {
    debug("Component mounted");
    setMounted(true);
  }, []);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      if (mounted && !authChecked) {
        debug("Initializing auth check");
        await checkAuth();
        setAuthChecked(true);
      }
    };

    initAuth();
  }, [mounted, authChecked]);

  // Helper function to safely access localStorage
  const safelyGetFromLocalStorage = (key: string) => {
    if (typeof window === "undefined") return null;

    try {
      const value = localStorage.getItem(key);
      debug(`Retrieved ${key} from localStorage:`, !!value);
      return value;
    } catch (err) {
      debug(`Error accessing localStorage for key: ${key}`, err);
      return null;
    }
  };

  // Helper function to safely set localStorage
  const safelySetToLocalStorage = (key: string, value: string) => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.setItem(key, value);
      debug(`Set ${key} in localStorage`);
      return true;
    } catch (err) {
      debug(`Error setting localStorage for key: ${key}`, err);
      return false;
    }
  };

  // Helper function to safely remove from localStorage
  const safelyRemoveFromLocalStorage = (key: string) => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.removeItem(key);
      debug(`Removed ${key} from localStorage`);
      return true;
    } catch (err) {
      debug(`Error removing localStorage for key: ${key}`, err);
      return false;
    }
  };

  const checkAuth = async () => {
    debug("Starting auth check");
    setIsLoading(true);
    try {
      // Only access localStorage on the client
      if (typeof window !== "undefined") {
        // Check token in localStorage
        const token = safelyGetFromLocalStorage("token");
        debug("Auth check - token found:", !!token);

        if (token) {
          try {
            // Verify token validity with backend
            debug("Auth check - validating token with API");
            const response = await fetch("/api/auth/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            debug("Auth check - API response status:", response.status);

            if (response.ok) {
              const result = await response.json();
              debug("Auth check - API response data:", result);

              if (result.data) {
                debug("Auth check - valid user data returned from API");
                setUser(result.data);
                return; // Successfully authenticated
              } else {
                debug("Auth check - no user data in response");
              }
            } else {
              debug("Auth check - API response not OK:", response.status);
            }

            // Token invalid or expired
            debug("Auth check - token invalid, clearing auth data");
            safelyRemoveFromLocalStorage("token");
            safelyRemoveFromLocalStorage("user");
            setUser(null);
          } catch (error) {
            debug("API error during auth check:", error);
            safelyRemoveFromLocalStorage("token");
            safelyRemoveFromLocalStorage("user");
            setUser(null);
          }
        } else {
          debug("Auth check - no token found, user is not authenticated");
          setUser(null);
        }
      }
    } catch (error) {
      debug("Error checking authentication:", error);
      // Clear potentially corrupted data
      if (typeof window !== "undefined") {
        safelyRemoveFromLocalStorage("token");
        safelyRemoveFromLocalStorage("user");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
      debug("Auth check complete, isAuthenticated:", !!user);
    }
  };

  const login = async (email: string, password: string) => {
    debug(`Login attempt with email: ${email}`);
    setIsLoading(true);
    try {
      // Call the API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      debug("Login response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        debug("Login error response:", errorData);
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      debug("Login successful, received data:", data);

      if (data.success && data.data) {
        // Store token
        const tokenStored = safelySetToLocalStorage("token", data.data.token);
        debug("Token stored successfully:", tokenStored);

        // Store user data
        if (data.data.user) {
          const userData = data.data.user;
          debug("Setting user state:", userData);
          setUser(userData);

          const userStored = safelySetToLocalStorage(
            "user",
            JSON.stringify(userData)
          );
          debug("User data stored successfully:", userStored);

          // Force reload authentication state
          await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
          debug("User authenticated, returning true");
          return true;
        }
      }

      debug("Login failed, returning false");
      return false;
    } catch (error) {
      debug("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    debug("Register attempt:", userData.email);
    setIsLoading(true);
    try {
      // Call my API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        debug("Registration error response:", errorData);
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      debug("Registration successful, received data:", data);

      if (data.success && data.data) {
        // Store token and user data
        safelySetToLocalStorage("token", data.data.token);

        if (data.data.user) {
          setUser(data.data.user);
          safelySetToLocalStorage("user", JSON.stringify(data.data.user));
          return true;
        }
      }

      return false;
    } catch (error) {
      debug("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    debug("Logout attempt");
    setIsLoading(true);
    try {
      // Call my API to invalidate token
      const token = safelyGetFromLocalStorage("token");
      if (token) {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          debug("Logout API error (non-critical):", error);
        }
      }

      // Clear local storage
      safelyRemoveFromLocalStorage("user");
      safelyRemoveFromLocalStorage("token");
      setUser(null);

      // Redirect to home
      debug("Redirecting to home after logout");
      router.push("/");
    } catch (error) {
      debug("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // User profile update function
  const updateProfile = async (data: any) => {
    debug("Profile update requested with data:", data);
    setIsLoading(true);

    try {
      // Get token from localStorage
      const token = safelyGetFromLocalStorage("token");
      if (!token) {
        debug("Profile update failed: No authentication token found");
        throw new Error("Authentication required");
      }

      // Call the API to update the profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      debug("Profile update API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        debug("Profile update error response:", errorData);
        throw new Error(errorData.error || "Profile update failed");
      }

      const result = await response.json();
      debug("Profile update successful, received data:", result);

      if (result.success && result.data) {
        // Update user state with the new data
        const updatedUser = result.data;
        debug("Setting updated user state:", updatedUser);
        setUser(updatedUser);

        // Also update localStorage
        const userStored = safelySetToLocalStorage(
          "user",
          JSON.stringify(updatedUser)
        );
        debug("User data stored successfully:", userStored);

        return Promise.resolve();
      } else {
        debug("Profile update successful but no data returned:", result);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      debug("Profile update error:", error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
  };

  debug("Rendering AuthProvider, isAuthenticated:", !!user);
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
