"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EarlyFinishModal } from "@/components/roadmap/EarlyFinishModal";
import {
  FinishEarlyButton,
  type EarlyFinishFeedback,
} from "@/components/roadmap/FinishEarlyButton";
import { ObjectiveActionItem } from "@/components/roadmap/ObjectiveActionItem";
import type { ActionCompletion } from "@/lib/checkin/milestoneProgress";
import { isActionItemDoneEarly } from "@/lib/checkin/milestoneProgress";
import type { RoadmapMilestone } from "@/types";

interface AspirationCardObjectivesProps {
  roadmapId: string;
  milestone: RoadmapMilestone;
  completions: ActionCompletion[];
  canUseFinishEarly?: boolean;
}

export function AspirationCardObjectives({
  roadmapId,
  milestone,
  completions,
  canUseFinishEarly = true,
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
      <ul className="mt-4 space-y-4 border-t border-border pt-4">
        {milestone.action_items.map((item, index) => {
          const done = isActionItemDoneEarly(
            completions,
            milestone.index,
            index
          );

          return (
            <ObjectiveActionItem
              key={index}
              item={item}
              done={done}
              actions={
                !done ? (
                  <FinishEarlyButton
                    roadmapId={roadmapId}
                    milestoneIndex={milestone.index}
                    actionItemIndex={index}
                    taskLabel={item.task}
                    canUse={canUseFinishEarly}
                    onComplete={setModalFeedback}
                  />
                ) : undefined
              }
            />
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
