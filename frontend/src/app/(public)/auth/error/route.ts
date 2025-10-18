import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");

  return NextResponse.redirect(
    `${
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
    }/landing?error=${error || "authentication_failed"}`
  );
}
