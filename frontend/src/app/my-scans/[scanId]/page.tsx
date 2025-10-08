import { FullScanReport } from "@/lib/types";
import SecurityReportHeader from "@/components/report/SecurityReportHeader";
import ContextualAnalysis from "@/components/report/ContextualAnalysis";
import StaticAnalysis from "@/components/report/StaticAnalysis";
import CodeFileAnalysis from "@/components/report/CodeFileAnalysis";
import WorkflowAnalysis from "@/components/report/WorkflowAnalysis";
import { DUMMY_REPORT_DATA } from "./dummy-data";

async function getReportData(scanId: string): Promise<FullScanReport | null> {
  // We will replace this with a real API call in the final step.
  console.log(`Fetching report for scan ID: ${scanId}`);
  return DUMMY_REPORT_DATA;
}

export default async function ReportPage({
  params,
}: {
  params: { scanId: string };
}) {
  const reportData = await getReportData(params.scanId);

  if (!reportData) {
    return <div className="p-8 text-center">Report not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-12">
      <SecurityReportHeader
        scanName={reportData.scanName}
        scanCreated={reportData.scanCreated}
        scanCompleted={reportData.scanCompleted}
        totalFiles={reportData.totalFiles}
        linesOfCode={reportData.linesOfCode}
      />
      <ContextualAnalysis findings={reportData.contextualFindings} />
      <div className="pt-8 border-t">
        <StaticAnalysis findings={reportData.staticFindings} />
      </div>
      <div className="pt-8 border-t">
        <CodeFileAnalysis codeFiles={reportData.annotatedCode} />
      </div>
      <div className="pt-8 border-t">
        <WorkflowAnalysis analysis={reportData.workflowAnalysis} />
      </div>
    </div>
  );
}
