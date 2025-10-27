"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AIVSSAnalysis, AIVSSScores, AIVSSParameters } from "../../lib/types";
import {
  Shield,
  AlertTriangle,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface AIVSSAnalysisProps {
  aivssAnalysis: AIVSSAnalysis;
}

const AIVSSAnalysisComponent: React.FC<AIVSSAnalysisProps> = ({
  aivssAnalysis,
}) => {
  if (!aivssAnalysis.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            AIVSS Analysis Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {aivssAnalysis.message || "AIVSS analysis could not be completed."}
          </p>
          {aivssAnalysis.error && (
            <p className="text-sm text-red-600 text-red-600 mt-2">
              Error: {aivssAnalysis.error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const scores = aivssAnalysis.scores;
  const parameters = aivssAnalysis.parameters;

  const getScoreColor = (score: number) => {
    if (score >= 7.0) return "text-red-600 bg-red-50";
    if (score >= 4.0) return "text-orange-600 bg-orange-50";
    if (score >= 1.0) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 7.0) return "Critical";
    if (score >= 4.0) return "High";
    if (score >= 1.0) return "Medium";
    return "Low";
  };

  const getAARSFactorLabel = (value: number) => {
    if (value === 1.0) return "High";
    if (value === 0.5) return "Medium";
    return "Low";
  };

  const getAARSFactorColor = (value: number) => {
    if (value === 1.0) return "bg-red-100 text-red-800";
    if (value === 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      {/* AIVSS Scores Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AIVSS Security Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scores ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AIVSS Score */}
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">AIVSS</div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(
                    scores.aivssScore || 0
                  )}`}
                >
                  {scores.aivssScore?.toFixed(1) || "N/A"}
                </div>
                <Badge className={getScoreColor(scores.aivssScore || 0)}>
                  {getScoreLabel(scores.aivssScore || 0)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  AI Vulnerability Score
                </p>
              </div>

              {/* AARS Score */}
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">AARS</div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(
                    scores.aarsScore || 0
                  )}`}
                >
                  {scores.aarsScore?.toFixed(1) || "N/A"}
                </div>
                <Badge className={getScoreColor(scores.aarsScore || 0)}>
                  {getScoreLabel(scores.aarsScore || 0)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  AI Agent Risk Score
                </p>
              </div>

              {/* CVSS Score */}
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">CVSS</div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(
                    scores.cvssScore || 0
                  )}`}
                >
                  {scores.cvssScore?.toFixed(1) || "N/A"}
                </div>
                <Badge className={getScoreColor(scores.cvssScore || 0)}>
                  {getScoreLabel(scores.cvssScore || 0)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Traditional Security Score
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">
                AIVSS Calculator API is not responding. Scores unavailable.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vector Strings */}
      {scores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Vector Strings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  CVSS Vector
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-black font-mono text-sm break-all">
                  {scores.cvssVectorString}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  AIVSS Vector
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-black text-sm break-all">
                  {scores.aivssVectorString}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AARS Factors */}
      {parameters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              AI Agent Risk Factors (AARS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(parameters.aars).map(([factor, value]) => (
                <div
                  key={factor}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {factor.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-gray-600">Value: {value}</div>
                  </div>
                  <Badge className={getAARSFactorColor(value)}>
                    {getAARSFactorLabel(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CVSS Parameters */}
      {parameters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              CVSS v4.0 Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(parameters.cvss).map(([param, value]) => (
                <div key={param} className="text-center p-3 border rounded-lg">
                  <div className="font-mono text-lg font-bold">{value}</div>
                  <div className="text-sm text-gray-600">{param}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Threat Multiplier:</strong>{" "}
                {parameters.threatMultiplier}
                {parameters.threatMultiplier === 1.0 && " (Actively Exploited)"}
                {parameters.threatMultiplier === 0.97 && " (Proof of Concept)"}
                {parameters.threatMultiplier === 0.91 && " (Unreported)"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Report Download */}
      {scores?.reportUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Detailed Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">AIVSS Detailed Report</div>
                <div className="text-sm text-gray-600">
                  Comprehensive PDF analysis with detailed scoring breakdown
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(scores.reportUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = scores.reportUrl;
                    link.download = `AIVSS-Report-${
                      new Date().toISOString().split("T")[0]
                    }.pdf`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {aivssAnalysis.apiCallSuccessful ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Analysis Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Call Status:</span>
              <Badge
                className={
                  aivssAnalysis.apiCallSuccessful
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {aivssAnalysis.apiCallSuccessful ? "Successful" : "Failed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Analysis Timestamp:</span>
              <span className="text-sm text-gray-600">
                {new Date(aivssAnalysis.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Message:</span>
              <span className="text-sm text-gray-600">
                {aivssAnalysis.message}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIVSSAnalysisComponent;
