import { z } from "zod";

const resourceSchema = z.object({
  name: z.string(),
  url: z.string().nullable(),
  cost: z.string(),
  type: z.enum(["free", "paid"]),
});

const actionItemSchema = z.object({
  task: z.string(),
  effort: z.string(),
  resources: z.array(resourceSchema).max(2),
});

export const milestoneSchema = z.object({
  index: z.number().int(),
  label: z.string(),
  title: z.string(),
  difficulty_tag: z.enum([
    "Foundation",
    "Building",
    "Advanced",
    "Final Push",
  ]),
  description: z.string(),
  focus_areas: z.array(z.string()).max(3),
  action_items: z.array(actionItemSchema).min(1).max(2),
});

export const roadmapOutputSchema = z.object({
  gap_analysis: z.string(),
  gap_score: z.object({
    overall: z.number().min(0).max(100),
    dimensions: z
      .array(
        z.object({
          name: z.string(),
          score: z.number().min(0).max(100),
          note: z.string(),
        })
      )
      .min(3)
      .max(4),
  }),
  skills_needed: z.array(z.string()).max(12),
  quick_wins: z.array(
    z.object({
      action: z.string(),
      time_estimate: z.string(),
    })
  ).length(3),
  risk_factors: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    })
  ).min(2).max(3),
  milestones: z.array(milestoneSchema).min(4).max(6),
  cost_summary: z.object({
    free_path_estimate: z.string(),
    paid_path_estimate: z.string(),
    recommended_path_cost: z.string(),
    notes: z.string(),
  }),
});

export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;
export type RoadmapMilestone = z.infer<typeof milestoneSchema>;
export type GapScore = RoadmapOutput["gap_score"];

export function parseRoadmapJson(raw: string): RoadmapOutput {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");
  const candidate =
    start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText;

  const parsed: unknown = JSON.parse(candidate);
  return roadmapOutputSchema.parse(parsed);
}
