import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect");

    const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.auth_url) {
      // Add redirect parameter to the auth URL if it was passed
      const authUrl = new URL(data.auth_url);
      if (redirect) {
        authUrl.searchParams.set("redirect", redirect);
      }
      return NextResponse.redirect(authUrl.toString());
    } else {
      throw new Error(data.error || "Failed to get Google auth URL");
    }
  } catch (error: any) {
    console.error("Google auth error:", error);
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      }/login?error=google_auth_failed`
    );
  }
}
