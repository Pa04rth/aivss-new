import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  // If no token, go to landing
  if (!authToken) {
    redirect("/landing");
  }

  // If token exists, validate it with backend
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Token is valid, go to dashboard
      redirect("/dashboard");
    } else {
      // Token is invalid, clear it and go to landing
      redirect("/landing");
    }
  } catch (error) {
    // Backend not available or other error, go to landing
    console.error("Auth validation error:", error);
    redirect("/landing");
  }
}
