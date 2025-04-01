// file: /var/www/rems/frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "../../../../config";

console.log("API login route loaded");

export async function POST(request: NextRequest) {
  try {
    console.log("API login route called");

    const body = await request.json();
    console.log("Request body:", body);

    // Use centralized API URL for backend endpoints
    const loginEndpoint = `${API_BASE_URL.replace(
      /\/api$/,
      ""
    )}/api/auth/login`;
    const directLoginEndpoint = `${API_BASE_URL.replace(
      /\/api$/,
      ""
    )}/api/direct-login`;

    // Try the direct endpoint first
    console.log("Trying direct login endpoint");
    try {
      const directResponse = await fetch(directLoginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log("Direct login endpoint status:", directResponse.status);

      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log("Direct login successful!");
        return NextResponse.json(data);
      } else {
        console.log("Direct login failed, trying regular endpoint");
      }
    } catch (directError) {
      console.error("Error with direct login:", directError);
    }

    // If direct endpoint fails, try the regular endpoint
    console.log("Trying regular login endpoint");
    const response = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", response.status);

    // Get the raw text first for debugging
    const responseText = await response.text();
    console.log("Backend response:", responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("Failed to parse backend response:", err);
      return NextResponse.json(
        { message: "Invalid response from backend server" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error || "Authentication failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
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
