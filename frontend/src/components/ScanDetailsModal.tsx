"use client";

import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface ScanResult {
  success: boolean;
  file_path?: string;
  constraints_count?: number;
  risks_count?: number;
  hardened_code?: string[];
  message?: string;
  error?: string;
  timestamp?: string;
  scan_id?: number;
  risks?: any[];
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
}

interface ModalProps {
  scan: ScanResult;
  onClose: () => void;
}

export default function ScanDetailsModal({ scan, onClose }: ModalProps) {
  const router = useRouter();

  const handleViewDetailedReport = () => {
    if (scan.scan_id) {
      router.push(`/my-scans/${scan.scan_id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      {/* This container now uses theme-aware colors */}
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Scan Details</h2>
            {/* The close button now calls the correct `onClose` function */}
            <button
              onClick={onClose}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {scan.success ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
                <span className="font-medium">
                  {scan.success
                    ? scan.message || "Scan completed"
                    : "Scan failed"}
                </span>
              </div>
              {scan.timestamp && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(scan.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            {scan.file_path && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-sm font-medium">File Analyzed:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scan.file_path}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-red-500/10 rounded-lg text-center">
                <p className="text-sm font-medium text-red-400">Critical</p>
                <p className="text-2xl font-bold">
                  {scan.risks?.filter((r) => r.severity === "critical")
                    .length || 0}
                </p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                <p className="text-sm font-medium text-yellow-400">Medium</p>
                <p className="text-2xl font-bold">
                  {scan.risks?.filter((r) => r.severity === "medium").length ||
                    0}
                </p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg text-center">
                <p className="text-sm font-medium text-green-400">
                  Suggestions
                </p>
                <p className="text-2xl font-bold">
                  {scan.constraints_count || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                <p className="text-sm font-medium text-blue-400">Total Risks</p>
                <p className="text-2xl font-bold">{scan.risks?.length || 0}</p>
              </div>
            </div>

            {scan.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm font-medium text-destructive">Error:</p>
                <p className="text-sm text-destructive/90">{scan.error}</p>
              </div>
            )}

            {/* AIVSS Analysis Summary */}
            {scan.aivssAnalysis && scan.aivssAnalysis.success && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  🎯 AIVSS Analysis Summary
                </h3>
                {scan.aivssAnalysis.scores && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {scan.aivssAnalysis.scores.aivssScore?.toFixed(1) ||
                          "N/A"}
                      </div>
                      <div className="text-sm text-blue-800">AIVSS Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {scan.aivssAnalysis.scores.aarsScore?.toFixed(1) ||
                          "N/A"}
                      </div>
                      <div className="text-sm text-orange-800">AARS Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {scan.aivssAnalysis.scores.cvssScore?.toFixed(1) ||
                          "N/A"}
                      </div>
                      <div className="text-sm text-green-800">CVSS Score</div>
                    </div>
                  </div>
                )}
                <div className="text-sm text-blue-700">
                  <strong>Status:</strong>{" "}
                  {scan.aivssAnalysis.apiCallSuccessful
                    ? "✅ API Call Successful"
                    : "❌ API Call Failed"}
                </div>
                {scan.aivssAnalysis.scores?.reportUrl && (
                  <div className="mt-2 text-sm text-blue-700">
                    <strong>PDF Report:</strong> Available for download
                  </div>
                )}
              </div>
            )}

            {/* Detailed Analysis Summary */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">📊 Analysis Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Contextual Findings
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {scan.contextualFindings?.length || 0}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Static Findings
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {scan.staticFindings?.length || 0}
                  </div>
                </div>
              </div>

              {scan.workflowAnalysis && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Workflow Analysis
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {scan.workflowAnalysis.systemOverview ||
                      "Workflow analysis completed"}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleViewDetailedReport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                View Detailed Report
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
