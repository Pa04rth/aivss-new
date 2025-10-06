import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET() {
  // <-- Explicitly define the GET handler
  try {
    const response = await fetch(`${BACKEND_URL}/api/clear`, { method: "GET" }); // It's good practice to be explicit
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API/CLEAR] Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to clear results on backend", details: error.message },
      { status: 500 }
    );
  }
}
