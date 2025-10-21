import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const resolvedParams = await params;
    const scanId = resolvedParams.scanId;

    // Validate scanId
    if (!scanId || isNaN(parseInt(scanId))) {
      return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
    }

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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${BACKEND_URL}/api/history/${scanId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Scan not found" }, { status: 404 });
      }
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();

    // Add cache headers for successful responses
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        "X-Response-Time": Date.now().toString(),
      },
    });
  } catch (error: any) {
    console.error(`[API/HISTORY/${resolvedParams.scanId}] Fetch Error:`, error);

    // Handle timeout specifically
    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Request timeout - please try again",
          details: "Backend took too long to respond",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch scan from backend", details: error.message },
      { status: 500 }
    );
  }
}
