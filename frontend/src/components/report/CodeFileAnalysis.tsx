"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode, FileText, CheckCircle } from "lucide-react";

interface Props {
  codeFiles?: Record<string, string> | null;
}

export default function CodeFileAnalysis({ codeFiles }: Props) {
  // Handle undefined or null codeFiles
  if (!codeFiles || typeof codeFiles !== "object") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileCode className="text-blue-600 text-blue-600" />
            Code Files Analysis
          </h2>
          <div className="bg-gray-500/10 text-gray-700 text-gray-600 text-sm rounded-lg p-3 flex items-center gap-2 mt-4">
            <FileText size={16} /> No code files available for this scan.
          </div>
        </div>
      </div>
    );
  }

  const fileNames = Object.keys(codeFiles);
  const [selectedFile, setSelectedFile] = useState(fileNames[0] || null);

  if (!selectedFile) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <FileCode className="text-blue-600 text-blue-600" />
          Code Files Analysis
        </h2>
        <div className="bg-green-500/10 text-green-700 text-green-600 text-sm rounded-lg p-3 flex items-center gap-2 mt-4">
          <CheckCircle size={16} /> Code files from your scan are displayed
          below. Files with security comments added are marked with 'M'.
        </div>
      </div>
      <Card className="flex overflow-hidden h-[600px]">
        {/* File Explorer */}
        <div className="w-1/4 bg-gray-100 border-r border-gray-200 border-gray-200 p-4">
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-3">
            Explorer
          </h3>
          <ul>
            {fileNames.map((name) => (
              <li key={name}>
                <button
                  onClick={() => setSelectedFile(name)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                    selectedFile === name
                      ? "bg-blue-100 bg-blue-100 text-blue-600 text-blue-600 font-semibold"
                      : "hover:bg-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <FileText size={16} /> {name}{" "}
                  <span className="ml-auto text-xs font-bold text-yellow-500">
                    M
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Code Viewer */}
        <div className="w-3/4 flex flex-col">
          <div className="flex-shrink-0 bg-gray-100 border-b p-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="font-medium">{selectedFile}</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md">
                Modified
              </span>
            </div>
            <span>Python</span>
          </div>
          <div className="flex-grow bg-slate-900 text-slate-100 p-4 overflow-auto font-mono text-xs">
            <pre className="whitespace-pre-wrap">{codeFiles[selectedFile]}</pre>
          </div>
        </div>
      </Card>
      <p className="text-xs text-gray-600 text-center">
        Note: Security comments are highlighted in bold. Original files are
        backed up with .bak extensions.
      </p>
    </div>
  );
}
