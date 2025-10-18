import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  if (error) {
    // Redirect to error page
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      }/auth/error?error=${error}`
    );
  }

  if (token) {
    // Set the JWT token in an httpOnly cookie
    const response = NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      }/dashboard`
    );

    response.cookies.set("auth_token", token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  }

  // No token or error, redirect to landing page
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/landing`
  );
}
