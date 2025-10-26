import { ContextualFinding } from "@/lib/types";
import { AlertTriangle, Lightbulb, ShieldAlert, Code2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  findings: ContextualFinding[];
}

const severityStyles = {
  critical: "border-red-500/50 bg-red-500/5 text-red-500",
  medium: "border-yellow-500/50 bg-yellow-500/5 text-yellow-500",
  low: "border-blue-500/50 bg-blue-500/5 text-blue-500",
};

const impactStyles = {
  critical: "bg-red-500/10 border-red-500/20 text-red-800 text-red-800",
  medium:
    "bg-yellow-500/10 border-yellow-500/20 text-yellow-800 text-yellow-800",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-800 text-blue-800",
};

export default function ContextualAnalysis({ findings }: Props) {
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Lightbulb className="text-blue-600 text-blue-600" />
          Context Aware Analysis Results{" "}
          <span className="text-sm font-bold bg-gray-100 text-gray-700 text-gray-700 px-2 py-1 rounded-md">
            {findings.length} found
          </span>
        </h2>
        <p className="text-gray-700 text-gray-700 mt-1">
          Advanced security vulnerabilities identified through AI analysis.
        </p>
      </div>

      <div className="space-y-6">
        {findings.map((finding, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side: Vulnerability Details */}
              <div className="p-6 border-r">
                <div className="space-y-4">
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      severityStyles[finding.severity]
                    }`}
                  >
                    <ShieldAlert size={14} />
                    {finding.severity}
                  </span>
                  <h3 className="text-xl font-bold">{finding.title}</h3>
                  <p className="text-sm text-gray-700 text-gray-700 leading-relaxed">
                    {finding.description}
                  </p>
                  <div
                    className={`p-4 rounded-lg text-sm ${
                      impactStyles[finding.severity]
                    }`}
                  >
                    <p className="font-bold flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} /> Impact:
                    </p>
                    <p className="leading-relaxed">{finding.impact}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Implementation Guide */}
              <div className="bg-gray-100 p-6">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Code2 size={18} /> Implement Secure Solution
                </h4>
                <div className="prose prose-sm max-w-none bg-white text-gray-900 p-4 rounded-lg border">
                  {/* We use ReactMarkdown to render the implementation guide */}
                  <div className="text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="text-foreground mb-2">{children}</p>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 text-gray-900 p-3 rounded overflow-x-auto">
                            {children}
                          </pre>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-foreground space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside text-foreground space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-foreground">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-foreground font-semibold">
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {finding.implementation_guide}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-700 text-right">
                  Priority:{" "}
                  <span className="font-bold capitalize">
                    {finding.priority}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
