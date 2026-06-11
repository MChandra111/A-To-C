"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareRoadmapButtonProps {
  roadmapId: string;
}

export function ShareRoadmapButton({ roadmapId }: ShareRoadmapButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/roadmap/${roadmapId}/share`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create share link");
      }

      const url = `${window.location.origin}/share/${data.share_token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? "Creating link…" : copied ? "Link copied" : "Share progress"}
      </Button>
      <p className="text-xs text-text-muted">
        Partners see your Investment Score trend and weigh-in history — not
        journal entries.
      </p>
      {error && (
        <p className="text-xs text-decline" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
