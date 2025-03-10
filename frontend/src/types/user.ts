// Path: /frontend/src/types/user.ts
export type UserRole = "USER" | "AGENT" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string; // Added email field
  phone?: string | null;
  avatarUrl?: string | null;
}
