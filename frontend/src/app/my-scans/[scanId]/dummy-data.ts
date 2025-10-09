import { FullScanReport } from "@/lib/types";

// This data is based on your MVP screenshots for vulnerable_api_agent.py
export const DUMMY_REPORT_DATA: FullScanReport = {
  scan_id: 1,
  scanName: "luxi's Security Scan - 10/7/2025",
  status: "completed",
  scanCreated: "2025-10-07T12:35:52Z",
  scanCompleted: "2025-10-07T12:37:30Z",
  totalFiles: 2,
  linesOfCode: 22,
  contextualFindings: [
    {
      title: "Hardcoded API Key Exposure",
      description: "The API key is hardcoded...",
      impact: "An attacker can immediately retrieve the API key...",
      implementation_guide: "Store it securely using a secrets manager...",
      priority: "high",
      severity: "critical",
    },
    {
      title: "Server-Side Request Forgery (SSRF)",
      description: "The application constructs a URL using raw user input...",
      impact:
        "A successful SSRF exploit allows an attacker to proxy attacks...",
      implementation_guide: "Use a fixed, whitelisted base URL...",
      priority: "high",
      severity: "critical",
    },
    {
      title: "Insecure Data Transmission via Cleartext HTTP",
      description: "The application communicates over unencrypted HTTP...",
      impact:
        "An attacker can sniff the traffic to steal the API key and other sensitive information...",
      implementation_guide:
        "Replace the HTTP URL with its secure HTTPS equivalent...",
      priority: "medium",
      severity: "medium",
    },
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
        description: "This function acts as a simple tool...",
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
    frameworks: { Crew: 0, Task: 0, Agent: 0, tools: 0, CrewAI: 0 },
  },
  annotatedCode: {
    "vulnerable_api_agent.py":
      "# AI Security Analysis Summary...\nimport requests\n# ...",
  },
};
