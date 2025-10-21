import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET() {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${BACKEND_URL}/api/results`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Add cache headers for successful responses
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        'X-Response-Time': Date.now().toString(),
      },
    });
  } catch (error: any) {
    console.error("[API/RESULTS] Fetch Error:", error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout - please try again", details: "Backend took too long to respond" },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch results from backend", details: error.message },
      { status: 500 }
    );
  }
}
