import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(
  request: Request,
  { params }: { params: { scanId: string } }
) {
  const scanId = params.scanId;
  console.log(`🔍 [DEBUG] Frontend API: /api/report/${scanId} called`);
  try {
    console.log(
      `🔍 [DEBUG] Frontend API: Fetching from backend ${BACKEND_URL}/api/history/${scanId}`
    );
    const response = await fetch(`${BACKEND_URL}/api/history/${scanId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(
      `🔍 [DEBUG] Frontend API: Received data for scanId ${scanId}:`,
      {
        hasContextualFindings: !!data.contextualFindings,
        hasStaticFindings: !!data.staticFindings,
        hasAivssAnalysis: !!data.aivssAnalysis,
        hasAarsAnalysis: !!data.aarsAnalysis,
        dataKeys: Object.keys(data),
      }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[API/REPORT/${scanId}] Fetch Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch report from backend" },
      { status: 500 }
    );
  }
}
