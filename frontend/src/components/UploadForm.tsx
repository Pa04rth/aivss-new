"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, Loader2, Save } from "lucide-react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [scanName, setScanName] = useState(""); // New state for the scan name
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.name.endsWith(".py")) {
        setFile(selectedFile);
        // Pre-fill the scan name with a default value
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

  const handleScan = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    // We can add the scanName to the form data if the backend needs it later
    // formData.append("scanName", scanName);

    try {
      const response = await fetch("/api/upload-and-scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Scan failed. Please try again.");
      }

      const result = await response.json();

      // On success, redirect to the new "in progress" page with the specific scan ID
      if (result.scan_id !== undefined) {
        router.push(`/my-scans/${result.scan_id}`);
      } else {
        // Fallback in case the backend doesn't return an ID
        router.push("/my-scans");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setScanName("");
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* --- UPLOAD DROPZONE (No changes here) --- */}
      <div
        {...getRootProps()}
        className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Drop your codebase files here</p>
        <p className="text-sm text-muted-foreground/80">
          or click to browse files
        </p>
        <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold">
          Choose Files
        </button>
      </div>

      {/* --- NEW "SELECTED FILES" SECTION --- */}
      {file && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Selected Files ({file ? 1 : 0})
            </h3>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between transition-all duration-300">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* --- NEW "SCAN NAME" INPUT --- */}
          <div>
            <label
              htmlFor="scanName"
              className="block text-lg font-semibold mb-3"
            >
              Scan Name{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (Optional)
              </span>
            </label>
            <input
              id="scanName"
              type="text"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              placeholder="Enter a name for this scan..."
              className="w-full px-4 py-3 bg-card border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          {/* --- UPDATED "START SCAN" BUTTON --- */}
          <div className="pt-4 border-t">
            <button
              onClick={handleScan}
              disabled={!file || isUploading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base hover:bg-primary/90 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isUploading ? "Starting Scan..." : "Start Security Scan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
