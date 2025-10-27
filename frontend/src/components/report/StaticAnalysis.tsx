import { StaticFinding } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ShieldAlert, ShieldOff, Wrench } from "lucide-react";

interface Props {
  findings: StaticFinding[];
}

export default function StaticAnalysis({ findings }: Props) {
  if (!findings || findings.length === 0) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <ShieldOff className="text-blue-600 text-blue-600" />
          Static Analysis Results
          <span className="text-sm font-bold bg-gray-100 text-gray-700 text-gray-700 px-2 py-1 rounded-md">
            {findings.length} found
          </span>
        </h2>
        <p className="text-gray-700 text-gray-700 mt-1">
          Security vulnerabilities detected through automated pattern analysis.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security Risks Column */}
        <div>
          <h3 className="font-semibold mb-4 text-gray-800 text-gray-800">
            Security Risks:
          </h3>
          <div className="space-y-4">
            {findings.map((finding, index) => (
              <Card key={index} className="p-4">
                <span
                  className={`inline-flex items-center gap-2 text-xs font-bold uppercase px-3 py-1 rounded-full border bg-red-500/5 text-red-500`}
                >
                  <ShieldAlert size={14} />
                  {finding.severity}
                </span>
                <h4 className="font-bold mt-3 text-gray-900 text-gray-900">
                  {finding.risk}
                </h4>
                <p className="text-sm text-gray-900 text-gray-900 mt-1">
                  {finding.risk} detected.
                </p>
                <div className="mt-3">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    File: {finding.file}:{finding.line}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {/* Security Recommendations Column */}
        <div>
          <h3 className="font-semibold mb-4 text-gray-800">
            Security Recommendations:
          </h3>
          <div className="space-y-4">
            {findings.map((finding, index) => (
              <Card key={index} className="p-4 h-full">
                <h4 className="font-bold text-foreground">{finding.risk}</h4>
                <p className="text-sm text-foreground mt-2 leading-relaxed">
                  {finding.recommendation}
                </p>
                <div className="mt-4 text-xs text-gray-700 text-right">
                  Priority:{" "}
                  <span className="font-bold capitalize">
                    {finding.priority}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
