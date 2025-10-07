"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

// This is the same interface from your other pages
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

interface ModalProps {
  scan: ScanResult;
  onClose: () => void;
}

export default function ScanDetailsModal({ scan, onClose }: ModalProps) {
  return (
    // This is the single, outer container for the modal
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Scan Details</h2>
            {/* THIS IS THE CORRECTED FUNCTION CALL */}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl"
            >
              &times;
            </button>
          </div>

          {/* This is the single, inner content container */}
          <div className="space-y-4">
            {/* Scan Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {scan.success ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-red-600" />
                )}
                <span className="font-medium">
                  {scan.success
                    ? scan.message || "Scan completed successfully"
                    : "Scan failed"}
                </span>
              </div>
              {scan.timestamp && (
                <span className="text-sm text-muted-foreground">
                  {new Date(scan.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            {/* File Path */}
            {scan.file_path && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">File Analyzed:</p>
                <p className="text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
                  {scan.file_path}
                </p>
              </div>
            )}

            {/* Risk Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {scan.risks?.filter((r: any) => r.severity === "critical")
                    .length || 0}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {scan.risks?.filter((r: any) => r.severity === "medium")
                    .length || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Suggestions
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {scan.constraints_count || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Total Risks</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scan.risks_count || 0}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column - Security Constraints and Risks */}
              <div className="space-y-6">
                {scan.constraints && scan.constraints.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Security Constraints:</h4>
                    <ul className="space-y-2">
                      {scan.constraints.map(
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
                {scan.risks && scan.risks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Security Risks:</h4>
                    <ul className="space-y-2">
                      {scan.risks.map((risk: any, index: number) => (
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
                          {risk.impact && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Impact: {risk.impact}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right column - Security Recommendations */}
              {scan.hardened_code && scan.hardened_code.length > 0 && (
                <div className="h-full flex flex-col">
                  <h4 className="font-medium mb-2">
                    Security Recommendations:
                  </h4>
                  <div
                    className="bg-gray-900 text-green-400 p-3 border rounded-md font-mono text-xs overflow-y-auto"
                    style={{ height: "400px" }}
                  >
                    <pre className="whitespace-pre-wrap">
                      {scan.hardened_code.join("\n")}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {scan.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-800">Error:</p>
                <p className="text-sm text-red-600">{scan.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
