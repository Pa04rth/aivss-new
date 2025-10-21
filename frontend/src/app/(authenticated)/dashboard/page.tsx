"use client";

import DashboardClient from "../../DashboardClient";

export default function DashboardPage() {
  // No server-side data fetching - let DashboardClient handle everything
  return <DashboardClient />;
}
