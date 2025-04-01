// Path: /backend/src/types/express/index.d.ts
// This file will be the single source of truth for Express Request extensions

import { UserRole } from "../user"; // Adjust path as needed

declare global {
  namespace Express {
    // Extend the Request interface to include our custom properties
    interface Request {
      userId?: string; // Make userId optional with ?
      userRole?: UserRole;
      user?: {
        id: string;
        email?: string;
        name?: string; // Added name for my auth middleware
        role?: UserRole;
        [key: string]: any;
      };
      file?: Express.Multer.File;
    }
  }
}

// This empty export is needed to make TypeScript treat this as a module
export {};
