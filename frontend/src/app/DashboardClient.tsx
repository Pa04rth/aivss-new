"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Loader2,
  ShieldAlert,
  TrendingUp,
  BarChart,
  Wifi,
  CheckCircle,
  Eye,
  Power,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/auth";
import { FullScanReport } from "@/lib/types";
import { calculateRiskScore } from "@/lib/scoring";
import StatCard from "@/components/dashboard/StatCard";
import VulnerabilityList from "@/components/dashboard/VulnerabilityList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  initialScanResults: FullScanReport | null;
  initialScanHistory: FullScanReport[];
}

export default function DashboardClient({
  initialScanResults,
  initialScanHistory,
}: DashboardClientProps) {
  const [latestScan, setLatestScan] = useState<FullScanReport | null>(
    initialScanResults
  );
  const [scanHistory, setScanHistory] =
    useState<FullScanReport[]>(initialScanHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("latestScan");
  const router = useRouter();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("🔍 [DEBUG] Dashboard: Fetching data...");
      const [resultsRes, historyRes] = await Promise.all([
        authenticatedFetch("/api/results"),
        authenticatedFetch("/api/history"),
      ]);
      const resultsData = await resultsRes.json();
      const historyData = await historyRes.json();

      console.log("🔍 [DEBUG] Dashboard: Results data:", {
        success: resultsData.success,
        scanId: resultsData.scan_id,
        hasContextualFindings: !!resultsData.contextualFindings,
        hasStaticFindings: !!resultsData.staticFindings,
        hasAivssAnalysis: !!resultsData.aivssAnalysis,
        hasAarsAnalysis: !!resultsData.aarsAnalysis,
        contextualFindingsCount: resultsData.contextualFindings?.length || 0,
        staticFindingsCount: resultsData.staticFindings?.length || 0,
      });

      console.log(
        "🔍 [DEBUG] Dashboard: History data length:",
        historyData.length
      );
      historyData.forEach((scan: any, index: number) => {
        console.log(`🔍 [DEBUG] Dashboard: History scan ${index}:`, {
          scanId: scan.scan_id,
          hasContextualFindings: !!scan.contextualFindings,
          hasStaticFindings: !!scan.staticFindings,
          hasAivssAnalysis: !!scan.aivssAnalysis,
          hasAarsAnalysis: !!scan.aarsAnalysis,
        });
      });

      if (resultsData.success) setLatestScan(resultsData);
      if (Array.isArray(historyData)) setScanHistory(historyData);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dashboardMetrics = useMemo(() => {
    if (scanHistory.length === 0) {
      return {
        compromised: 0,
        avgRiskScore: 0,
        connectivity: 100,
        highRiskCount: 0,
      };
    }
    let compromisedCount = 0,
      totalRiskScore = 0,
      highRiskCount = 0;
    scanHistory.forEach((scan) => {
      const allRisks = [
        ...(scan.contextualFindings || []),
        ...(scan.staticFindings || []),
      ];
      const { score } = calculateRiskScore(allRisks);
      totalRiskScore += score;
      if (allRisks.some((r) => r.severity === "critical")) compromisedCount++;
      highRiskCount += allRisks.filter((r) =>
        ["critical", "high"].includes(r.severity)
      ).length;
    });
    const avgRiskScore = totalRiskScore / scanHistory.length;
    const connectivity = 100 - Math.min(avgRiskScore, 100);
    return {
      compromised: compromisedCount,
      avgRiskScore: parseFloat(avgRiskScore.toFixed(1)),
      connectivity: Math.round(connectivity),
      highRiskCount,
    };
  }, [scanHistory]);

  const latestScanMetrics = useMemo(() => {
    if (!latestScan) return null;
    const allRisks = [
      ...(latestScan.contextualFindings || []),
      ...(latestScan.staticFindings || []),
    ];
    const { score, level } = calculateRiskScore(allRisks);
    return {
      score: parseFloat(score.toFixed(1)),
      level,
      criticalCount: allRisks.filter((r) => r.severity === "critical").length,
      mediumCount: allRisks.filter((r) => r.severity === "medium").length,
      totalRisks: allRisks.length,
    };
  }, [latestScan]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-700">
            Overview of your security scan results and system status
          </p>
        </div>
        <Button onClick={fetchAllData} disabled={isLoading} variant="outline">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compromised"
          value={dashboardMetrics.compromised}
          Icon={ShieldAlert}
          color="text-red-500"
        />
        <StatCard
          title="Avg Risk Score"
          value={dashboardMetrics.avgRiskScore}
          Icon={TrendingUp}
          color="text-yellow-600"
        />
        <StatCard
          title="System Health"
          value={`${dashboardMetrics.connectivity}%`}
          Icon={Wifi}
          color="text-blue-500"
        />
        <StatCard
          title="High Risk Findings"
          value={dashboardMetrics.highRiskCount}
          Icon={BarChart}
          color="text-orange-500"
        />
      </div>

      <Card className="p-6 bg-white shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("latestScan")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "latestScan"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-700"
            }`}
          >
            Latest Scan
          </button>
          <button
            onClick={() => setActiveTab("scanHistory")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "scanHistory"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-700"
            }`}
          >
            Scan History
          </button>
          <button
            onClick={() => setActiveTab("systemOverview")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "systemOverview"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-700"
            }`}
          >
            System Overview
          </button>
        </div>

        <div className="pt-6">
          {activeTab === "latestScan" && (
            <div>
              {!latestScan ? (
                <p className="text-sm text-center text-gray-700 py-12">
                  No scans have been run yet. Upload a file to start.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">
                        {latestScan.scanName}
                      </h2>
                      <p className="text-sm text-gray-700">
                        Completed at{" "}
                        {new Date(
                          latestScan.scanCompleted
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 text-center bg-blue-50 border-blue-200">
                      <p className="text-sm font-medium text-gray-700">
                        Framework
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        Unknown
                      </p>
                    </Card>
                    <Card className="p-4 text-center bg-red-50 border-red-200">
                      <p className="text-sm font-medium text-gray-700">
                        Critical
                      </p>
                      <p className="text-2xl font-bold text-red-500">
                        {latestScanMetrics?.criticalCount}
                      </p>
                    </Card>
                    <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
                      <p className="text-sm font-medium text-gray-700">
                        Medium
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {latestScanMetrics?.mediumCount}
                      </p>
                    </Card>
                    <Card className="p-4 text-center bg-green-50 border-green-200">
                      <p className="text-sm font-medium text-gray-700">
                        Total Risks
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {latestScanMetrics?.totalRisks}
                      </p>
                    </Card>
                  </div>
                  <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                    <div className="font-semibold">
                      Overall Risk Score:{" "}
                      <span className="text-red-500">
                        {latestScanMetrics?.score} ({latestScanMetrics?.level})
                      </span>
                    </div>
                    <Link href={`/my-scans/${latestScan.scan_id}`}>
                      <Button
                        onClick={() => {
                          console.log(
                            "🔍 [DEBUG] Dashboard: Clicking 'View Full Report' for scanId:",
                            latestScan.scan_id
                          );
                          console.log(
                            "🔍 [DEBUG] Dashboard: Latest scan data:",
                            {
                              scanId: latestScan.scan_id,
                              hasContextualFindings:
                                !!latestScan.contextualFindings,
                              hasStaticFindings: !!latestScan.staticFindings,
                              hasAivssAnalysis: !!latestScan.aivssAnalysis,
                              hasAarsAnalysis: !!latestScan.aarsAnalysis,
                              contextualFindingsCount:
                                latestScan.contextualFindings?.length || 0,
                              staticFindingsCount:
                                latestScan.staticFindings?.length || 0,
                            }
                          );
                        }}
                      >
                        View Full Report
                      </Button>
                    </Link>
                  </div>
                  <VulnerabilityList
                    risks={[
                      ...(latestScan.contextualFindings || []),
                      ...(latestScan.staticFindings || []),
                    ]}
                  />
                </div>
              )}
            </div>
          )}
          {activeTab === "scanHistory" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                Recent Scan History
              </h3>
              {scanHistory.length > 0 ? (
                scanHistory.slice(0, 5).map((scan) => {
                  const allRisks = [
                    ...(scan.contextualFindings || []),
                    ...(scan.staticFindings || []),
                  ];
                  const { score } = calculateRiskScore(allRisks);
                  return (
                    <div
                      key={scan.scan_id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                    >
                      <div>
                        <p className="font-semibold text-gray-700">
                          {scan.scanName}
                        </p>
                        <p className="text-xs text-gray-700">
                          {new Date(scan.scanCompleted).toLocaleString()} •{" "}
                          {allRisks.length} vulnerabilities
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-700">
                          Risk Score: {score.toFixed(1)}
                        </p>
                        <Link href={`/my-scans/${scan.scan_id}`}>
                          <Button size="sm" variant="outline" className="mt-1">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-700">No history available.</p>
              )}
            </div>
          )}
          {activeTab === "systemOverview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800">Security Status</h3>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Overall Risk Level</span>
                    <span className="font-bold text-red-500">
                      {latestScanMetrics?.level || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Issues</span>
                    <span className="font-bold">
                      {latestScanMetrics?.criticalCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Risk Items</span>
                    <span className="font-bold">
                      {dashboardMetrics.highRiskCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Health</span>
                    <span className="font-bold">
                      {dashboardMetrics.connectivity}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => router.push("/scan-file")}
                    className="w-full justify-start"
                  >
                    Start New Scan
                  </Button>
                  <Button
                    onClick={() => router.push("/my-scans")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    View All Scans
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
