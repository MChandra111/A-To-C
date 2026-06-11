"use client";

import { useState } from "react";
import { DownloadPdfButton } from "@/components/export/DownloadPdfButton";
import { Button } from "@/components/ui/button";

export function ExportDataPanel() {
  const [downloading, setDownloading] = useState(false);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const res = await fetch("/api/user/scores?format=csv");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "investment-scores.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user can retry
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Save a performance report PDF or export raw score readings as CSV.
        Reports focus on your numbers and trends — not your task list.
      </p>
      <div className="flex flex-wrap items-start gap-3">
        <DownloadPdfButton scope="dashboard" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadCsv}
          disabled={downloading}
        >
          {downloading ? "Downloading…" : "Download scores (CSV)"}
        </Button>
      </div>
      <p className="font-mono text-xs text-text-muted">
        JSON API: GET /api/user/scores — TODO (V2): API key auth
      </p>
    </div>
  );
}
