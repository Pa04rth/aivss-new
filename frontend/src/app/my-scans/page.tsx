// frontend/src/app/my-scans/page.tsx (New Server Component)
import MyScansClient from "./MyScansClient";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

async function getScanHistory() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Sort on the server
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

  return <MyScansClient initialScanHistory={initialScanHistory} />;
}
