// src/utils/authClient.ts

/**
 * Get the stored access token (Use this function name to be consistent with the API client)
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

/**
 * Alias for getAuthToken (for backward compatibility)
 */
export const getAccessToken = (): string | null => {
  return getAuthToken();
};

/**
 * Get the stored refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

/**
 * Store authentication tokens
 */
export const storeTokens = (
  accessToken: string,
  refreshToken?: string
): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    // For debugging purposes
    console.log("Tokens stored successfully");
  } catch (error) {
    console.error("Error storing tokens:", error);
  }
};

/**
 * Clear stored tokens
 */
export const clearTokens = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // For debugging purposes
    console.log("Tokens cleared successfully");
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
};

/**
 * Refresh the access token
 */
export const refreshToken = async (): Promise<boolean> => {
  const refreshTokenValue = getRefreshToken();

  if (!refreshTokenValue) {
    return false;
  }

  try {
    // Currently our app doesn't have a refresh token endpoint implemented
    // This is a placeholder for when it's implemented
    /*
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
      
      if (response.ok) {
        const data = await response.json();
        storeTokens(data.token, data.refreshToken);
        return true;
      }
      */

    // For now, just return false as we can't refresh
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    return false;
  }
};

/**
 * Log in a user
 */
export const login = async (
  email: string,
  password: string
): Promise<{ token: string; user: any }> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  const data = await response.json();

  if (data.success && data.data) {
    storeTokens(data.data.token);
    return data.data;
  }

  throw new Error("Invalid response format");
};

/**
 * Register a new user
 */
export const register = async (
  name: string,
  email: string,
  password: string
): Promise<void> => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearTokens();
  }
};

/**
 * Get the current user's information
 */
export const getCurrentUser = async (): Promise<any> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  const result = await response.json();
  return result.data;
};

export default {
  getAuthToken,
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
  refreshToken,
  login,
  register,
  logout,
  getCurrentUser,
};
