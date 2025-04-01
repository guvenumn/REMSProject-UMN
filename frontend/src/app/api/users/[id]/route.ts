// file: /var/www/rems/frontend/src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "../../../../config";

// GET a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log(`API /users/${userId} GET route called`);

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

    // Forward the request to the backend API using centralized API URL
    const endpoint = `${API_BASE_URL.replace(
      /\/api$/,
      ""
    )}/api/users/${userId}`;
    console.log(
      `Forwarding request to backend for user ID: ${userId}`,
      endpoint
    );

    const response = await fetch(endpoint, {
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
        // file: /var/www/rems/frontend/src/app/api/users/[id]/route.ts (continued)
        { message: data.message || data.error || "Failed to fetch user" },
        { status: response.status }
      );
    }

    console.log("Returning successful user fetch response");
    return NextResponse.json(data);
  } catch (error) {
    console.error(`API /users/${params.id} route error:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log(`API /users/${userId} PUT route called`);

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
    console.log(`User update request body for ID ${userId}:`, body);

    // Forward the request to the backend API using centralized API URL
    const endpoint = `${API_BASE_URL.replace(
      /\/api$/,
      ""
    )}/api/users/${userId}`;
    console.log(
      `Forwarding user update request to backend for ID: ${userId}`,
      endpoint
    );

    const response = await fetch(endpoint, {
      method: "PUT",
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
        { message: data.message || data.error || "Failed to update user" },
        { status: response.status }
      );
    }

    console.log("Returning successful user update response");
    return NextResponse.json(data);
  } catch (error) {
    console.error(`API /users/${params.id} route error:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log(`API /users/${userId} DELETE route called`);

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

    // Forward the request to the backend API using centralized API URL
    const endpoint = `${API_BASE_URL.replace(
      /\/api$/,
      ""
    )}/api/users/${userId}`;
    console.log(
      `Forwarding user delete request to backend for ID: ${userId}`,
      endpoint
    );

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    console.log("Backend response status:", response.status);

    // For DELETE, we might get an empty response, so handle that case
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Try to parse as JSON for other responses
    try {
      const data = await response.json();

      if (!response.ok) {
        console.log("Backend response not OK:", response.status);
        return NextResponse.json(
          { message: data.message || data.error || "Failed to delete user" },
          { status: response.status }
        );
      }

      console.log("Returning successful user delete response");
      return NextResponse.json(data);
    } catch (e) {
      // If we can't parse JSON but the response was OK, return a success
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "User deleted successfully",
        });
      }

      // Otherwise return an error
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`API /users/${params.id} route error:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
