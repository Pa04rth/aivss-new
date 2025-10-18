import DashboardClient from "../../DashboardClient";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

async function getScanResults() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return { success: false, message: "Authentication required" };
    }

    const res = await fetch(`${BACKEND_URL}/api/results`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return { success: false, message: "Failed to fetch" };
    return res.json();
  } catch (e) {
    return { success: false, message: "Failed to connect to backend" };
  }
}

async function getScanHistory() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return [];
    }

    const res = await fetch(`${BACKEND_URL}/api/history`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function DashboardPage() {
  // Fetch data on the server before the page is rendered
  const initialScanResults = await getScanResults();
  const initialScanHistory = await getScanHistory();

  // Pass the initial data as props to the client component
  return (
    <DashboardClient
      initialScanResults={initialScanResults}
      initialScanHistory={initialScanHistory}
    />
  );
}
