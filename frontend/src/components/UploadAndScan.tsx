"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Save,
  CheckCircle,
  Eye,
  Power,
} from "lucide-react";
import ScanDetailsModal from "./ScanDetailsModal";
import { authenticatedFetch } from "@/lib/auth";

type ScanState = "idle" | "uploading" | "polling" | "completed" | "error";

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

export default function UploadAndScan() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [scanName, setScanName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [scanId, setScanId] = useState<number | null>(null);
  const [completedScan, setCompletedScan] = useState<ScanResult | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.name.endsWith(".py")) {
        setFile(selectedFile);
        setScanName(`${selectedFile.name} Scan`);
      } else {
        setError("Invalid file type. Please upload a Python (.py) file.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "text/x-python": [".py"] },
  });

  const handleStartScan = async () => {
    if (!file) return;

    setScanState("uploading");
    setError(null);
    setStartTime(new Date());

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await authenticatedFetch("/api/upload-and-scan", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed.");
      }
      const result = await response.json();
      if (result.scan_id !== undefined) {
        setScanId(result.scan_id);
        setScanState("polling");
      } else {
        throw new Error("Backend did not return a scan ID.");
      }
    } catch (err: any) {
      setError(err.message);
      setScanState("error");
    }
  };

  useEffect(() => {
    if (scanState !== "polling" || scanId === null) return;
    const timer = setInterval(() => {
      if (startTime)
        setElapsed(
          Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
        );
    }, 1000);
    const poller = setInterval(async () => {
      try {
        const response = await authenticatedFetch("/api/history");
        if (response.ok) {
          const history = await response.json();
          const foundScan = history.find(
            (scan: any) => scan.scan_id === scanId
          );
          if (foundScan) setCompletedScan(foundScan);
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
    }, 2500); // Check every 2.5 seconds
    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [scanState, scanId, startTime]);

  // New Effect to handle transition to 'completed' state
  useEffect(() => {
    if (completedScan) {
      setScanState("completed");
    }
  }, [completedScan]);

  const resetState = () => {
    setScanState("idle");
    setFile(null);
    setScanName("");
    setError(null);
    setScanId(null);
    setCompletedScan(null);
    setStartTime(null);
    setElapsed(0);
  };

  // --- RENDER LOGIC SWITCH ---
  switch (scanState) {
    case "completed":
      if (!completedScan || !startTime) return null; // Should not happen
      const totalTime = Math.floor(
        (new Date(
          completedScan.scanCompleted || completedScan.timestamp!
        ).getTime() -
          startTime.getTime()) /
          1000
      );
      return (
        <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-xl p-8 md:p-12 w-full max-w-3xl space-y-8 text-center animate-fade-in mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Your security scan has been completed successfully!
            </h1>
            <p className="text-gray-600">
              We've analyzed your codebase and identified potential security
              risks and vulnerabilities.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                STARTED
              </p>
              <p className="text-2xl font-bold mt-2">
                {new Date(
                  completedScan.scanCreated || completedScan.timestamp!
                ).toLocaleTimeString()}
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                TOTAL TIME
              </p>
              <p className="text-2xl font-bold mt-2">{totalTime}s</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setSelectedScan(completedScan)}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold flex items-center justify-center gap-2 text-base hover:bg-green-700 transition-colors"
            >
              <Eye size={20} /> View Security Analysis Results
            </button>
            <button
              onClick={resetState}
              className="w-full px-6 py-3 bg-blue-600 text-white bg-blue-600 rounded-md font-semibold flex items-center justify-center gap-2 text-base hover:bg-blue-700 hover:bg-blue-700 transition-colors"
            >
              <Power size={20} /> Start New Scan
            </button>
          </div>
          {selectedScan && (
            <ScanDetailsModal
              scan={selectedScan}
              onClose={() => setSelectedScan(null)}
            />
          )}
        </div>
      );

    case "polling":
      if (!startTime) return null;
      return (
        <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-xl p-8 md:p-12 w-full max-w-3xl space-y-6 animate-fade-in mx-auto">
          <div className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">
              Scan in Progress
            </h1>
          </div>
          <div className="text-left space-y-2">
            <p className="font-semibold text-lg text-gray-900 text-gray-900">
              Please be patient! We are thoroughly scanning your file for
              vulnerabilities!
            </p>
            <p className="text-gray-600">
              Our AI-powered analysis is examining your codebase for security
              risks, potential vulnerabilities, and providing detailed
              recommendations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                STARTED
              </p>
              <p className="text-2xl font-bold mt-2">
                {startTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                ELAPSED
              </p>
              <p className="text-2xl font-bold mt-2">{elapsed}s</p>
            </div>
          </div>
        </div>
      );

    case "idle":
    case "uploading":
    case "error":
    default:
      return (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div
            {...getRootProps()}
            className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 hover:border-blue-600/50"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-600">
              Drop your codebase files here
            </p>
            <p className="text-sm text-gray-600/80">
              or click to browse files
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white bg-blue-600 rounded-md text-sm font-semibold">
              Choose Files
            </button>
          </div>
          {file && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Selected Files (1)
                </h3>
                <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600 text-blue-600 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setScanName("");
                      setError(null);
                    }}
                    className="p-1.5 rounded-full text-gray-600 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="scanName"
                  className="block text-lg font-semibold mb-3"
                >
                  Scan Name{" "}
                  <span className="text-sm font-normal text-gray-600">
                    (Optional)
                  </span>
                </label>
                <input
                  id="scanName"
                  type="text"
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  placeholder="Enter a name for this scan..."
                  className="w-full px-4 py-3 bg-white bg-white border border-gray-200 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                />
              </div>
              {(error || scanState === "error") && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
                  {error || "An unknown error occurred."}
                </div>
              )}
              <div className="pt-4 border-t">
                <button
                  onClick={handleStartScan}
                  disabled={!file || scanState === "uploading"}
                  className="w-full px-6 py-3 bg-blue-600 text-white bg-blue-600 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base hover:bg-blue-700 hover:bg-blue-700 transition-colors"
                >
                  {scanState === "uploading" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {scanState === "uploading"
                    ? "Starting Scan..."
                    : "Start Security Scan"}
                </button>
              </div>
            </div>
          )}
        </div>
      );
  }
}
