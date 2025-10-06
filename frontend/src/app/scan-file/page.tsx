// frontend/src/app/scan-file/page.tsx
import UploadForm from "@/components/UploadForm";

export default function ScanFilePage() {
  return (
    <div className="p-8 space-y-12 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Codebase</h1>
        <p className="text-muted-foreground mt-2">
          Drag and drop a Python file or click to select one for security
          analysis.
        </p>
      </div>

      <UploadForm />

      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          What We Scan For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Static Analysis Column */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg">Static Analysis</h3>
            <ul className="space-y-3 text-muted-foreground text-sm list-disc list-inside">
              <li>Prompt injection vulnerabilities</li>
              <li>Insecure tool usage patterns</li>
              <li>Code execution risks (e.g., eval, exec)</li>
              <li>Data leakage potential</li>
            </ul>
          </div>
          {/* AI-Powered Analysis Column */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg">AI-Powered Analysis</h3>
            <ul className="space-y-3 text-muted-foreground text-sm list-disc list-inside">
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
