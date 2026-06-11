"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EarlyFinishModal } from "@/components/roadmap/EarlyFinishModal";
import type { EarlyFinishFeedback } from "@/components/roadmap/FinishEarlyButton";
import { MilestoneCard } from "@/components/roadmap/MilestoneCard";
import type { ActionCompletion } from "@/lib/checkin/milestoneProgress";
import {
  getMilestoneObjectiveProgress,
  isActionItemDoneEarly,
  isMilestoneFullyDone,
} from "@/lib/checkin/milestoneProgress";
import type { RoadmapMilestone } from "@/types";

interface MilestoneTimelineProps {
  roadmapId: string;
  milestones: RoadmapMilestone[];
  completions: ActionCompletion[];
  currentMilestoneIndex: number;
}

export function MilestoneTimeline({
  roadmapId,
  milestones,
  completions,
  currentMilestoneIndex,
}: MilestoneTimelineProps) {
  const router = useRouter();
  const [modalFeedback, setModalFeedback] =
    useState<EarlyFinishFeedback | null>(null);

  function handleEarlyFinishComplete(feedback: EarlyFinishFeedback) {
    setModalFeedback(feedback);
  }

  function handleModalClose() {
    setModalFeedback(null);
    router.refresh();
  }

  const sorted = [...milestones].sort((a, b) => a.index - b.index);

  return (
    <>
      <div className="space-y-4">
        {sorted.map((milestone) => {
          const isCurrent = milestone.index === currentMilestoneIndex;
          const isPast = milestone.index < currentMilestoneIndex;
          const progress = getMilestoneObjectiveProgress(milestone, completions);
          const fullyDone = isMilestoneFullyDone(milestone, completions);

          const itemStates = milestone.action_items.map((_, idx) => ({
            done: isActionItemDoneEarly(completions, milestone.index, idx),
          }));

          return (
            <MilestoneCard
              key={milestone.index}
              milestone={milestone}
              roadmapId={roadmapId}
              isCurrent={isCurrent}
              isPast={isPast}
              progress={progress}
              fullyDone={fullyDone}
              itemStates={itemStates}
              onEarlyFinishComplete={handleEarlyFinishComplete}
            />
          );
        })}
      </div>

      <EarlyFinishModal
        open={modalFeedback !== null}
        type={modalFeedback?.type ?? "item"}
        message={modalFeedback?.message ?? ""}
        onClose={handleModalClose}
      />
    </>
  );
}
