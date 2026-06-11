import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { resolveCurrentMilestoneIndex } from "@/lib/checkin/milestoneProgress";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import {
  ensureRoadmapsUnlockedForUser,
  freeRoadmapNeedsIntervalRepair,
  repairFreeRoadmapIntervals,
  roadmapNeedsGuruUnlock,
} from "@/lib/plans/unlockRoadmaps";
import {
  getStoredMilestonesForPlan,
  resolveRoadmapMilestones,
  sanitizeRoadmapForPlan,
} from "@/lib/plans/roadmapAccess";
import type { Aspiration, Roadmap, RoadmapMilestone } from "@/types";

interface RoadmapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ recalibrate?: string }>;
}

export default async function RoadmapPage({
  params,
  searchParams,
}: RoadmapPageProps) {
  const { id } = await params;
  const { recalibrate } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", id)
    .single();

  if (!roadmap) notFound();

  let aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user!.id) notFound();

  const [{ data: latestScore }, { data: completionRows }] = await Promise.all([
    supabase
      .from("investment_scores")
      .select("score")
      .eq("roadmap_id", id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("completions")
      .select("milestone_index, action_item_index, effort")
      .eq("roadmap_id", id),
  ]);

  const completions = (completionRows ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as "done" | "partial" | "skipped",
  }));

  const planTier = await getUserPlan(supabase, user!.id);

  if (
    !isGuruPlan(planTier) &&
    freeRoadmapNeedsIntervalRepair(roadmap as Roadmap, aspiration)
  ) {
    await repairFreeRoadmapIntervals(user!.id, id);
    const { data: repaired } = await supabase
      .from("roadmaps")
      .select("*, aspirations(*)")
      .eq("id", id)
      .single();
    if (repaired) {
      Object.assign(roadmap, repaired);
      aspiration = repaired.aspirations as Aspiration;
    }
  }

  if (
    isGuruPlan(planTier) &&
    roadmapNeedsGuruUnlock(roadmap as Roadmap, aspiration)
  ) {
    await ensureRoadmapsUnlockedForUser(user!.id);
    const { data: refreshed } = await supabase
      .from("roadmaps")
      .select("*, aspirations(*)")
      .eq("id", id)
      .single();
    if (refreshed) {
      Object.assign(roadmap, refreshed);
      aspiration = refreshed.aspirations as Aspiration;
    }
  }

  const storedMilestones = getStoredMilestonesForPlan(
    roadmap.milestones as RoadmapMilestone[] | null,
    planTier
  );
  const resolved = resolveRoadmapMilestones(
    roadmap as Roadmap,
    aspiration,
    planTier
  );
  const currentMilestoneIndex = resolveCurrentMilestoneIndex(
    storedMilestones,
    completions
  );

  const sanitizedRoadmap = sanitizeRoadmapForPlan(
    {
      ...(roadmap as Roadmap),
      milestones: resolved.milestones,
    },
    planTier
  );

  return (
    <RoadmapView
      roadmap={sanitizedRoadmap}
      aspiration={aspiration}
      investmentScore={latestScore?.score ?? 0}
      completions={completions}
      currentMilestoneIndex={currentMilestoneIndex}
      showRecalibrate={recalibrate === "1"}
      planTier={planTier}
      lockedFromIndex={resolved.lockedFromIndex}
      hasLockedMilestones={resolved.hasLockedMilestones}
    />
  );
}
