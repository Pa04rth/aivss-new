// frontend/src/app/api/n8n/auth-url/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || "1";

    const response = await fetch(
      `${BACKEND_URL}/api/n8n/auth-url?user_id=${userId}`
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API/N8N/AUTH-URL] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get auth URL" },
      { status: 500 }
    );
  }
}



