import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { resolveCurrentMilestoneIndex } from "@/lib/checkin/milestoneProgress";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
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

  const aspiration = roadmap.aspirations as Aspiration | null;
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

  const milestones = roadmap.milestones as RoadmapMilestone[] | null;
  const currentMilestoneIndex = resolveCurrentMilestoneIndex(
    milestones,
    completions
  );

  return (
    <RoadmapView
      roadmap={roadmap as Roadmap}
      aspiration={aspiration}
      investmentScore={latestScore?.score ?? 0}
      completions={completions}
      currentMilestoneIndex={currentMilestoneIndex}
      showRecalibrate={recalibrate === "1"}
    />
  );
}
