import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET() {
  // <-- Explicitly define the GET handler
  try {
    const response = await fetch(`${BACKEND_URL}/api/history`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API/HISTORY] Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history from backend", details: error.message },
      { status: 500 }
    );
  }
}
