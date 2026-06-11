export interface GoalReportSection {
  title: string;
  category: string | null;
  investmentScore: number;
  gapScore: number | null;
  daysRemaining: number;
  currentMilestone: string | null;
  trendDelta14: number | null;
  weighInCount: number;
  endDate: string | null;
}

export interface DashboardReportData {
  type: "dashboard";
  displayName: string;
  generatedAt: string;
  overallScore: number;
  trend30Delta: number | null;
  streak: number;
  longestStreak: number;
  activeGoals: GoalReportSection[];
  completedGoals: GoalReportSection[];
}

export interface MilestoneSummaryRow {
  label: string;
  title: string;
  status: "complete" | "current" | "upcoming";
}

export interface CheckInReportRow {
  date: string;
  scoreAfter: number | null;
  delta: number | null;
}

export interface RoadmapReportData {
  type: "roadmap";
  displayName: string;
  generatedAt: string;
  aspirationTitle: string;
  category: string | null;
  investmentScore: number;
  gapScore: number | null;
  baselineDate: string | null;
  endDate: string | null;
  interval: string | null;
  gapAnalysis: string | null;
  trend30Start: number | null;
  trend30End: number | null;
  checkIns: CheckInReportRow[];
  milestones: MilestoneSummaryRow[];
}

export type PerformanceReportData = DashboardReportData | RoadmapReportData;
