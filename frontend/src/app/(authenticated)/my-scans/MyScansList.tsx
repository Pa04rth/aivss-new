"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Folder,
  Eye,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { calculateRiskScore } from "@/lib/scoring";
import ScanDetailsModal from "@/components/ScanDetailsModal";
import { authenticatedFetch } from "@/lib/auth";
import { SkeletonScanHistory } from "@/components/ui/skeleton";

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
  // Add comprehensive analysis fields
  contextualFindings?: any[];
  staticFindings?: any[];
  workflowAnalysis?: any;
  aarsAnalysis?: any;
  aivssAnalysis?: any;
  annotatedCode?: Record<string, string>;
  scanName?: string;
  scanCreated?: string;
  scanCompleted?: string;
  totalFiles?: number;
  linesOfCode?: number;
  // Add backend-calculated metrics
  totalRisks?: number;
  criticalRisks?: number;
  highRisks?: number;
  mediumRisks?: number;
  lowRisks?: number;
  // Add nested scanData field for backend response structure
  scanData?: {
    contextualFindings?: any[];
    staticFindings?: any[];
    risks?: any[];
    constraints_count?: number;
    workflowAnalysis?: any;
    aivssAnalysis?: any;
    aarsAnalysis?: any;
  };
}
interface MyScansClientProps {
  initialScanHistory?: ScanResult[];
}
export default function MyScansClient({
  initialScanHistory = [],
}: MyScansClientProps) {
  // Initialize state with props
  const [scanHistory, setScanHistory] =
    useState<ScanResult[]>(initialScanHistory);
  const [isLoading, setIsLoading] = useState(initialScanHistory.length === 0);
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
                  new Date(b.scanCompleted || b.timestamp).getTime() -
                  new Date(a.scanCompleted || a.timestamp).getTime()
              )
            : []
        );
      } else {
        console.error("Failed to fetch scan history:", response.status);
        setScanHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch scan history", error);
      setScanHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount if not provided initially
  useEffect(() => {
    if (initialScanHistory.length === 0) {
      fetchHistory();
    }
  }, [initialScanHistory.length]);

  return (
    <div className="p-8 space-y-8 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Scans</h1>
        <p className="text-gray-600 mt-2">
          View and manage your security scan history.
        </p>
      </div>

      {/* Welcome Card */}
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Folder className="w-8 h-8 text-gray-600" />
          <div>
            <h2 className="font-semibold">Welcome back!</h2>
            <p className="text-sm text-gray-600">
              You have {scanHistory.length} scan
              {scanHistory.length !== 1 ? "s" : ""} in your history.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          Database
        </span>
      </div>

      {/* Scan History List */}
      <div className="space-y-4">
        {isLoading ? (
          <SkeletonScanHistory />
        ) : scanHistory.length > 0 ? (
          scanHistory.map((scan) => {
            // Check both top-level and nested scanData structure
            const contextualFindings =
              scan.contextualFindings ||
              scan.scanData?.contextualFindings ||
              [];
            const staticFindings =
              scan.staticFindings || scan.scanData?.staticFindings || [];
            const risks = scan.risks || scan.scanData?.risks || [];

            const allRisks = [
              ...contextualFindings,
              ...staticFindings,
              ...risks,
            ];
            const { score, level, color } = calculateRiskScore(allRisks);

            return (
              <div
                key={scan.scan_id}
                className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg">
                      {scan.scanName || scan.file_path || "Security Scan"} -{" "}
                      {new Date(
                        scan.scanCompleted || scan.timestamp!
                      ).toLocaleDateString()}
                    </h3>
                    {scan.success !== false ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                        <CheckCircle size={14} /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                        <ShieldAlert size={14} /> Failed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Scan Started:{" "}
                    {new Date(
                      scan.scanCreated || scan.timestamp!
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${color} bg-opacity-10`}
                    >
                      <ShieldCheck size={14} /> {level} Risk ({score.toFixed(1)}
                      /100)
                    </span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {scan.totalRisks ||
                        allRisks.length ||
                        scan.risks_count ||
                        0}{" "}
                      vulnerabilities found
                    </span>
                  </div>
                  <Link
                    href={`/my-scans/${scan.scan_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                  >
                    <Eye size={16} /> View Report
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 text-center py-8">
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
