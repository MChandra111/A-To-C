import type { CheckInInterval, MilestoneDifficulty, RoadmapMilestone } from "@/types";

const SAMPLE_TITLES = [
  "Deepen core competencies",
  "Apply skills in practice",
  "Strengthen advanced topics",
  "Prepare for final milestones",
  "Polish and integrate learning",
  "Final push toward your goal",
] as const;

const SAMPLE_TASKS = [
  "Complete structured practice on priority skills",
  "Build a portfolio artifact demonstrating progress",
  "Review feedback and close knowledge gaps",
  "Take on a stretch assignment in your target area",
] as const;

const DIFFICULTY_BY_INDEX: MilestoneDifficulty[] = [
  "Foundation",
  "Building",
  "Building",
  "Advanced",
  "Advanced",
  "Final Push",
];

function periodUnit(interval: CheckInInterval): string {
  switch (interval) {
    case "daily":
      return "Days";
    case "weekly":
      return "Weeks";
    case "biweekly":
      return "Periods";
    case "monthly":
      return "Months";
  }
}

export function buildPlaceholderLabel(
  index: number,
  total: number,
  interval: CheckInInterval
): string {
  const unit = periodUnit(interval);
  const position = index + 1;
  if (interval === "weekly" || interval === "biweekly") {
    return `${unit} ${position} of ${total}`;
  }
  return `${unit.slice(0, -1)} ${position}`;
}

export function buildPlaceholderMilestone(
  index: number,
  total: number,
  interval: CheckInInterval
): RoadmapMilestone {
  const title = SAMPLE_TITLES[index % SAMPLE_TITLES.length] ?? "Continue your journey";
  const difficulty = DIFFICULTY_BY_INDEX[index % DIFFICULTY_BY_INDEX.length] ?? "Building";

  return {
    index,
    label: buildPlaceholderLabel(index, total, interval),
    title,
    difficulty_tag: difficulty,
    description:
      "Unlock Guru to reveal personalized objectives, resources, and action items for this period.",
    focus_areas: ["Skill building", "Practice"],
    action_items: [
      {
        task: SAMPLE_TASKS[index % SAMPLE_TASKS.length] ?? SAMPLE_TASKS[0],
        effort: "—",
        resources: [
          {
            name: "Curated learning resource",
            url: null,
            cost: "—",
            type: "free",
          },
        ],
      },
      {
        task: SAMPLE_TASKS[(index + 1) % SAMPLE_TASKS.length] ?? SAMPLE_TASKS[1],
        effort: "—",
        resources: [
          {
            name: "Recommended tool or course",
            url: null,
            cost: "—",
            type: "paid",
          },
        ],
      },
    ],
  };
}
