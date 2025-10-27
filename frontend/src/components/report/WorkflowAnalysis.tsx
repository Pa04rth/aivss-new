import { FullScanReport } from "../../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GitGraph, Layers3, Cog, Cpu, Waypoints, Zap } from "lucide-react";

interface Props {
  analysis: FullScanReport["workflowAnalysis"];
}

export default function WorkflowAnalysis({ analysis }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <GitGraph className="text-blue-600 text-blue-600" />
          Workflow Analysis Results
        </h2>
        <p className="text-gray-700 text-gray-700 mt-1">
          Comprehensive security analysis including system overview, AI
          findings, and workflow patterns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu size={20} /> System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 text-gray-900 text-sm leading-relaxed">
            {analysis.systemOverview}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} /> Workflow Visualization ({analysis.nodes.length}{" "}
            nodes, {analysis.connections.length} connections)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* This is a simplified, non-interactive representation of the graph */}
          <div className="bg-gray-100 p-8 rounded-lg flex gap-8 items-center justify-center min-h-[200px]">
            {analysis.nodes.map((node) => (
              <div
                key={node.id}
                className="bg-white bg-gray-100 border border-gray-200 border-gray-200 p-4 rounded-lg text-center shadow-md"
              >
                <h4 className="font-bold text-gray-900 text-gray-900">
                  {node.label}
                </h4>
                <p className="text-xs text-gray-600 capitalize">{node.type}</p>
                {node.riskScore && (
                  <span className="mt-2 inline-block text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Risk: {node.riskScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waypoints size={20} /> Connections ({analysis.connections.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.connections.map((conn, i) => (
            <div
              key={i}
              className="bg-gray-100 p-3 rounded-md text-sm font-mono flex justify-between items-center"
            >
              <span className="text-gray-900 text-gray-900">
                {conn.source} → {conn.target}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {conn.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 size={20} /> Framework Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {Object.entries(analysis.frameworks).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 text-sm"
              >
                <span className="text-gray-900 text-gray-900">{key}</span>
                <span className="font-semibold text-gray-900 text-gray-900">
                  {value} files
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
