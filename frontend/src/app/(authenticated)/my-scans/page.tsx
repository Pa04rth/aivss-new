// frontend/src/app/(authenticated)/my-scans/page.tsx
import MyScansList from "./MyScansList"; // We renamed the client component
import { authenticatedFetch } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

async function getScanHistory() {
  try {
    const res = await authenticatedFetch(`${BACKEND_URL}/api/history`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      : [];
  } catch (e) {
    return [];
  }
}

export default async function MyScansPage() {
  const initialScanHistory = await getScanHistory();
  return <MyScansList initialScanHistory={initialScanHistory} />;
}
