"use client";

// file: /frontend/src/hooks/useAuth.ts
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Define User type based on the backend schema
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "USER" | "AGENT" | "ADMIN";
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: "USER" | "AGENT";
}

interface UpdateProfileData {
  name: string;
  phone?: string;
  avatarUrl?: string;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely parse JSON responses
const parseResponse = async (response: Response) => {
  try {
    // Check if content type is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    // If not JSON, get text and log it
    const text = await response.text();
    console.error("Non-JSON response:", text);
    throw new Error("Server returned an invalid response format");
  } catch (error) {
    console.error("Error parsing response:", error);
    throw new Error("Failed to parse server response");
  }
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Use Next.js API route instead of direct call
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Token invalid, clear it
            localStorage.removeItem("token");
            setUser(null);
            return;
          }

          const data = await parseResponse(response);
          setUser(data.data);
        } catch (error) {
          console.error("API request error:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Failed to authenticate");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Attempting to login with:", { email });

      // Use Next.js API route instead of direct backend call
      // Add a trailing slash to ensure proper routing
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Log the response status for debugging
      // Log more details about the response
      console.log("Login response status:", response.status);
      console.log(
        "Login response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Parse the response with error handling
      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      // Save token and user data
      localStorage.setItem("token", data.data.token);
      setUser(data.data.user);

      // Redirect based on user role
      if (data.data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.data.user.role === "AGENT") {
        router.push("/agent");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Registration failed"
        );
      }

      // Auto-login after successful registration
      localStorage.setItem("token", result.data.token);
      setUser(result.data.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);

      // Call logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Clear local storage and state
      localStorage.removeItem("token");
      setUser(null);

      // Redirect to home
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to update profile"
        );
      }

      // Update user state with new data
      setUser((prev) => (prev ? { ...prev, ...data } : null));

      return result.data;
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to send reset link"
        );
      }

      return data;
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send reset link"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to reset password"
        );
      }

      return data;
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to change password"
        );
      }

      return data;
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create context value object
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    changePassword,
  };

  // Provide the auth context using React.createElement instead of JSX
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
