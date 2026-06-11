"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { EarlyFinishModal } from "@/components/roadmap/EarlyFinishModal";
import {
  FinishEarlyButton,
  type EarlyFinishFeedback,
} from "@/components/roadmap/FinishEarlyButton";
import { cn } from "@/lib/utils";
import type { ActionCompletion } from "@/lib/checkin/milestoneProgress";
import { isActionItemDoneEarly } from "@/lib/checkin/milestoneProgress";
import type { RoadmapMilestone } from "@/types";

interface AspirationCardObjectivesProps {
  roadmapId: string;
  milestone: RoadmapMilestone;
  completions: ActionCompletion[];
}

export function AspirationCardObjectives({
  roadmapId,
  milestone,
  completions,
}: AspirationCardObjectivesProps) {
  const router = useRouter();
  const [modalFeedback, setModalFeedback] =
    useState<EarlyFinishFeedback | null>(null);

  if (milestone.action_items.length === 0) return null;

  function handleModalClose() {
    setModalFeedback(null);
    router.refresh();
  }

  return (
    <>
      <ul className="mt-4 space-y-3 border-t border-border pt-4">
        {milestone.action_items.map((item, index) => {
          const done = isActionItemDoneEarly(
            completions,
            milestone.index,
            index
          );

          return (
            <li key={index} className="space-y-2">
              <div className="flex items-start gap-2">
                {done && (
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                )}
                <p
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    done
                      ? "text-text-muted line-through"
                      : "text-text-primary"
                  )}
                >
                  {item.task}
                </p>
              </div>
              {!done && (
                <FinishEarlyButton
                  roadmapId={roadmapId}
                  milestoneIndex={milestone.index}
                  actionItemIndex={index}
                  taskLabel={item.task}
                  onComplete={setModalFeedback}
                />
              )}
            </li>
          );
        })}
      </ul>

      <EarlyFinishModal
        open={modalFeedback !== null}
        type={modalFeedback?.type ?? "item"}
        message={modalFeedback?.message ?? ""}
        onClose={handleModalClose}
      />
    </>
  );
}
