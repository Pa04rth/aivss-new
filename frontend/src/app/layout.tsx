import type { Metadata } from "next";

import "./globals.css";
import AppShell from "@/components/AppShell"; // <-- Import our new Client Component

// This is a Server Component, so we can export metadata
export const metadata: Metadata = {
  title: "AIVSS - Agentic Security Scanner",
  description: "A platform for securing multi-agent systems.",
};

// This is a Server Component, it has no hooks or state
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
