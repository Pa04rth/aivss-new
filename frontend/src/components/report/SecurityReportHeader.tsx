"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle, FileCode, Hash } from "lucide-react";

interface HeaderProps {
  scanName: string;
  scanCreated: string;
  scanCompleted: string;
  totalFiles: number;
  linesOfCode: number;
  // Risk summary data
  criticalRisks?: number;
  highRisks?: number;
  mediumRisks?: number;
  lowRisks?: number;
  suggestions?: number;
  totalRisks?: number;
}

export default function SecurityReportHeader({
  scanName,
  scanCreated,
  scanCompleted,
  totalFiles,
  linesOfCode,
  criticalRisks = 0,
  highRisks = 0,
  mediumRisks = 0,
  lowRisks = 0,
  suggestions = 0,
  totalRisks = 0,
}: HeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Back Button and Title */}
      <div>
        <button
          onClick={() => router.push("/my-scans")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Security Analysis</h1>
        <p className="text-gray-600 mt-1">
          Detailed vulnerability assessment and security recommendations
        </p>
      </div>

      {/* Scan Summary Bar */}
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-5 space-y-4">
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
            <Calendar size={20} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Scan Created</p>
              <p className="text-sm font-semibold">
                {new Date(scanCreated).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Scan Completed</p>
              <p className="text-sm font-semibold">
                {new Date(scanCompleted).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Total Files</p>
              <p className="text-sm font-semibold">{totalFiles}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Hash size={20} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Lines of Code</p>
              <p className="text-sm font-semibold">{linesOfCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Summary - Matching Dashboard Display */}
      <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Risk Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">Critical</p>
            <p className="text-2xl font-bold text-red-600">{criticalRisks}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-medium text-orange-700">High</p>
            <p className="text-2xl font-bold text-orange-600">{highRisks}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-700">Medium</p>
            <p className="text-2xl font-bold text-yellow-600">{mediumRisks}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Low</p>
            <p className="text-2xl font-bold text-blue-600">{lowRisks}</p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-700">Suggestions</p>
            <p className="text-2xl font-bold text-green-600">{suggestions}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Total Risks</p>
            <p className="text-2xl font-bold text-gray-800">{totalRisks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
