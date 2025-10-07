"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle, FileCode, Hash } from "lucide-react";

interface HeaderProps {
  scanName: string;
  scanCreated: string;
  scanCompleted: string;
  totalFiles: number;
  linesOfCode: number;
}

export default function SecurityReportHeader({
  scanName,
  scanCreated,
  scanCompleted,
  totalFiles,
  linesOfCode,
}: HeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Back Button and Title */}
      <div>
        <button
          onClick={() => router.push("/my-scans")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Security Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Detailed vulnerability assessment and security recommendations
        </p>
      </div>

      {/* Scan Summary Bar */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="font-bold text-lg">{scanName}</h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
            <CheckCircle size={14} /> Completed
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Scan Created</p>
              <p className="text-sm font-semibold">
                {new Date(scanCreated).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Scan Completed</p>
              <p className="text-sm font-semibold">
                {new Date(scanCompleted).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Files</p>
              <p className="text-sm font-semibold">{totalFiles}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Hash size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Lines of Code</p>
              <p className="text-sm font-semibold">{linesOfCode}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
