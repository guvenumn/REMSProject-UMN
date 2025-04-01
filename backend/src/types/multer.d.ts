// src/types/multer.d.ts
// Create this file to define custom multer types

import { Request } from "express";
import multer from "multer";

// Extend the existing Express namespace
declare global {
  namespace Express {
    interface Multer extends multer.Multer {}
  }
}

// Define MulterFile type
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// addd FileFilterCallback if not available in th multer version
declare module "multer" {
  interface FileFilterCallback {
    (error: Error | null, acceptFile: boolean): void;
  }
}
