"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

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
}

interface ModalProps {
  scan: ScanResult;
  onClose: () => void;
}

export default function ScanDetailsModal({ scan, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      {/* This container now uses theme-aware colors */}
      <div className="bg-card text-card-foreground rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Scan Details</h2>
            {/* The close button now calls the correct `onClose` function */}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl"
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
                <span className="text-sm text-muted-foreground">
                  {new Date(scan.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            {scan.file_path && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">File Analyzed:</p>
                <p className="text-sm text-muted-foreground">
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
          </div>
        </div>
      </div>
    </div>
  );
}
