// Path: /backend/src/types/request.ts

import { Request } from "express";
import { UserRole } from "./user";

// No need to extend Express.Request here since we already did it in express/index.d.ts
// Just provide a type alias for backward compatibility
export type AuthenticatedRequest = Request;
