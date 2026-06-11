import { FREE_UNLOCKED_MILESTONES } from "@/lib/plans/constants";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { getTotalMilestoneCount } from "@/lib/plans/roadmapAccess";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoadmapMilestone } from "@/types";

export async function assertMilestoneAccessible(
  supabase: SupabaseClient,
  userId: string,
  roadmap: {
    milestones: RoadmapMilestone[] | null;
    total_milestone_count?: number | null;
  },
  milestoneIndex: number
): Promise<void> {
  const plan = await getUserPlan(supabase, userId);
  if (isGuruPlan(plan)) return;

  if (milestoneIndex >= FREE_UNLOCKED_MILESTONES) {
    throw new Error("This interval requires the Guru plan.");
  }

  const stored = roadmap.milestones ?? [];
  const exists = stored.some((m) => m.index === milestoneIndex);
  if (!exists) {
    throw new Error("Invalid milestone.");
  }

  const total = getTotalMilestoneCount(roadmap);
  if (milestoneIndex >= total) {
    throw new Error("Invalid milestone.");
  }
}
