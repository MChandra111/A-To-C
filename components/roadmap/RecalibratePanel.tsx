"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHECK_IN_INTERVALS } from "@/types";

interface RecalibratePanelProps {
  roadmapId: string;
  aspirationTitle: string;
  currentEndDate: string | null;
  currentInterval: string | null;
  defaultOpen?: boolean;
}

export function RecalibratePanel({
  roadmapId,
  aspirationTitle,
  currentEndDate,
  currentInterval,
  defaultOpen = false,
}: RecalibratePanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [endDate, setEndDate] = useState(currentEndDate ?? "");
  const [interval, setInterval] = useState(currentInterval ?? "weekly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRecalibrate() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/roadmap/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          new_end_date: endDate || undefined,
          new_interval: interval || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Recalibration failed");
      }

      setMessage(data.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recalibration failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline"
      >
        Recalculate roadmap from current position →
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Recalibration
        </p>
        <p className="mt-1 text-sm text-text-primary">
          Claude will rebuild remaining milestones for{" "}
          <span className="font-medium">{aspirationTitle}</span>. Completed
          periods and your Investment Score history are preserved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recalEndDate">End date</Label>
          <Input
            id="recalEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recalInterval">Weigh-in interval</Label>
          <select
            id="recalInterval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
          >
            {CHECK_IN_INTERVALS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-decline" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleRecalibrate} disabled={loading}>
          {loading ? "Recalculating…" : "Recalculate from here"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
