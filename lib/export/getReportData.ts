import { getDashboardData } from "@/lib/dashboard/getDashboardData";
import {
  getLastFullyCompletedMilestoneIndex,
  resolveCurrentMilestoneIndex,
  type ActionCompletion,
} from "@/lib/checkin/milestoneProgress";
import { createClient } from "@/lib/supabase/server";
import { buildRoadmapTrend } from "@/lib/utils/scoreTrend";
import type {
  CheckInReportRow,
  DashboardReportData,
  GoalReportSection,
  MilestoneSummaryRow,
  PerformanceReportData,
  RoadmapReportData,
} from "@/lib/export/reportTypes";
import type { Aspiration, RoadmapMilestone } from "@/types";

function toGoalSection(
  goal: NonNullable<Awaited<ReturnType<typeof getDashboardData>>>["activeGoals"][0],
  weighInCount: number
): GoalReportSection {
  const trend = goal.trend14;
  const trendDelta14 =
    trend.length >= 2 ? trend[trend.length - 1]!.score - trend[0]!.score : null;

  return {
    title: goal.aspiration.title,
    category: goal.aspiration.category,
    investmentScore: goal.investmentScore,
    gapScore: goal.gapScore,
    daysRemaining: goal.daysRemaining,
    currentMilestone: goal.currentMilestone?.label ?? null,
    trendDelta14,
    weighInCount,
    endDate: goal.aspiration.end_date,
  };
}

export async function getDashboardReportData(): Promise<DashboardReportData | null> {
  const data = await getDashboardData();
  if (!data) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: checkinCounts } = await supabase
    .from("checkins")
    .select("roadmap_id")
    .eq("user_id", user.id);

  const countByRoadmap = new Map<string, number>();
  for (const row of checkinCounts ?? []) {
    countByRoadmap.set(
      row.roadmap_id,
      (countByRoadmap.get(row.roadmap_id) ?? 0) + 1
    );
  }

  const trend30 = data.trends[30];
  const trend30Delta =
    trend30.length >= 2
      ? trend30[trend30.length - 1]!.score - trend30[0]!.score
      : null;

  return {
    type: "dashboard",
    displayName: data.displayName,
    generatedAt: new Date().toISOString(),
    overallScore: data.overallScore,
    trend30Delta,
    streak: data.streak.current,
    longestStreak: data.streak.longest,
    activeGoals: data.activeGoals.map((g) =>
      toGoalSection(g, countByRoadmap.get(g.roadmap.id) ?? 0)
    ),
    completedGoals: data.completedGoals.map((g) =>
      toGoalSection(g, countByRoadmap.get(g.roadmap.id) ?? 0)
    ),
  };
}

export async function getRoadmapReportData(
  roadmapId: string
): Promise<RoadmapReportData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "there";

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", roadmapId)
    .single();

  if (!roadmap) return null;

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user.id) return null;

  const [{ data: scoreRows }, { data: checkinRows }, { data: completionRows }] =
    await Promise.all([
      supabase
        .from("investment_scores")
        .select("roadmap_id, score, recorded_at")
        .eq("roadmap_id", roadmapId)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("checkins")
        .select("completed_at, score_before, score_after")
        .eq("roadmap_id", roadmapId)
        .order("completed_at", { ascending: false })
        .limit(20),
      supabase
        .from("completions")
        .select("milestone_index, action_item_index, effort")
        .eq("roadmap_id", roadmapId),
    ]);

  const completions: ActionCompletion[] = (completionRows ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as ActionCompletion["effort"],
  }));

  const milestones = (roadmap.milestones ?? []) as RoadmapMilestone[];
  const currentIndex = resolveCurrentMilestoneIndex(milestones, completions);
  const lastCompleted = getLastFullyCompletedMilestoneIndex(
    milestones,
    completions
  );

  const milestoneSummary: MilestoneSummaryRow[] = [...milestones]
    .sort((a, b) => a.index - b.index)
    .map((m) => ({
      label: m.label,
      title: m.title,
      status:
        m.index <= lastCompleted
          ? "complete"
          : m.index === currentIndex
            ? "current"
            : "upcoming",
    }));

  const scores = (scoreRows ?? []).map((r) => ({
    roadmap_id: r.roadmap_id,
    score: r.score,
    recorded_at: r.recorded_at,
  }));

  const trend30 = buildRoadmapTrend(scores, roadmapId, 30);
  const gapScore = roadmap.gap_score as { overall?: number } | null;

  const checkIns: CheckInReportRow[] = (checkinRows ?? []).map((c) => ({
    date: new Date(c.completed_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    scoreAfter: c.score_after,
    delta:
      c.score_before != null && c.score_after != null
        ? c.score_after - c.score_before
        : null,
  }));

  return {
    type: "roadmap",
    displayName,
    generatedAt: new Date().toISOString(),
    aspirationTitle: aspiration.title,
    category: aspiration.category,
    investmentScore:
      scores.length > 0 ? scores[scores.length - 1]!.score : 0,
    gapScore: gapScore?.overall ?? null,
    baselineDate: roadmap.baseline_date,
    endDate: aspiration.end_date,
    interval: aspiration.interval,
    gapAnalysis: roadmap.gap_analysis,
    trend30Start: trend30[0]?.score ?? null,
    trend30End: trend30[trend30.length - 1]?.score ?? null,
    checkIns,
    milestones: milestoneSummary,
  };
}

export async function getPerformanceReportData(
  scope: "dashboard" | "roadmap",
  roadmapId?: string
): Promise<PerformanceReportData | null> {
  if (scope === "roadmap") {
    if (!roadmapId) return null;
    return getRoadmapReportData(roadmapId);
  }
  return getDashboardReportData();
}
