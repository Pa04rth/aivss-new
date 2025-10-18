"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  Eye,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Link,
} from "lucide-react";
import { calculateRiskScore } from "@/lib/scoring";
import ScanDetailsModal from "@/components/ScanDetailsModal"; // We'll create this next
import { authenticatedFetch } from "@/lib/auth";

// This is the same interface from your Dashboard
interface ScanResult {
  success: boolean;
  file_path?: string;
  constraints_count?: number;
  risks_count?: number;
  constraints?: any[];
  risks?: any[];
  hardened_code?: string[];
  message?: string;
  error?: string;
  timestamp?: string;
  scan_id?: number;
}
interface MyScansClientProps {
  initialScanHistory: ScanResult[];
}
export default function MyScansClient({
  initialScanHistory,
}: MyScansClientProps) {
  // Initialize state with props
  const [scanHistory, setScanHistory] =
    useState<ScanResult[]>(initialScanHistory);
  const [isLoading, setIsLoading] = useState(false); // Not loading initially
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        // Sort scans from newest to oldest
        setScanHistory(
          Array.isArray(data)
            ? data.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
            : []
        );
      }
    } catch (error) {
      console.error("Failed to fetch scan history", error);
      setScanHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Scans</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your security scan history.
        </p>
      </div>

      {/* Welcome Card */}
      <div className="bg-card border rounded-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Folder className="w-8 h-8 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Welcome back!</h2>
            <p className="text-sm text-muted-foreground">
              You have {scanHistory.length} scan
              {scanHistory.length !== 1 ? "s" : ""} in your history.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full">
          Database
        </span>
      </div>

      {/* Scan History List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading scans...</p>
        ) : scanHistory.length > 0 ? (
          scanHistory.map((scan) => {
            const { score, level, color } = calculateRiskScore(scan.risks);

            return (
              <div key={scan.scan_id} className="bg-card border rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg">
                      {scan.file_path}'s Security Scan -{" "}
                      {new Date(scan.timestamp!).toLocaleDateString()}
                    </h3>
                    {scan.success ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                        <CheckCircle size={14} /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                        <ShieldAlert size={14} /> Failed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scan Started: {new Date(scan.timestamp!).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${color} bg-opacity-10`}
                  >
                    <ShieldCheck size={14} /> {level} Risk ({score.toFixed(1)}
                    /100)
                  </span>
                  <span className="text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full">
                    {scan.risks_count || 0} vulnerabilities found
                  </span>
                  <Link
                    href={`/my-scans/${scan.scan_id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline ml-auto"
                  >
                    <Eye size={16} /> View Report
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No scans found in your history.
          </p>
        )}
      </div>

      {/* The Modal for viewing details */}
      {selectedScan && (
        <ScanDetailsModal
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
        />
      )}
    </div>
  );
}
