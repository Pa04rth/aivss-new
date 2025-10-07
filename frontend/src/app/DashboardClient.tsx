"use client";
import ScanDetailsModal from "@/components/ScanDetailsModal";
import { useState, useEffect, useCallback } from "react";
import SystemMetrics from "@/components/SystemMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Loader2,
} from "lucide-react";

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
interface DashboardClientProps {
  initialScanResults: ScanResult | null;
  initialScanHistory: any[];
}
export default function DashboardClient({
  initialScanResults,
  initialScanHistory,
}: DashboardClientProps) {
  const [scanResults, setScanResults] = useState<ScanResult | null>(
    initialScanResults
  );
  const [scanHistory, setScanHistory] = useState<any[]>(initialScanHistory);
  const [isLoading, setIsLoading] = useState(false); // No longer loading initially
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  // Memoized fetch functions
  const fetchScanResults = useCallback(async () => {
    try {
      const response = await fetch("/api/results");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success === true) {
        setScanResults(data);
      } else {
        setScanResults(null);
      }
    } catch (error) {
      console.error("Error fetching scan results:", error);
      setScanResults(null);
    }
  }, []);

  const fetchScanHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/history");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setScanHistory(data);
      } else {
        setScanHistory([]);
      }
    } catch (error) {
      console.error("Error fetching scan history:", error);
      setScanHistory([]);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchScanResults(), fetchScanHistory()]);
    setIsLoading(false);
  }, [fetchScanResults, fetchScanHistory]);

  const handleScanClick = useCallback((scan: any) => setSelectedScan(scan), []);
  const closeSelectedScan = useCallback(() => setSelectedScan(null), []);

  const clearHistory = async () => {
    try {
      const response = await fetch("/api/clear");
      if (response.ok) {
        setScanHistory([]);
        setScanResults(null);
      }
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  // Memoized calculations
  const updatedSystemOverview = {
    totalScans: scanHistory.length,
    totalCritical: scanHistory.reduce(
      (total, scan) =>
        total +
        (scan.risks?.filter((r: any) => r.severity === "critical").length || 0),
      0
    ),
    totalMedium: scanHistory.reduce(
      (total, scan) =>
        total +
        (scan.risks?.filter((r: any) => r.severity === "medium").length || 0),
      0
    ),
    highRiskCount:
      scanResults?.risks?.filter((r: any) => r.severity === "critical")
        .length || 0,
  };

  const riskItems = scanResults?.risks?.slice(0, 3).map((risk: any) => ({
    title: risk.description,
    description: risk.impact || "Security risk detected",
    severity: risk.severity,
  })) || [
    {
      title: "No risks detected",
      description: "Run a security scan to identify potential risks",
      severity: "low",
    },
  ];

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  // Show loading spinner on initial load
  if (isLoading && !scanResults && scanHistory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg p-8 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your multi-agent system security status
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <SystemMetrics data={updatedSystemOverview} />

        <Tabs defaultValue="risk-summary">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="risk-summary">Risk Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="recent-activity" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Recent activity will be shown here.
            </p>
          </TabsContent>

          <TabsContent value="risk-summary" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Summary</CardTitle>
                <CardDescription>
                  Overview of current system risks from the latest scan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${getRiskSeverityColor(
                          item.severity
                        )}`}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {scanResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw size={16} />
                Latest Scan Results
              </CardTitle>
              <CardDescription>
                Latest security analysis from the MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanResults.success ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="font-medium">
                          {scanResults.message || "Scan completed successfully"}
                        </span>
                      </div>
                      {scanResults.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(scanResults.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          File Analyzed
                        </p>
                        <p className="text-xs text-blue-600 mt-1 truncate">
                          {scanResults.file_path}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-800">
                          Critical
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {scanResults.risks?.filter(
                            (r: any) => r.severity === "critical"
                          ).length || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">
                          Medium
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {scanResults.risks?.filter(
                            (r: any) => r.severity === "medium"
                          ).length || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Total Risks
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {scanResults.risks_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        {scanResults.constraints &&
                          scanResults.constraints.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">
                                Security Constraints:
                              </h4>
                              <ul className="space-y-2">
                                {scanResults.constraints.map(
                                  (constraint: any, index: number) => (
                                    <li
                                      key={index}
                                      className="text-sm p-2 bg-muted rounded"
                                    >
                                      {constraint.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        {scanResults.risks && scanResults.risks.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Security Risks:
                            </h4>
                            <ul className="space-y-2">
                              {scanResults.risks.map(
                                (risk: any, index: number) => (
                                  <li
                                    key={index}
                                    className="text-sm p-2 bg-red-50 rounded border border-red-200"
                                  >
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full mr-2 ${
                                        risk.severity === "critical"
                                          ? "bg-red-100 text-red-800"
                                          : risk.severity === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {risk.severity}
                                    </span>
                                    {risk.description}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {scanResults.hardened_code &&
                        scanResults.hardened_code.length > 0 && (
                          <div className="h-full flex flex-col">
                            <h4 className="font-medium mb-2">
                              Security Recommendations:
                            </h4>
                            <div
                              className="bg-gray-900 text-green-400 p-3 border rounded-md font-mono text-xs overflow-y-auto"
                              style={{ height: "400px" }}
                            >
                              <pre className="whitespace-pre-wrap">
                                {scanResults.hardened_code.join("\n")}
                              </pre>
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={16} />
                    <span>Scan failed: {scanResults.error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {scanHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw size={16} />
                    Scan History
                  </CardTitle>
                  <CardDescription>
                    Previous security scans and their results
                  </CardDescription>
                </div>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Clear all scan history"
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleScanClick(scan)}
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {scan.file_path
                            ? scan.file_path.split("/").pop()
                            : "Unknown file"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scan.timestamp
                            ? new Date(scan.timestamp).toLocaleString()
                            : "No timestamp"}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-1 text-xs rounded-full ml-2 ${
                          scan.success
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {scan.success ? "Success" : "Failed"}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {scan.risks &&
                        scan.risks.filter((r: any) => r.severity === "critical")
                          .length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            {
                              scan.risks.filter(
                                (r: any) => r.severity === "critical"
                              ).length
                            }{" "}
                            Critical
                          </span>
                        )}
                      {scan.risks &&
                        scan.risks.filter((r: any) => r.severity === "medium")
                          .length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            {
                              scan.risks.filter(
                                (r: any) => r.severity === "medium"
                              ).length
                            }{" "}
                            Medium
                          </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {scan.message || "Scan completed"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedScan && (
        <ScanDetailsModal scan={selectedScan} onClose={closeSelectedScan} />
      )}
    </div>
  );
}
