// file: /frontend/src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET all users
export async function GET(request: NextRequest) {
  try {
    console.log("API /users GET route called");

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

    // Forward the request to the backend API
    console.log("Forwarding request to backend for all users");

    const response = await fetch("http://127.0.0.1:3002/api/users", {
      headers: {
        Authorization: authHeader,
      },
    });

    console.log("Backend response status:", response.status);

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

    if (!response.ok) {
      console.log("Backend response not OK:", response.status);
      return NextResponse.json(
        { message: data.message || data.error || "Failed to fetch users" },
        { status: response.status }
      );
    }

    console.log(
      `Returning successful response with ${data.data?.length || 0} users`
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /users route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    console.log("API /users POST route called");

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

    // Get request body
    const body = await request.json();
    console.log("User creation request body:", body);

    // Forward the request to the backend API
    console.log("Forwarding user creation request to backend");

    const response = await fetch("http://127.0.0.1:3002/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", response.status);

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

    if (!response.ok) {
      console.log("Backend response not OK:", response.status);
      return NextResponse.json(
        { message: data.message || data.error || "Failed to create user" },
        { status: response.status }
      );
    }

    console.log("Returning successful user creation response");
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /users route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
