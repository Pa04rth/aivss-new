"use client";

import ScanInterface from "../../../components/ScanInterface";

export default function ScanFilePage() {
  return (
    <div className="p-8 space-y-12 text-gray-900 text-gray-900">
      {/* --- TOP SECTION --- */}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-center text-gray-900 text-gray-900">
          Upload Codebase
        </h1>
        <p className="text-gray-600 mt-2 text-center">
          Select a Python file or connect automation platform for security
          analysis.
        </p>
      </div>

      {/* --- TABBED INTERFACE SECTION --- */}
      <div className="min-h-[400px]">
        <ScanInterface />
      </div>

      {/* --- BOTTOM "WHAT WE SCAN FOR" SECTION (Always Visible) --- */}
      <div className="max-w-5xl mx-auto pt-8 border-t border-gray-200 border-gray-200">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-gray-900 text-gray-900">
          What We Scan For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg text-gray-900 text-gray-900">
              Static Analysis
            </h3>
            <ul className="space-y-3 text-gray-600 text-sm list-disc list-inside">
              <li>Prompt injection vulnerabilities</li>
              <li>Insecure tool usage patterns</li>
              <li>Code execution risks (e.g., eval, exec)</li>
              <li>Data leakage potential</li>
            </ul>
          </div>
          <div className="bg-white bg-white border border-gray-200 border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg text-gray-900 text-gray-900">
              AI-Powered Analysis
            </h3>
            <ul className="space-y-3 text-gray-600 text-sm list-disc list-inside">
              <li>Context-aware security recommendations</li>
              <li>Multi-agent architecture analysis</li>
              <li>Advanced threat detection</li>
              <li>Custom hardening guidelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
