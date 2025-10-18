// frontend/src/app/api/n8n/callback/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `http://localhost:3000?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect("http://localhost:3000?error=no_code");
    }

    // Forward to backend for token exchange
    const response = await fetch(
      `${BACKEND_URL}/api/n8n/callback?${searchParams.toString()}`
    );
    const data = await response.json();

    if (data.success) {
      return NextResponse.redirect(
        `http://localhost:3000?connected=true&connection_id=${data.connection_id}`
      );
    } else {
      return NextResponse.redirect(
        `http://localhost:3000?error=${encodeURIComponent(data.error)}`
      );
    }
  } catch (error: any) {
    console.error("[API/N8N/CALLBACK] Error:", error);
    return NextResponse.redirect(
      `http://localhost:3000?error=${encodeURIComponent("callback_failed")}`
    );
  }
}




