// Path: /backend/src/types/uploadService.d.ts

// Since I don't have the original content, this is a template

declare module "../services/uploadService" {
  export interface UploadResult {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    path?: string;
  }

  export function uploadFile(file: Express.Multer.File): Promise<UploadResult>;

  export function deleteFile(filename: string): Promise<boolean>;
}
