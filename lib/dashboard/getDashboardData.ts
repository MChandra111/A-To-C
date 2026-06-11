import {
  countMissedWeighIns,
  needsRecalibration,
} from "@/lib/checkin/accountability";
import {
  getMilestoneByIndex,
  getMilestoneObjectiveProgress,
} from "@/lib/checkin/milestone";
import {
  resolveCurrentMilestoneIndex,
  type ActionCompletion,
} from "@/lib/checkin/milestoneProgress";
import { FREE_MAX_ROADMAPS } from "@/lib/plans/constants";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { countUserRoadmaps } from "@/lib/plans/limits";
import {
  getStoredMilestonesForPlan,
  getTotalMilestoneCount,
} from "@/lib/plans/roadmapAccess";
import { createClient } from "@/lib/supabase/server";
import type { PlanTier } from "@/types";
import {
  daysSince,
  daysUntilEndDate,
  formatNextWeighIn,
  getWeighInStatus,
  monthsUntilEndDate,
  type WeighInWindowState,
} from "@/lib/dashboard/weighInSchedule";
import {
  averageLatestScores,
  buildOverallTrend,
  buildRoadmapTrend,
  detectDrift,
  latestScoreForRoadmap,
  type DriftAlertData,
  type ScorePoint,
  type TrendPeriod,
} from "@/lib/utils/scoreTrend";
import type {
  Aspiration,
  GapScoreData,
  RoadmapMilestone,
} from "@/types";

export interface DashboardRoadmap {
  id: string;
  aspiration_id: string;
  gap_score: GapScoreData | null;
  milestones: RoadmapMilestone[] | null;
  baseline_date: string | null;
  version: number;
}

export interface DashboardGoalCard {
  aspiration: Aspiration;
  roadmap: DashboardRoadmap;
  investmentScore: number;
  trend14: ScorePoint[];
  gapScore: number | null;
  daysRemaining: number;
  currentMilestone: RoadmapMilestone | null;
  currentMilestoneIndex: number;
  completions: ActionCompletion[];
  objectiveProgress: { done: number; total: number; remaining: number } | null;
  weighInOverdueDays: number;
  canWeighIn: boolean;
  weighInState: WeighInWindowState;
  scheduleMessage: string;
  nextDueLabel: string;
  nextDueDate: string;
  lastCheckinDaysAgo: number | null;
  missedWeighIns: number;
  showReEntryPrompt: boolean;
  showRecalibrationOffer: boolean;
  canUseFinishEarly: boolean;
}

export interface DashboardData {
  displayName: string;
  planTier: PlanTier;
  canCreateRoadmap: boolean;
  overallScore: number;
  trends: Record<TrendPeriod, ScorePoint[]>;
  driftAlert: DriftAlertData | null;
  streak: {
    current: number;
    longest: number;
    lastCheckinDaysAgo: number | null;
  };
  nextWeighInLabel: string | null;
  dueWeighIns: DashboardGoalCard[];
  activeGoals: DashboardGoalCard[];
  completedGoals: DashboardGoalCard[];
  archivedGoals: DashboardGoalCard[];
  hasAnyGoals: boolean;
}

function isAspirationCompleted(
  aspiration: Aspiration,
  reference = new Date()
): boolean {
  if (aspiration.status === "completed") return true;
  if (!aspiration.end_date) return false;
  const end = new Date(`${aspiration.end_date}T00:00:00`);
  return end < reference && aspiration.status === "active";
}

function pickLatestRoadmap(
  roadmaps: DashboardRoadmap[] | DashboardRoadmap | null
): DashboardRoadmap | null {
  if (!roadmaps) return null;
  const list = Array.isArray(roadmaps) ? roadmaps : [roadmaps];
  if (list.length === 0) return null;
  return [...list].sort((a, b) => b.version - a.version)[0] ?? null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, planTier, roadmapCount] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    getUserPlan(supabase, user.id),
    countUserRoadmaps(supabase, user.id),
  ]);

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "there";

  const { data: aspirations } = await supabase
    .from("aspirations")
    .select(
      `
      *,
      roadmaps (
        id,
        aspiration_id,
        gap_score,
        milestones,
        baseline_date,
        version
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: scoreRows } = await supabase
    .from("investment_scores")
    .select("roadmap_id, score, recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true });

  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_checkin_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: checkins } = await supabase
    .from("checkins")
    .select("roadmap_id, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const { data: allCompletions } = await supabase
    .from("completions")
    .select("roadmap_id, milestone_index, action_item_index, effort")
    .eq("user_id", user.id);

  const scores = scoreRows ?? [];
  const allAspirations = (aspirations ?? []) as (Aspiration & {
    roadmaps: DashboardRoadmap[] | DashboardRoadmap | null;
  })[];

  const activeAspirations = allAspirations.filter(
    (a) => a.status === "active" && !isAspirationCompleted(a)
  );
  const activeRoadmapIds = activeAspirations
    .map((a) => pickLatestRoadmap(a.roadmaps)?.id)
    .filter((id): id is string => Boolean(id));

  const trends: Record<TrendPeriod, ScorePoint[]> = {
    30: buildOverallTrend(scores, activeRoadmapIds, 30),
    60: buildOverallTrend(scores, activeRoadmapIds, 60),
    90: buildOverallTrend(scores, activeRoadmapIds, 90),
  };

  const overallScore = averageLatestScores(scores, activeRoadmapIds);

  const nearestGoalMonths =
    activeAspirations.length > 0
      ? Math.min(
          ...activeAspirations
            .filter((a) => a.end_date)
            .map((a) => monthsUntilEndDate(a.end_date!))
        )
      : null;

  const driftAlert = detectDrift(
    trends[30],
    14,
    nearestGoalMonths !== Infinity ? nearestGoalMonths : null
  );

  const lastCheckinDate = streakRow?.last_checkin_date
    ? new Date(`${streakRow.last_checkin_date}T00:00:00`)
    : checkins?.[0]
      ? new Date(checkins[0].completed_at)
      : null;

  const lastCheckinDaysAgo = lastCheckinDate
    ? daysSince(lastCheckinDate)
    : null;

  function buildGoalCard(
    aspiration: Aspiration & {
      roadmaps: DashboardRoadmap[] | DashboardRoadmap | null;
    }
  ): DashboardGoalCard | null {
    const roadmap = pickLatestRoadmap(aspiration.roadmaps);
    if (!roadmap) return null;

    const roadmapCheckins = (checkins ?? []).filter(
      (c) => c.roadmap_id === roadmap.id
    );
    const lastCheckin = roadmapCheckins[0]
      ? new Date(roadmapCheckins[0].completed_at)
      : null;

    const weighIn = getWeighInStatus(
      aspiration.interval!,
      lastCheckin,
      roadmap.baseline_date
    );

    const roadmapCompletions: ActionCompletion[] = (allCompletions ?? [])
      .filter((c) => c.roadmap_id === roadmap.id)
      .map((c) => ({
        milestone_index: c.milestone_index,
        action_item_index: c.action_item_index,
        effort: c.effort as ActionCompletion["effort"],
      }));

    const accessibleMilestones = getStoredMilestonesForPlan(
      roadmap.milestones,
      planTier
    );

    const milestoneIndex = resolveCurrentMilestoneIndex(
      accessibleMilestones,
      roadmapCompletions
    );

    const currentMilestone = getMilestoneByIndex(
      accessibleMilestones,
      milestoneIndex
    );
    const objectiveProgress = currentMilestone
      ? getMilestoneObjectiveProgress(currentMilestone, roadmapCompletions)
      : null;

    const cardLastCheckinDaysAgo = lastCheckin
      ? daysSince(lastCheckin)
      : null;

    const missedWeighIns = aspiration.interval
      ? countMissedWeighIns(
          aspiration.interval,
          lastCheckin,
          roadmap.baseline_date
        )
      : 0;

    const totalMilestones = getTotalMilestoneCount(roadmap, aspiration);
    const recalibrationOffer =
      aspiration.end_date && roadmap.baseline_date
        ? needsRecalibration(
            roadmap.baseline_date,
            aspiration.end_date,
            milestoneIndex,
            totalMilestones
          )
        : false;

    return {
      aspiration,
      roadmap,
      investmentScore: latestScoreForRoadmap(scores, roadmap.id),
      trend14: buildRoadmapTrend(scores, roadmap.id, 14),
      gapScore: roadmap.gap_score?.overall ?? null,
      daysRemaining: aspiration.end_date
        ? daysUntilEndDate(aspiration.end_date)
        : 0,
      currentMilestone,
      currentMilestoneIndex: milestoneIndex,
      completions: roadmapCompletions,
      objectiveProgress,
      weighInOverdueDays: weighIn.overdueDays,
      canWeighIn: weighIn.canWeighIn,
      weighInState: weighIn.state,
      scheduleMessage: weighIn.scheduleMessage,
      nextDueLabel: formatNextWeighIn(weighIn.nextDue),
      nextDueDate: weighIn.nextDue.toISOString(),
      lastCheckinDaysAgo: cardLastCheckinDaysAgo,
      missedWeighIns,
      showReEntryPrompt: missedWeighIns >= 2 && !weighIn.canWeighIn,
      showRecalibrationOffer: recalibrationOffer,
      canUseFinishEarly: isGuruPlan(planTier),
    };
  }

  const activeGoals = activeAspirations
    .map(buildGoalCard)
    .filter((g): g is DashboardGoalCard => g !== null)
    .sort((a, b) => {
      if (a.canWeighIn !== b.canWeighIn) return a.canWeighIn ? -1 : 1;
      if (a.weighInState === "overdue" && b.weighInState !== "overdue") return -1;
      if (b.weighInState === "overdue" && a.weighInState !== "overdue") return 1;
      return b.weighInOverdueDays - a.weighInOverdueDays;
    });

  const dueWeighIns = activeGoals.filter((g) => g.canWeighIn);

  const completedGoals = allAspirations
    .filter((a) => a.status === "completed" || isAspirationCompleted(a))
    .map(buildGoalCard)
    .filter((g): g is DashboardGoalCard => g !== null);

  const archivedGoals = allAspirations
    .filter((a) => a.status === "archived")
    .map(buildGoalCard)
    .filter((g): g is DashboardGoalCard => g !== null);

  let nextWeighInLabel: string | null = null;
  if (dueWeighIns.length > 0) {
    nextWeighInLabel =
      dueWeighIns.length === 1
        ? "Weigh-in open on your schedule"
        : `${dueWeighIns.length} weigh-ins open on your schedule`;
  } else if (activeGoals.length > 0) {
    const nextGoal = [...activeGoals].sort(
      (a, b) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    )[0];
    if (nextGoal) {
      nextWeighInLabel = `Next weigh-in opens ${nextGoal.nextDueLabel}`;
    }
  }

  const canCreateRoadmap =
    isGuruPlan(planTier) || roadmapCount < FREE_MAX_ROADMAPS;

  return {
    displayName,
    planTier,
    canCreateRoadmap,
    overallScore,
    trends,
    driftAlert,
    streak: {
      current: streakRow?.current_streak ?? 0,
      longest: streakRow?.longest_streak ?? 0,
      lastCheckinDaysAgo,
    },
    nextWeighInLabel,
    dueWeighIns,
    activeGoals,
    completedGoals,
    archivedGoals,
    hasAnyGoals: allAspirations.some((a) => pickLatestRoadmap(a.roadmaps)),
  };
}
