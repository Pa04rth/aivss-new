import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(request: Request) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/github`, {
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
      return NextResponse.redirect(data.auth_url);
    } else {
      throw new Error(data.error || "Failed to get GitHub auth URL");
    }
  } catch (error: any) {
    console.error("GitHub auth error:", error);
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      }/landing?error=github_auth_failed`
    );
  }
}
