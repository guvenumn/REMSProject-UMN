// Path: /frontend/src/utils/userClient.ts
import { fetchWithAuth, uploadFile } from "./apiClient";

// Type definitions based on your Prisma schema
export type UserRole = "USER" | "AGENT" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetchWithAuth<ApiResponse<User[]>>("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const response = await fetchWithAuth<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const response = await fetchWithAuth<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
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
    const response = await fetchWithAuth<ApiResponse<User>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await fetchWithAuth(`/users/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
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
    await fetchWithAuth("/user/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    return true;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<User> {
  try {
    const response = await fetchWithAuth<ApiResponse<User>>("/user/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

/**
 * Update current user profile
 */
export async function updateUserProfile(
  userData: Omit<UpdateUserRequest, "role">
): Promise<User> {
  try {
    const response = await fetchWithAuth<ApiResponse<User>>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Upload avatar for current user
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await uploadFile<ApiResponse<{ avatarUrl: string }>>(
      "/user/avatar",
      formData
    );

    if (response.success && response.data?.avatarUrl) {
      return response.data.avatarUrl;
    }

    throw new Error("Failed to upload avatar");
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
};
