"use client";

import { useState } from "react";
import { GuruLockedButton } from "@/components/plans/GuruLockedButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EarlyFinishFeedback {
  type: "item" | "milestone";
  message: string;
}

interface FinishEarlyButtonProps {
  roadmapId: string;
  milestoneIndex: number;
  actionItemIndex: number;
  taskLabel: string;
  disabled?: boolean;
  canUse?: boolean;
  className?: string;
  onComplete?: (feedback: EarlyFinishFeedback) => void;
}

export function FinishEarlyButton({
  roadmapId,
  milestoneIndex,
  actionItemIndex,
  disabled,
  canUse = true,
  className,
  onComplete,
}: FinishEarlyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canUse) {
    return (
      <GuruLockedButton
        label="I finished this early"
        className={className}
      />
    );
  }

  async function handleFinishEarly() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/milestone/finish-early", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          milestone_index: milestoneIndex,
          action_item_index: actionItemIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");

      onComplete?.({
        type: data.feedback_type,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={handleFinishEarly}
        className="text-xs"
      >
        {loading ? "Saving…" : "I finished this early"}
      </Button>
      {error && <p className="text-xs text-decline">{error}</p>}
    </div>
  );
}
