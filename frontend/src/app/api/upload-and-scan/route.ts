// frontend/src/app/api/upload-and-scan/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function POST(request: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file found in request" },
        { status: 400 }
      );
    }

    // We need to create a new FormData to forward to the Python backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendResponse = await fetch(`${BACKEND_URL}/api/scan-from-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: backendFormData,
      // NOTE: Do not set Content-Type header manually when using FormData with fetch,
      // the browser/runtime will set it correctly with the boundary.
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { message: errorData.message || "Backend scan failed" },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API/UPLOAD-AND-SCAN] Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred", details: error.message },
      { status: 500 }
    );
  }
}
