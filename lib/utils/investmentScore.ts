import { countCheckIns } from "@/lib/utils/dateHelpers";
import type { CheckInInterval } from "@/types";

export type EffortLevel = "done" | "partial" | "skipped";

export interface ScoreCheckin {
  completed_at: string;
}

export interface ScoreCompletion {
  effort: EffortLevel;
  completed_at: string;
}

export interface ComputeInvestmentScoreInput {
  interval: CheckInInterval;
  baselineDate: string;
  checkins: ScoreCheckin[];
  completions: ScoreCompletion[];
  currentStreak: number;
  reference?: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function effortValue(effort: EffortLevel): number {
  switch (effort) {
    case "done":
      return 1;
    case "partial":
      return 0.5;
    case "skipped":
      return 0;
  }
}

/** Completion rate component — up to 50 points. */
function completionPoints(
  interval: CheckInInterval,
  baselineDate: string,
  checkins: ScoreCheckin[],
  reference: Date
): number {
  const windowStart = new Date(reference);
  windowStart.setDate(windowStart.getDate() - 30);

  const baseline = startOfDay(new Date(`${baselineDate}T00:00:00`));
  const periodStart = windowStart > baseline ? windowStart : baseline;

  const expected = countCheckIns(periodStart, reference, interval);
  const completed = checkins.filter(
    (c) => new Date(c.completed_at) >= periodStart
  ).length;

  if (expected <= 0) {
    return completed > 0 ? 50 : 0;
  }

  const rate = Math.min(1, completed / expected);
  return rate * 50;
}

/** Effort quality component — up to 30 points. */
function effortPoints(
  completions: ScoreCompletion[],
  reference: Date
): number {
  const windowStart = new Date(reference);
  windowStart.setDate(windowStart.getDate() - 30);

  const recent = completions.filter(
    (c) => new Date(c.completed_at) >= windowStart
  );

  if (recent.length === 0) return 0;

  const avg =
    recent.reduce((sum, c) => sum + effortValue(c.effort), 0) / recent.length;
  return avg * 30;
}

/** Logarithmic streak bonus — up to 20 points. */
function streakPoints(streak: number): number {
  if (streak <= 0) return 0;
  const normalized = Math.log10(streak + 1) / Math.log10(11);
  return Math.min(20, Math.round(normalized * 20));
}

export function computeInvestmentScore(
  input: ComputeInvestmentScoreInput
): number {
  const reference = input.reference ?? new Date();

  const completion = completionPoints(
    input.interval,
    input.baselineDate,
    input.checkins,
    reference
  );
  const effort = effortPoints(input.completions, reference);
  const streak = streakPoints(input.currentStreak);

  return Math.max(0, Math.min(100, Math.round(completion + effort + streak)));
}
