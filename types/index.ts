export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  reminder_enabled: boolean;
  reminder_day_of_week: number | null;
  reminder_time: string | null;
  created_at: string;
}

export interface RoadmapShare {
  id: string;
  roadmap_id: string;
  user_id: string;
  share_token: string;
  created_at: string;
}

export interface Capability {
  id: string;
  user_id: string;
  content: string;
  source_type: "upload" | "text" | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export const ASPIRATION_CATEGORIES = [
  "Academic",
  "Career",
  "Skill",
  "Personal",
  "Creative",
  "Health & Fitness",
] as const;

export type AspirationCategory = (typeof ASPIRATION_CATEGORIES)[number];

export const CHECK_IN_INTERVALS = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type CheckInInterval = (typeof CHECK_IN_INTERVALS)[number];

export const HOURS_PER_WEEK_OPTIONS = [1, 3, 5, 10] as const;
export type HoursPerWeek = (typeof HOURS_PER_WEEK_OPTIONS)[number];

export interface UrlRequirementsCacheEntry {
  normalized_url: string;
  source_url: string;
  requirements_text: string;
  model: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  hit_count: number;
}

export interface Aspiration {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: AspirationCategory | null;
  target_url: string | null;
  scraped_requirements: string | null;
  end_date: string | null;
  interval: CheckInInterval | null;
  hours_per_week: HoursPerWeek | null;
  status: "active" | "completed" | "archived";
  created_at: string;
}

export type MilestoneDifficulty =
  | "Foundation"
  | "Building"
  | "Advanced"
  | "Final Push";

export interface GapScoreDimension {
  name: string;
  score: number;
  note: string;
}

export interface GapScoreData {
  overall: number;
  dimensions: GapScoreDimension[];
}

export interface RoadmapResource {
  name: string;
  url: string | null;
  cost: string;
  type: "free" | "paid";
}

export const RESOURCE_FORMATS = [
  "course",
  "book",
  "article",
  "video",
  "tool",
  "certification",
] as const;

export type ResourceFormat = (typeof RESOURCE_FORMATS)[number];

export interface LibraryResource {
  id: string;
  name: string;
  url: string | null;
  cost: string;
  type: "free" | "paid";
  skillArea: string;
  format: ResourceFormat;
  mentionCount?: number;
  sourceAspiration?: string;
}

export interface RoadmapActionItem {
  task: string;
  effort: string;
  resources: RoadmapResource[];
}

export interface RoadmapMilestone {
  index: number;
  label: string;
  title: string;
  difficulty_tag: MilestoneDifficulty;
  description: string;
  focus_areas: string[];
  action_items: RoadmapActionItem[];
}

export interface RoadmapCostSummary {
  free_path_estimate: string;
  paid_path_estimate: string;
  recommended_path_cost: string;
  notes: string;
}

export type EffortLevel = "done" | "partial" | "skipped";

export interface Roadmap {
  id: string;
  aspiration_id: string;
  gap_analysis: string | null;
  gap_score: GapScoreData | null;
  skills_needed: string[] | null;
  quick_wins: { action: string; time_estimate: string }[] | null;
  risk_factors: { risk: string; mitigation: string }[] | null;
  milestones: RoadmapMilestone[] | null;
  cost_summary: RoadmapCostSummary | null;
  baseline_date: string | null;
  generated_at: string;
  version: number;
}
