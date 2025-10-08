// frontend/src/app/api/report/[scanId]/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(
  request: Request,
  { params }: { params: { scanId: string } }
) {
  const scanId = params.scanId;
  try {
    const response = await fetch(`${BACKEND_URL}/api/history/${scanId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch report from backend" },
      { status: 500 }
    );
  }
}
