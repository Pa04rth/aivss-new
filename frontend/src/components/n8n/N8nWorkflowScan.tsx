"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Link,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Power,
  RefreshCw,
  Trash2,
  Workflow,
  Shield,
  AlertTriangle,
} from "lucide-react";
import ScanDetailsModal from "../ScanDetailsModal";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

interface N8nConnection {
  id: number;
  platform_type: string;
  instance_name: string;
  instance_url: string | null;
  connection_status: string;
  created_at: string;
  last_sync_at: string | null;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  nodes_count: number;
  connections_count: number;
  tags: string[];
  description: string;
}

interface ScanState {
  status:
    | "idle"
    | "connecting"
    | "loading_workflows"
    | "analyzing"
    | "completed"
    | "error";
  message?: string;
} // ScanState interface

export default function N8nWorkflowScan() {
  const [connections, setConnections] = useState<N8nConnection[]>([]);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(
    null
  );
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [completedScans, setCompletedScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any | null>(null);

  const router = useRouter();

  // Load connections on component mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/n8n/connections?user_id=1`
      );
      const data = await response.json();

      if (data.success) {
        setConnections(data.connections);
        if (data.connections.length > 0) {
          setSelectedConnection(data.connections[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  };

  const loadWorkflows = async (connectionId: number) => {
    setScanState({
      status: "loading_workflows",
      message: "Loading workflows...",
    });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/n8n/workflows?connection_id=${connectionId}`
      );
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.workflows);
        setScanState({ status: "idle" });
      } else {
        setScanState({ status: "error", message: data.error });
      }
    } catch (error) {
      setScanState({ status: "error", message: "Failed to load workflows" });
    }
  };

  const connectToN8n = async () => {
    setScanState({ status: "connecting", message: "Connecting to n8n..." });

    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/auth-url?user_id=1`);
      const data = await response.json();

      if (data.success) {
        setAuthUrl(data.auth_url);
        // Open OAuth URL in new window
        window.open(data.auth_url, "_blank", "width=600,height=700");
        setScanState({ status: "idle" });
      } else {
        setScanState({ status: "error", message: data.error });
      }
    } catch (error) {
      setScanState({
        status: "error",
        message: "Failed to initiate connection",
      });
    }
  };

  const analyzeWorkflows = async () => {
    if (selectedWorkflows.length === 0) {
      setScanState({
        status: "error",
        message: "Please select at least one workflow",
      });
      return;
    }

    setScanState({ status: "analyzing", message: "Analyzing workflows..." });

    try {
      const scanPromises = selectedWorkflows.map((workflowId) =>
        fetch(`${BACKEND_URL}/api/n8n/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connection_id: selectedConnection,
            workflow_id: workflowId,
            user_id: 1,
          }),
        })
      );

      const responses = await Promise.all(scanPromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      // Check if all scans were successful
      const successfulScans = results.filter((r) => r.success);

      if (successfulScans.length > 0) {
        setCompletedScans(successfulScans);
        setScanState({
          status: "completed",
          message: `Successfully analyzed ${successfulScans.length} workflows`,
        });
      } else {
        setScanState({
          status: "error",
          message: "All workflow analyses failed",
        });
      }
    } catch (error) {
      setScanState({ status: "error", message: "Failed to analyze workflows" });
    }
  };

  const disconnectConnection = async (connectionId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId }),
      });

      const data = await response.json();

      if (data.success) {
        await loadConnections();
        setWorkflows([]);
        setSelectedWorkflows([]);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const toggleWorkflowSelection = (workflowId: string) => {
    setSelectedWorkflows((prev) =>
      prev.includes(workflowId)
        ? prev.filter((id) => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const selectAllWorkflows = () => {
    setSelectedWorkflows(workflows.map((w) => w.id));
  };

  const clearSelection = () => {
    setSelectedWorkflows([]);
  };

  // Render based on scan state
  if (scanState.status === "completed") {
    return (
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-xl p-8 md:p-12 w-full max-w-3xl space-y-8 text-center animate-fade-in mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Workflow Analysis Complete!
          </h1>
          <p className="text-gray-600">
            {scanState.message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              WORKFLOWS ANALYZED
            </p>
            <p className="text-2xl font-bold mt-2">{completedScans.length}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              TOTAL RISKS
            </p>
            <p className="text-2xl font-bold mt-2">
              {completedScans.reduce(
                (sum, scan) => sum + (scan.analysis_result?.totalRisks || 0),
                0
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setSelectedScan(completedScans[0])}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold flex items-center justify-center gap-2 text-base hover:bg-green-700 transition-colors"
          >
            <Eye size={20} /> View Security Analysis Results
          </button>
          <button
            onClick={() => {
              setScanState({ status: "idle" });
              setCompletedScans([]);
              setSelectedWorkflows([]);
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white bg-blue-600 rounded-md font-semibold flex items-center justify-center gap-2 text-base hover:bg-blue-700 hover:bg-blue-700 transition-colors"
          >
            <Power size={20} /> Analyze More Workflows
          </button>
        </div>

        {selectedScan && (
          <ScanDetailsModal
            scan={selectedScan.analysis_result}
            onClose={() => setSelectedScan(null)}
          />
        )}
      </div>
    );
  }

  if (scanState.status === "analyzing") {
    return (
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-xl p-8 md:p-12 w-full max-w-3xl space-y-6 animate-fade-in mx-auto">
        <div className="flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">
            Analyzing Workflows
          </h1>
        </div>
        <div className="text-left space-y-2">
          <p className="font-semibold text-lg text-foreground">
            {scanState.message}
          </p>
          <p className="text-gray-600">
            Our AI-powered analysis is examining your n8n workflows for security
            risks, potential vulnerabilities, and providing detailed
            recommendations.
          </p>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Connection Status */}
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5" />
          n8n Connections
        </h3>

        {connections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No n8n connections found
            </p>
            <button
              onClick={connectToN8n}
              disabled={scanState.status === "connecting"}
              className="px-6 py-3 bg-blue-600 text-white bg-blue-600 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {scanState.status === "connecting" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              Connect to n8n
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connection.connection_status === "active"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{connection.instance_name}</p>
                    <p className="text-sm text-gray-600">
                      Connected{" "}
                      {new Date(connection.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadWorkflows(connection.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 text-blue-600 transition-colors"
                    title="Load Workflows"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => disconnectConnection(connection.id)}
                    className="p-2 text-gray-600 hover:text-red-600 text-red-600 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Selection */}
      {workflows.length > 0 && (
        <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              Select Workflows to Analyze
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllWorkflows}
                className="px-3 py-1 text-sm bg-gray-100 bg-white text-gray-600 rounded hover:bg-gray-100 bg-white/80 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 bg-white text-gray-600 rounded hover:bg-gray-100 bg-white/80 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflows.includes(workflow.id)
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-blue-600/50"
                }`}
                onClick={() => toggleWorkflowSelection(workflow.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.includes(workflow.id)}
                      onChange={() => toggleWorkflowSelection(workflow.id)}
                      className="w-4 h-4"
                      aria-label={`Select workflow ${workflow.name}`}
                    />
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-sm text-gray-600">
                        {workflow.nodes_count} nodes •{" "}
                        {workflow.connections_count} connections
                        {workflow.active && (
                          <span className="ml-2 text-green-600">• Active</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow.active && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    <Shield className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={analyzeWorkflows}
              disabled={
                selectedWorkflows.length === 0 ||
                (scanState.status as ScanState["status"]) === "analyzing"
              }
              className="w-full px-6 py-3 bg-blue-600 text-white bg-blue-600 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base hover:bg-blue-700 hover:bg-blue-700 transition-colors"
            >
              {(scanState.status as ScanState["status"]) === "analyzing" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              Analyze {selectedWorkflows.length} Workflow
              {selectedWorkflows.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {scanState.status === "error" && (
        <div className="bg-destructive/10 border border-destructive/20 text-red-600 text-red-600 text-sm rounded-lg p-3 text-center">
          <AlertCircle className="w-4 h-4 mx-auto mb-2" />
          {scanState.message}
        </div>
      )}
    </div>
  );
}
