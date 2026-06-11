export interface ScorePoint {
  date: string;
  score: number;
}

export type TrendPeriod = 30 | 60 | 90;

export interface InvestmentScoreRow {
  roadmap_id: string;
  score: number;
  recorded_at: string;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Latest score per roadmap as of a given calendar day. */
function scoreAsOf(
  rows: InvestmentScoreRow[],
  roadmapId: string,
  asOf: Date
): number | null {
  const cutoff = startOfDay(asOf).getTime();
  const relevant = rows.filter(
    (r) =>
      r.roadmap_id === roadmapId &&
      startOfDay(new Date(r.recorded_at)).getTime() <= cutoff
  );
  if (relevant.length === 0) return null;
  return relevant[relevant.length - 1]!.score;
}

/** Build a daily trend by averaging the latest score per active roadmap. */
export function buildOverallTrend(
  rows: InvestmentScoreRow[],
  activeRoadmapIds: string[],
  period: TrendPeriod,
  reference = new Date()
): ScorePoint[] {
  const today = startOfDay(reference);
  const points: ScorePoint[] = [];

  for (let i = period - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    let sum = 0;
    let count = 0;

    for (const roadmapId of activeRoadmapIds) {
      const score = scoreAsOf(rows, roadmapId, day);
      if (score !== null) {
        sum += score;
        count++;
      }
    }

    points.push({
      date: toDateString(day),
      score: count > 0 ? Math.round(sum / count) : 0,
    });
  }

  return points;
}

/** Build a daily trend for a single roadmap. */
export function buildRoadmapTrend(
  rows: InvestmentScoreRow[],
  roadmapId: string,
  period: number,
  reference = new Date()
): ScorePoint[] {
  const today = startOfDay(reference);
  const points: ScorePoint[] = [];

  for (let i = period - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const score = scoreAsOf(rows, roadmapId, day);
    points.push({
      date: toDateString(day),
      score: score ?? 0,
    });
  }

  return points;
}

export function averageLatestScores(
  rows: InvestmentScoreRow[],
  roadmapIds: string[]
): number {
  if (roadmapIds.length === 0) return 0;

  let sum = 0;
  let count = 0;

  for (const roadmapId of roadmapIds) {
    const roadmapRows = rows.filter((r) => r.roadmap_id === roadmapId);
    if (roadmapRows.length > 0) {
      sum += roadmapRows[roadmapRows.length - 1]!.score;
      count++;
    }
  }

  return count > 0 ? Math.round(sum / count) : 0;
}

export function latestScoreForRoadmap(
  rows: InvestmentScoreRow[],
  roadmapId: string
): number {
  const roadmapRows = rows.filter((r) => r.roadmap_id === roadmapId);
  if (roadmapRows.length === 0) return 0;
  return roadmapRows[roadmapRows.length - 1]!.score;
}

export interface DriftAlertData {
  scoreFrom: number;
  scoreTo: number;
  daysWindow: number;
  monthsToGoal: number | null;
}

/** Detect a 15+ point drop over a rolling window (default 14 days). */
export function detectDrift(
  trend: ScorePoint[],
  windowDays = 14,
  nearestGoalMonths: number | null = null
): DriftAlertData | null {
  if (trend.length < windowDays + 1) return null;

  const current = trend[trend.length - 1]!.score;
  const past = trend[trend.length - 1 - windowDays]!.score;
  const drop = past - current;

  if (drop < 15) return null;

  return {
    scoreFrom: past,
    scoreTo: current,
    daysWindow: windowDays,
    monthsToGoal: nearestGoalMonths,
  };
}
