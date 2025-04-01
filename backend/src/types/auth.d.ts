// Path: /backend/src/types/auth.d.ts

import { UserRole } from "./user";

// Create a module declaration that redefines the interfaces without redeclaring the functions
declare namespace AuthTypes {
  interface AuthResult {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      phone: string | null;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    token: string;
    refreshToken?: string; // Optional
  }

  interface UserRegistrationData {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }
}

export = AuthTypes;

// Remove the module augmentation that's causing redeclaration issues
// declare module "../services/authService" {
//   export interface AuthResult {
//     user: {
//       id: string;
//       email: string;
//       name: string;
//       role: UserRole; // Use the actual UserRole type
//       phone: string | null;
//       avatarUrl: string | null;
//       createdAt: Date;
//       updatedAt: Date;
//     };
//     token: string;
//     refreshToken?: string; // Optional
//   }

//   // Update the return types of the auth functions
//   export function authenticate(
//     email: string,
//     password: string
//   ): Promise<AuthResult>;

//   export function register(userData: {
//     name: string;
//     email: string;
//     password: string;
//   }): Promise<AuthResult>;
// }
