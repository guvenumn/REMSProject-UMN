// File: /frontend/src/utils/userClient.ts
import apiClient from "./apiClient";
import { getAccessToken } from "./authClient";
import type { User, UserRole } from "../types/user";

// Re-export the types
export type { User, UserRole };

// Define ApiRequestData type to fix typing issues with apiClient
export type ApiRequestData = Record<string, unknown>;

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  removeAvatar?: boolean;
  active?: boolean; // Added active field
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Define a type for API response that includes all possible response formats
// We're making this separate from ApiResponse instead of extending it to fix the TypeScript error
export interface ApiResponseWithExtras<T> {
  success?: boolean;
  message?: string;
  data?: T;
  user?: User;
  [key: string]: unknown;
}

/**
 * Handle API errors consistently
 */
function handleApiError(operation: string, error: unknown): never {
  console.error(`Error ${operation}:`, error);

  // If the error is already a processed API error, just rethrow it
  if (error instanceof Error && error.message.startsWith("API Error:")) {
    throw error;
  }

  // Otherwise, create a more user-friendly error message
  const errorMessage =
    error instanceof Error ? error.message : `Failed to ${operation}`;
  throw new Error(`API Error: ${errorMessage}`);
}

/**
 * Extract user data from various API response formats
 */
function extractUserData(response: unknown): User[] {
  console.log("Extracting user data from response:", response);

  if (!response) {
    return [];
  }

  // Response is already an array of users
  if (Array.isArray(response)) {
    return response;
  }

  // Type guard to check if response is an object
  if (typeof response === "object" && response !== null) {
    const responseObj = response as Record<string, unknown>;

    // Response has a data property
    if (responseObj.data) {
      if (Array.isArray(responseObj.data)) {
        return responseObj.data as User[];
      }

      // Response has a nested users array
      if (
        typeof responseObj.data === "object" &&
        responseObj.data !== null &&
        "users" in responseObj.data &&
        Array.isArray((responseObj.data as Record<string, unknown>).users)
      ) {
        return (responseObj.data as Record<string, unknown>).users as User[];
      }
    }

    // Response has a users property
    if ("users" in responseObj && Array.isArray(responseObj.users)) {
      return responseObj.users as User[];
    }

    // Check for any array property that might contain users
    for (const key in responseObj) {
      if (
        Array.isArray(responseObj[key]) &&
        responseObj[key] &&
        (responseObj[key] as unknown[]).length > 0
      ) {
        const firstItem = (responseObj[key] as unknown[])[0];

        if (
          typeof firstItem === "object" &&
          firstItem !== null &&
          "id" in firstItem &&
          "email" in firstItem
        ) {
          return responseObj[key] as User[];
        }
      }
    }
  }

  console.warn("Could not extract user data from response:", response);
  return [];
}

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<User[]> {
  try {
    console.log("[userClient] Getting users");
    console.log("[userClient] Auth token exists:", !!getAccessToken());

    const response = await apiClient.get("/users");
    console.log("[userClient] Users response:", response);

    // Extract users from whatever format the API returns
    return extractUserData(response);
  } catch (error) {
    console.error("[userClient] Error fetching users:", error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const response = await apiClient.get(`/users/${id}`);
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      return (response as { data: User }).data;
    }
    return response as User;
  } catch (error) {
    return handleApiError(`fetching user ${id}`, error);
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    // Convert to ApiRequestData to satisfy TypeScript
    const requestData: ApiRequestData = { ...userData };

    const response = await apiClient.post("/users", requestData);

    // Handle different response formats with type checking
    if (typeof response === "object" && response !== null) {
      const typedResponse = response as Record<string, unknown>;

      // Check for success flag
      if ("success" in typedResponse && typedResponse.success === false) {
        throw new Error(
          (typedResponse.message as string) || "Failed to create user"
        );
      }

      // Check for data property
      if (
        "data" in typedResponse &&
        typedResponse.data !== null &&
        typeof typedResponse.data === "object"
      ) {
        return typedResponse.data as User;
      }

      // Check for user property
      if (
        "user" in typedResponse &&
        typedResponse.user !== null &&
        typeof typedResponse.user === "object"
      ) {
        return typedResponse.user as User;
      }
    }

    throw new Error("Invalid response format from create user API");
  } catch (error) {
    return handleApiError("creating user", error);
  }
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: string,
  userData: UpdateUserRequest
): Promise<User> {
  try {
    // Convert to ApiRequestData to satisfy TypeScript
    const requestData: ApiRequestData = { ...userData };

    const response = await apiClient.put(`/users/${id}`, requestData);

    // Handle different response formats with type checking
    if (typeof response === "object" && response !== null) {
      const typedResponse = response as Record<string, unknown>;

      // Check for success flag
      if ("success" in typedResponse && typedResponse.success === false) {
        throw new Error(
          (typedResponse.message as string) || `Failed to update user ${id}`
        );
      }

      // Check for data property
      if (
        "data" in typedResponse &&
        typedResponse.data !== null &&
        typeof typedResponse.data === "object"
      ) {
        return typedResponse.data as User;
      }

      // Check for user property
      if (
        "user" in typedResponse &&
        typedResponse.user !== null &&
        typeof typedResponse.user === "object"
      ) {
        return typedResponse.user as User;
      }
    }

    throw new Error("Invalid response format from update user API");
  } catch (error) {
    return handleApiError(`updating user ${id}`, error);
  }
}

/**
 * Toggle user active status (enable/disable user)
 */
export async function toggleUserStatus(
  id: string,
  active: boolean
): Promise<User> {
  try {
    const response = await apiClient.put(`/users/${id}/toggle-status`, {
      active,
    } as ApiRequestData);

    // Handle different response formats with type checking
    if (typeof response === "object" && response !== null) {
      const typedResponse = response as Record<string, unknown>;

      // Check for success flag
      if ("success" in typedResponse && typedResponse.success === false) {
        throw new Error(
          (typedResponse.message as string) ||
            `Failed to toggle status for user ${id}`
        );
      }

      // Check for data property
      if (
        "data" in typedResponse &&
        typedResponse.data !== null &&
        typeof typedResponse.data === "object"
      ) {
        return typedResponse.data as User;
      }

      // Check for user property
      if (
        "user" in typedResponse &&
        typedResponse.user !== null &&
        typeof typedResponse.user === "object"
      ) {
        return typedResponse.user as User;
      }
    }

    throw new Error("Invalid response format from toggle user status API");
  } catch (error) {
    return handleApiError(`toggling status for user ${id}`, error);
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/users/${id}`);
    return true;
  } catch (error) {
    console.error(`[userClient] Error deleting user ${id}:`, error);
    return false;
  }
}

/**
 * Change user password (for current user)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    await apiClient.put("/user/password", {
      currentPassword,
      newPassword,
    } as ApiRequestData);
    return true;
  } catch (error) {
    return handleApiError("changing password", error);
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<User> {
  try {
    const response = await apiClient.get("/user/profile");
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      return (response as { data: User }).data;
    }
    return response as User;
  } catch (error) {
    return handleApiError("fetching user profile", error);
  }
}

/**
 * Update current user profile
 */
export async function updateUserProfile(
  userData: Omit<UpdateUserRequest, "role">
): Promise<User> {
  try {
    // Convert to ApiRequestData to satisfy TypeScript
    const requestData: ApiRequestData = { ...userData };

    const response = await apiClient.put("/user/profile", requestData);
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      return (response as { data: User }).data;
    }
    return response as User;
  } catch (error) {
    return handleApiError("updating user profile", error);
  }
}

/**
 * Upload avatar for current user
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiClient.postFormData("/user/avatar", formData);

    if (typeof response === "object" && response !== null) {
      const typedResponse = response as Record<string, unknown>;

      if (
        "success" in typedResponse &&
        typedResponse.success === true &&
        "data" in typedResponse &&
        typeof typedResponse.data === "object" &&
        typedResponse.data !== null
      ) {
        const dataObj = typedResponse.data as Record<string, unknown>;
        if ("avatarUrl" in dataObj && typeof dataObj.avatarUrl === "string") {
          return dataObj.avatarUrl;
        }
      }
    }

    throw new Error("Failed to upload avatar");
  } catch (error) {
    return handleApiError("uploading avatar", error);
  }
}

// Export as a named object rather than anonymous default export
export const userClient = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePassword,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
};

// Export for legacy compatibility
export default userClient;
