import { FullScanReport } from "@/lib/types";
import SecurityReportHeader from "@/components/report/SecurityReportHeader";
import ContextualAnalysis from "@/components/report/ContextualAnalysis";
import StaticAnalysis from "@/components/report/StaticAnalysis";
import CodeFileAnalysis from "@/components/report/CodeFileAnalysis";
import WorkflowAnalysis from "@/components/report/WorkflowAnalysis";

// DUMMY DATA based on your vulnerable_api_agent.py report
const DUMMY_REPORT_DATA: FullScanReport = {
  scanId: 1,
  scanName: "luxi's Security Scan - 10/7/2025",
  status: "completed",
  scanCreated: "2025-10-07T12:35:52Z",
  scanCompleted: "2025-10-07T12:37:30Z",
  totalFiles: 2,
  linesOfCode: 22,
  contextualFindings: [
    {
      title: "Hardcoded API Key Exposure",
      description:
        "The API key for `api.internal-service.com` is hardcoded directly in the source code. This practice is highly insecure...",
      impact:
        "An attacker gaining access to the source code can immediately retrieve the API key. This allows them to impersonate the application...",
      implementation_guide:
        '```python\n# **SECURITY FIX**: Prevents hardcoding secrets...\nimport os\n\ndef get_api_key():\n # ...\n api_key = os.environ.get("EXTERNAL_SERVICE_API_KEY")\n # ...\n```',
      priority: "high",
      severity: "critical",
    },
    {
      title: "Server-Side Request Forgery (SSRF) via Unvalidated User Input",
      description:
        "The application constructs a URL for an internal service request using raw, unvalidated user input (`user_query`). An attacker can manipulate this input...",
      impact:
        "A successful SSRF exploit allows an attacker to use the application server as a proxy to attack other systems...",
      implementation_guide:
        '```python\n# **SECURITY FIX**: Prevents SSRF...\nimport requests\n\nBASE_URL = "https://api.internal-service.com/data"\n\ndef secure_query_external_service(user_query: str):\n params = {"query": user_query}\n response = requests.get(BASE_URL, params=params)\n return response.text\n```',
      priority: "high",
      severity: "critical",
    },
    // Add more findings from your screenshot...
  ],
  staticFindings: [
    {
      risk: "HTTP Request Security Issue",
      recommendation: "Use HTTPS and validate URLs.",
      file: "vulnerable_api_agent.py",
      line: 19,
      priority: "low",
      severity: "low",
    },
  ],
  workflowAnalysis: {
    systemOverview:
      "The agentic system consists of a Python function designed to query an external, internal-facing API based on user-provided input...",
    nodes: [
      {
        id: "query_external_service",
        label: "query_external_service",
        type: "tool",
      },
    ],
    connections: [
      {
        source: "user_input",
        target: "query_external_service",
        label: "data_flow",
      },
      {
        source: "query_external_service",
        target: "api.internal-service.com",
        label: "data_flow",
      },
    ],
    frameworks: { Crew: 0, Task: 0, Agent: 0 },
  },
  annotatedCode: {
    "vulnerable_api_agent.py":
      "# AI Security Analysis Summary...\nimport requests\nimport os\n# ...",
  },
};

// In frontend/src/app/my-scans/[scanId]/report/page.tsx

async function getReportData(scanId: string): Promise<FullScanReport | null> {
  try {
    // This is a server component, so we can fetch from our own API route
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/report/${scanId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("Failed to fetch report data:", e);
    return null;
  }
}

export default async function ReportPage({
  params,
}: {
  params: { scanId: string };
}) {
  const reportData = await getReportData(params.scanId);

  if (!reportData) {
    return (
      <div className="p-8">Report not found or is still generating...</div>
    );
  }

  return (
    <div className="p-8 space-y-12 bg-background">
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
