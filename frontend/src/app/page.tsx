import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware handles the auth check and redirects
  // This is just a fallback - middleware should catch this first
  redirect("/landing");
}
