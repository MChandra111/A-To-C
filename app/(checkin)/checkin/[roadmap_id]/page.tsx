import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CheckInSteps } from "@/components/checkin/CheckInSteps";
import { WeighInNotDue } from "@/components/checkin/WeighInNotDue";
import { validateWeighInWindow } from "@/lib/checkin/weighInGate";
import { getMilestoneByIndex } from "@/lib/checkin/milestone";
import { resolveCurrentMilestoneIndex } from "@/lib/checkin/milestoneProgress";
import { formatNextWeighIn } from "@/lib/dashboard/weighInSchedule";
import type { Aspiration, RoadmapMilestone } from "@/types";

interface CheckinPageProps {
  params: Promise<{ roadmap_id: string }>;
}

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { roadmap_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", roadmap_id)
    .single();

  if (!roadmap) notFound();

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user.id) notFound();

  if (aspiration.status !== "active") {
    redirect("/dashboard");
  }

  if (!aspiration.interval || !roadmap.baseline_date) notFound();

  const milestones = roadmap.milestones as RoadmapMilestone[] | null;

  const [{ data: checkins }, { data: completionRows }, { data: latestScore }] =
    await Promise.all([
      supabase
        .from("checkins")
        .select("completed_at")
        .eq("roadmap_id", roadmap_id)
        .order("completed_at", { ascending: false }),
      supabase
        .from("completions")
        .select("milestone_index, action_item_index, effort")
        .eq("roadmap_id", roadmap_id),
      supabase
        .from("investment_scores")
        .select("score")
        .eq("roadmap_id", roadmap_id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const completions = (completionRows ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as "done" | "partial" | "skipped",
  }));

  const lastCheckin = checkins?.[0]
    ? new Date(checkins[0].completed_at)
    : null;

  const gate = validateWeighInWindow(
    aspiration.interval,
    lastCheckin,
    roadmap.baseline_date
  );

  if (!gate.allowed) {
    return (
      <WeighInNotDue
        aspirationTitle={aspiration.title}
        scheduleMessage={gate.status.scheduleMessage}
        nextDueLabel={formatNextWeighIn(gate.status.nextDue)}
        state={gate.status.state}
      />
    );
  }

  const milestoneIndex = resolveCurrentMilestoneIndex(milestones, completions);

  const milestone = getMilestoneByIndex(milestones, milestoneIndex);
  if (!milestone || milestone.action_items.length === 0) notFound();

  return (
    <CheckInSteps
      roadmapId={roadmap_id}
      aspirationTitle={aspiration.title}
      currentScore={latestScore?.score ?? 0}
      milestoneIndex={milestoneIndex}
      milestone={milestone}
      scheduleMessage={gate.status.scheduleMessage}
      completions={completions}
    />
  );
}
