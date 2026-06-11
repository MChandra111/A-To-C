"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface RepairProgressButtonProps {
  roadmapId: string;
}

export function RepairProgressButton({ roadmapId }: RepairProgressButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRepair() {
    if (
      !confirm(
        "Reset all progress to Week 1? This deletes check-ins, objective completions, and restores your baseline score of 0."
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/roadmap/${roadmapId}/repair-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_all: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setMessage(data.current_milestone_hint ?? "Progress reset.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 p-4">
      <p className="text-sm text-text-muted">
        Progress ahead of where it should be? Reset to your first milestone,
        clear all objective completions, and restore baseline score 0.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={loading}
        onClick={handleRepair}
      >
        {loading ? "Resetting…" : "Reset all progress"}
      </Button>
      {message && (
        <p
          className={`mt-2 font-mono text-xs ${
            message.toLowerCase().includes("fail") ||
            message.includes("Could not") ||
            message.includes("migration")
              ? "text-decline"
              : "text-success"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
