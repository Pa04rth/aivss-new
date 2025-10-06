"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { UploadCloud, File, X, Loader2 } from "lucide-react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.name.endsWith(".py")) {
        setFile(selectedFile);
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

    try {
      const response = await fetch("/api/upload-and-scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Scan failed. Please try again.");
      }

      // On success, redirect to the dashboard. It will auto-refresh with the new scan.
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {file && (
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleScan}
          disabled={!file || isUploading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isUploading ? "Scanning..." : "Scan Now"}
        </button>
      </div>
    </div>
  );
}
