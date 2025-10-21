import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

// This is a Server Component, so we can export metadata
export const metadata: Metadata = {
  title: "HIVE - AI Agent Security Platform",
  description:
    "Secure your multi-agent systems with comprehensive vulnerability scanning, risk assessment, and automated hardening recommendations.",
};

// This is a Server Component, it has no hooks or state
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
