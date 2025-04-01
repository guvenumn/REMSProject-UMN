// Path: /frontend/src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
// import { withSuspense } from "@/utils/withSuspense";
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
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  // Added methods
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
};

// define a proper type for profile update data
type ProfileUpdateData = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  [key: string]: unknown; // better than 'any' for additional properties
};

// create context with default values to prevent undefined errors
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  checkAuth: async () => {},
  updateProfile: async () => {},
  // add default implementations for new methods
  updatePassword: async () => {},
  resetPassword: async () => {},
  forgotPassword: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

// debug flag
const ENABLE_DEBUG = true;
// fefine type for debug arguments (avoid 'any')
const debug = (...args: unknown[]) => {
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

  // helper function to safely access localStorage
  const safelyGetFromLocalStorage = useCallback((key: string) => {
    if (typeof window === "undefined") return null;

    try {
      const value = localStorage.getItem(key);
      debug(`Retrieved ${key} from localStorage:`, !!value);
      return value;
    } catch (err) {
      debug(`Error accessing localStorage for key: ${key}`, err);
      return null;
    }
  }, []);

  // helper function to safely set localStorage
  const safelySetToLocalStorage = useCallback((key: string, value: string) => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.setItem(key, value);
      debug(`Set ${key} in localStorage`);
      return true;
    } catch (err) {
      debug(`Error setting localStorage for key: ${key}`, err);
      return false;
    }
  }, []);

  // helper function to safely remove from localStorage
  const safelyRemoveFromLocalStorage = useCallback((key: string) => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.removeItem(key);
      debug(`Removed ${key} from localStorage`);
      return true;
    } catch (err) {
      debug(`Error removing localStorage for key: ${key}`, err);
      return false;
    }
  }, []);

  // Hhlper function to get the authentication token
  const getAuthToken = useCallback(() => {
    return safelyGetFromLocalStorage("token");
  }, [safelyGetFromLocalStorage]);

  const checkAuth = useCallback(async () => {
    debug("Starting auth check");
    setIsLoading(true);
    try {
      // only access localStorage on the client
      if (typeof window !== "undefined") {
        // check token in localStorage
        const token = getAuthToken();
        debug("Auth check - token found:", !!token);

        if (token) {
          try {
            // verify token validity with backend
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
                return; // successfully authenticated
              } else {
                debug("Auth check - no user data in response");
              }
            } else {
              debug("Auth check - API response not OK:", response.status);
            }

            // token invalid or expired
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
      // clear potentially corrupted data
      if (typeof window !== "undefined") {
        safelyRemoveFromLocalStorage("token");
        safelyRemoveFromLocalStorage("user");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
      debug("Auth check complete, isAuthenticated:", !!user);
    }
  }, [getAuthToken, safelyRemoveFromLocalStorage, user]);

  // trakc client-side mounting to help with hydration
  useEffect(() => {
    debug("Component mounted");
    setMounted(true);
  }, []);

  // check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      if (mounted && !authChecked) {
        debug("Initializing auth check");
        await checkAuth();
        setAuthChecked(true);
      }
    };

    initAuth();
  }, [mounted, authChecked, checkAuth]); // asdded checkAuth to dependencies

  async function login(email: string, password: string) {
    setIsLoading(true);
    console.log("[AuthContext] Login attempt with email:", email);

    try {
      // msake sure this is using the correct API_BASE_URL
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
        // store token
        const tokenStored = safelySetToLocalStorage("token", data.data.token);
        debug("Token stored successfully:", tokenStored);

        // store user ID for socket identification
        safelySetToLocalStorage("userId", data.data.user.id);
        safelySetToLocalStorage("userName", data.data.user.name);
        if (data.data.user.avatarUrl) {
          safelySetToLocalStorage("userAvatar", data.data.user.avatarUrl);
        }

        // store user data
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
  }

  const register = async (userData: RegisterData) => {
    debug("Register attempt:", userData.email);
    setIsLoading(true);
    try {
      // Call the API
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
      // call the API to invalidate token
      const token = getAuthToken();
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

      // clea local storage
      safelyRemoveFromLocalStorage("user");
      safelyRemoveFromLocalStorage("token");
      safelyRemoveFromLocalStorage("userId");
      safelyRemoveFromLocalStorage("userName");
      safelyRemoveFromLocalStorage("userAvatar");
      setUser(null);

      // send to home
      debug("Redirecting to home after logout");
      router.push("/");
    } catch (error) {
      debug("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // usser profile update function
  const updateProfile = async (data: ProfileUpdateData) => {
    debug("Profile update requested with data:", data);
    setIsLoading(true);

    try {
      // geet token from localStorage
      const token = getAuthToken();
      if (!token) {
        debug("Profile update failed: No authentication token found");
        throw new Error("Authentication required");
      }

      // call the API to update the profile
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
        // update user state with the new data
        const updatedUser = result.data;
        debug("Setting updated user state:", updatedUser);
        setUser(updatedUser);

        // also update localStorage
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

  // New method: Update user password (when logged in)
  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    debug("Password update requested");
    setIsLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        debug("Password update failed: No authentication token found");
        throw new Error("Authentication required");
      }

      // Changed endpoint to match the backend route
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      debug("Password update API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        debug("Password update error response:", errorData);

        // Preserve specific error types for the UI to handle
        if (errorData.message === "incorrect_password") {
          throw new Error("incorrect_password");
        }

        throw new Error(errorData.message || "Password update failed");
      }

      debug("Password updated successfully");
      return Promise.resolve();
    } catch (error) {
      debug("Password update error:", error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // New method: Reset password with token (forgot password flow)
  const resetPassword = async (token: string, newPassword: string) => {
    debug("Password reset requested with token");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      debug("Password reset API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        debug("Password reset error response:", errorData);
        throw new Error(errorData.message || "Failed to reset password");
      }

      debug("Password reset successful");
      return Promise.resolve();
    } catch (error) {
      debug("Password reset error:", error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // New method: Request password reset email
  const forgotPassword = async (email: string) => {
    debug("Forgot password request for email:", email);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      debug("Forgot password API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        debug("Forgot password error response:", errorData);
        throw new Error(
          errorData.message || "Failed to send reset instructions"
        );
      }

      debug("Forgot password request successful");
      return Promise.resolve();
    } catch (error) {
      debug("Forgot password error:", error);
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
    // Added new methods
    updatePassword,
    resetPassword,
    forgotPassword,
  };

  debug("Rendering AuthProvider, isAuthenticated:", !!user);
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
