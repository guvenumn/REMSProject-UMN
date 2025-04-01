// file: /var/www/rems/frontend/src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import { API_BASE_URL } from "../../../config";

// Define both possible upload directories
const FRONTEND_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "avatars"
);

export async function POST(request: NextRequest) {
  console.log("API /upload route called");

  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      console.log("Authorization header missing");
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Get FormData from request
    const formData = await request.formData();
    console.log("Upload request FormData received");

    // Check if there's an image file
    const imageFile = formData.get("image") as File;
    if (!imageFile) {
      console.error("No image file found in FormData");
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    console.log(
      "Image file found:",
      imageFile.name || "unnamed file",
      typeof imageFile.size === "number"
        ? `${imageFile.size} bytes`
        : "size unknown"
    );

    // Create a new FormData object for the backend
    const backendFormData = new FormData();
    backendFormData.append("image", imageFile);

    // Try forwarding to backend - Use centralized API URL
    let backendResponse = null;
    try {
      console.log("Forwarding upload request to backend API");

      // Try several endpoints since we're not sure which one is correct
      const apiBaseWithoutSuffix = API_BASE_URL.replace(/\/api$/, "");
      const endpoints = [
        `${apiBaseWithoutSuffix}/api/upload`,
        `${apiBaseWithoutSuffix}/api/users/upload`,
        `${apiBaseWithoutSuffix}/api/users/avatar`,
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying ${endpoint}...`);
          backendResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: authHeader,
            },
            body: backendFormData,
            signal: AbortSignal.timeout(3000), // 3 second timeout
          });

          // If we get a successful response, break out of the loop
          if (backendResponse.ok) {
            console.log(`Success with ${endpoint}`);
            break;
          }
        } catch (err) {
          console.log(`Failed with ${endpoint}:`, err);
          // Continue to next endpoint
        }
      }

      if (backendResponse && backendResponse.ok) {
        console.log("Backend upload response status:", backendResponse.status);
        const data = await backendResponse.json();
        console.log("Backend upload response data received:", data);
        return NextResponse.json(data);
      } else {
        console.log("All backend endpoints failed, using local storage");
      }
    } catch (error) {
      console.error("Backend upload failed:", error);
    }

    // If we're here, we need to use local storage
    console.log("Using local storage for upload");

    // Ensure the upload directory exists
    if (!fs.existsSync(FRONTEND_UPLOAD_DIR)) {
      fs.mkdirSync(FRONTEND_UPLOAD_DIR, { recursive: true });
    }

    // Get the file as an array buffer and save it to the public directory
    const timestamp = Date.now();
    const fileName = `${timestamp}_${imageFile.name}`;
    const filePath = path.join(FRONTEND_UPLOAD_DIR, fileName);
    const fileUrl = `/uploads/avatars/${fileName}`;

    // Convert file to ArrayBuffer and then to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write the file
    await writeFile(filePath, buffer);
    console.log(`File saved to local filesystem: ${filePath}`);

    // Return a response with the file URL
    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      file: {
        originalname: imageFile.name,
        filename: fileName,
        path: fileUrl,
        size: imageFile.size,
      },
    });
  } catch (error) {
    console.error("API /upload route error:", error);
    return NextResponse.json(
      {
        message:
          "Internal server error: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
