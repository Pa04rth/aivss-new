"use client";

import { useState, useEffect, useCallback, use } from "react";
import { FullScanReport } from "@/lib/types";
import SecurityReportHeader from "@/components/report/SecurityReportHeader";
import ContextualAnalysis from "@/components/report/ContextualAnalysis";
import StaticAnalysis from "@/components/report/StaticAnalysis";
import CodeFileAnalysis from "@/components/report/CodeFileAnalysis";
import WorkflowAnalysis from "@/components/report/WorkflowAnalysis";
import AIVSSAnalysisComponent from "@/components/report/AIVSSAnalysis";
import { Loader2 } from "lucide-react";

interface ReportPageProps {
  params: Promise<{
    scanId: string;
  }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const [reportData, setReportData] = useState<FullScanReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We use useCallback to memoize the function
  const fetchReportData = useCallback(async () => {
    // Only fetch if scanId is a valid number
    if (!resolvedParams.scanId || isNaN(parseInt(resolvedParams.scanId))) {
      console.log(
        "🔍 [DEBUG] Report Page: Invalid scanId:",
        resolvedParams.scanId
      );
      setIsLoading(false);
      return;
    }

    console.log(
      "🔍 [DEBUG] Report Page: Fetching data for scanId:",
      resolvedParams.scanId
    );
    setIsLoading(true);
    try {
      const res = await fetch(`/api/report/${resolvedParams.scanId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch report");
      }
      const data = await res.json();

      console.log(
        "🔍 [DEBUG] Report Page: Received data for scanId:",
        resolvedParams.scanId,
        {
          scanId: data.scan_id,
          hasContextualFindings: !!data.contextualFindings,
          hasStaticFindings: !!data.staticFindings,
          hasAivssAnalysis: !!data.aivssAnalysis,
          hasAarsAnalysis: !!data.aarsAnalysis,
          contextualFindingsCount: data.contextualFindings?.length || 0,
          staticFindingsCount: data.staticFindings?.length || 0,
          dataKeys: Object.keys(data),
        }
      );

      // Additional detailed logging for AIVSS analysis
      if (data.aivssAnalysis) {
        console.log("🔍 [DEBUG] Report Page: AIVSS Analysis details:", {
          success: data.aivssAnalysis.success,
          apiCallSuccessful: data.aivssAnalysis.apiCallSuccessful,
          hasScores: !!data.aivssAnalysis.scores,
          hasParameters: !!data.aivssAnalysis.parameters,
          aivssScore: data.aivssAnalysis.scores?.aivssScore,
          aarsScore: data.aivssAnalysis.scores?.aarsScore,
          cvssScore: data.aivssAnalysis.scores?.cvssScore,
        });
      } else {
        console.log("🔍 [DEBUG] Report Page: No AIVSS Analysis found in data");
      }

      // Additional detailed logging for AARS analysis
      if (data.aarsAnalysis) {
        console.log("🔍 [DEBUG] Report Page: AARS Analysis details:", {
          keys: Object.keys(data.aarsAnalysis),
          sampleValues: Object.fromEntries(
            Object.entries(data.aarsAnalysis).slice(0, 3)
          ),
        });
      } else {
        console.log("🔍 [DEBUG] Report Page: No AARS Analysis found in data");
      }

      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.scanId]); // The dependency array now correctly uses resolvedParams.scanId

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading security report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">Report Not Found</h2>
        <p>
          Could not load the report for Scan ID:{" "}
          <span className="font-mono">{resolvedParams.scanId}</span>. It may
          have failed or been cleared from history.
        </p>
      </div>
    );
  }

  // Calculate risk counts for the summary
  const allRisks = [
    ...(reportData.contextualFindings || []),
    ...(reportData.staticFindings || []),
  ];
  const criticalRisks = allRisks.filter(
    (r) => r.severity?.toLowerCase() === "critical"
  ).length;
  const highRisks = allRisks.filter(
    (r) => r.severity?.toLowerCase() === "high"
  ).length;
  const mediumRisks = allRisks.filter(
    (r) => r.severity?.toLowerCase() === "medium"
  ).length;
  const lowRisks = allRisks.filter(
    (r) => r.severity?.toLowerCase() === "low"
  ).length;
  const suggestions = allRisks.filter(
    (r) => r.severity?.toLowerCase() === "suggestion"
  ).length;
  const totalRisks = allRisks.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-4 md:p-8 space-y-12">
        <SecurityReportHeader
          scanName={reportData.scanName}
          scanCreated={reportData.scanCreated}
          scanCompleted={reportData.scanCompleted}
          totalFiles={reportData.totalFiles}
          linesOfCode={reportData.linesOfCode}
          criticalRisks={criticalRisks}
          highRisks={highRisks}
          mediumRisks={mediumRisks}
          lowRisks={lowRisks}
          suggestions={suggestions}
          totalRisks={totalRisks}
        />

        {/* AIVSS Analysis - Show first if available */}
        {reportData.aivssAnalysis && (
          <div className="pt-8 border-t border-border">
            {console.log(
              "🔍 [DEBUG] Report Page: Rendering AIVSSAnalysisComponent with data:",
              reportData.aivssAnalysis
            )}
            <AIVSSAnalysisComponent aivssAnalysis={reportData.aivssAnalysis} />
          </div>
        )}
        {!reportData.aivssAnalysis &&
          console.log(
            "🔍 [DEBUG] Report Page: NOT rendering AIVSSAnalysisComponent - no aivssAnalysis data"
          )}

        <ContextualAnalysis findings={reportData.contextualFindings} />
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <StaticAnalysis findings={reportData.staticFindings} />
        </div>
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <CodeFileAnalysis codeFiles={reportData.annotatedCode} />
        </div>
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <WorkflowAnalysis analysis={reportData.workflowAnalysis} />
        </div>
      </div>
    </div>
  );
}
