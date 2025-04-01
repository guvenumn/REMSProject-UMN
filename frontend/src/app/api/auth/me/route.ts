// file: /var/www/rems/frontend/src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "../../../../config";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    console.log("API /me called, auth header present:", !!authHeader);

    if (!authHeader) {
      console.log("Authorization header missing");
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Forward the request to the backend API using centralized config
    const endpoint = `${API_BASE_URL.replace(/\/api$/, "")}/api/auth/me`;
    console.log("Forwarding request to backend:", endpoint);

    const response = await fetch(endpoint, {
      headers: {
        Authorization: authHeader,
      },
    });

    console.log("Backend /me response status:", response.status);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error("Non-JSON response:", responseText);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("Backend /me response data received");

    if (!response.ok) {
      console.log("Backend /me response not OK:", response.status);
      return NextResponse.json(
        { message: data.message || data.error || "Authentication failed" },
        { status: response.status }
      );
    }

    console.log("Returning successful /me response");
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /me route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
