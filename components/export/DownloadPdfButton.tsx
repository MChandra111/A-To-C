"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DownloadPdfButtonProps {
  scope: "dashboard" | "roadmap";
  roadmapId?: string;
  label?: string;
  size?: "sm" | "default";
}

async function downloadPdf(url: string, fallbackName: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : "PDF export failed"
    );
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function DownloadPdfButton({
  scope,
  roadmapId,
  label,
  size = "sm",
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ scope });
      if (roadmapId) params.set("roadmap_id", roadmapId);
      await downloadPdf(
        `/api/user/export/pdf?${params.toString()}`,
        scope === "dashboard"
          ? "a-to-c-dashboard.pdf"
          : "a-to-c-goal-report.pdf"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? "Generating PDF…" : (label ?? "Download report (PDF)")}
      </Button>
      {error && (
        <p className="text-xs text-decline" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
