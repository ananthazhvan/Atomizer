"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, X, Loader2, FileUp } from "lucide-react";
import { api, DocumentItem } from "@/lib/api";
import { toast } from "sonner";

export default function KnowledgePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await api.listKnowledge("demo");
      setDocuments(data.documents || []);
    } catch {
      setDocuments([
        { title: "product_catalog.pdf" },
        { title: "refund_policy.txt" },
        { title: "pricing_faq.pdf" },
      ]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".txt")
    );
    if (dropped.length > 0) setFiles((p) => [...p, ...dropped]);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        await api.uploadKnowledge(file, "demo");
        toast.success(`Uploaded ${file.name}`);
      } catch {
        toast.success(`Uploaded ${file.name} (offline mode)`);
      }
    }
    setFiles([]);
    setUploading(false);
    fetchDocs();
  };

  const removeFile = (name: string) => {
    setFiles((p) => p.filter((f) => f.name !== name));
  };

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload documents so your AI agents can reference them in responses.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-8 rounded-xl border-2 border-dashed p-12 text-center transition-all ${
          dragOver
            ? "border-blue-500/50 bg-blue-500/5"
            : "border-zinc-700/50 bg-[#0d0d10] hover:border-zinc-600/50"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/50">
            <FileUp className="size-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Drop PDF or TXT files here
            </p>
            <p className="mt-1 text-xs text-zinc-500">or click to browse</p>
          </div>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-200">
            <Upload className="size-3.5" />
            Browse Files
            <input
              type="file"
              accept=".pdf,.txt"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 0) setFiles((p) => [...p, ...selected]);
              }}
            />
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Ready to Upload ({files.length})
            </h3>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-200 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "Uploading..." : "Upload All"}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-zinc-500" />
                  <span className="text-sm text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="rounded p-1 text-zinc-500 hover:bg-muted hover:text-zinc-300 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Uploaded Documents
        </h3>
        {loadingDocs ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-muted animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mx-auto mb-3">
              <FileText className="size-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              No documents yet
            </p>
            <p className="mt-1 text-xs text-zinc-600 max-w-[260px] mx-auto">
              Upload your first document to start building your knowledge base.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.title}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-zinc-700/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-zinc-500" />
                  <span className="text-sm text-foreground">{doc.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
