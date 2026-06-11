import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { resolveRoadmapModel } from "@/lib/claude/models";
import { milestoneSchema } from "@/lib/claude/roadmapSchema";
import { formatMonthYear, monthsBetween } from "@/lib/utils/dateHelpers";
import type { Aspiration, Capability, RoadmapMilestone } from "@/types";

const regenerateOutputSchema = z.object({
  milestones: z.array(milestoneSchema).min(1).max(6),
  cost_summary: z
    .object({
      free_path_estimate: z.string(),
      paid_path_estimate: z.string(),
      recommended_path_cost: z.string(),
      notes: z.string(),
    })
    .optional(),
});

export type RegenerateOutput = z.infer<typeof regenerateOutputSchema>;

export interface RegenerateRoadmapInput {
  aspiration: Aspiration;
  capabilities: Capability[];
  preservedMilestones: RoadmapMilestone[];
  startFromIndex: number;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey });
}

function buildRegeneratePrompt(input: RegenerateRoadmapInput): string {
  const { aspiration, capabilities, preservedMilestones, startFromIndex } =
    input;
  const start = new Date();
  const end = new Date(`${aspiration.end_date}T00:00:00`);
  const months = Math.max(1, monthsBetween(start, end));
  const remainingCount = Math.max(
    2,
    Math.min(6, Math.ceil(months / 2) - preservedMilestones.length)
  );

  const capabilitiesText =
    capabilities.length > 0
      ? capabilities.map((c) => c.content).join("\n\n").slice(0, 4000)
      : "No capabilities on file.";

  const preservedSummary =
    preservedMilestones.length > 0
      ? preservedMilestones
          .map((m) => `- ${m.label}: ${m.title} (${m.difficulty_tag})`)
          .join("\n")
      : "None — user is restarting from the beginning.";

  return `You are recalibrating a learning roadmap. The user fell behind schedule. Preserve their completed work mentally, but generate NEW milestones from index ${startFromIndex} onward.

CAPABILITIES:
${capabilitiesText}

ASPIRATION:
${aspiration.description.slice(0, 2000)}

TIMEFRAME: ${months} months (${formatMonthYear(start)} → ${formatMonthYear(end)})
CHECK-IN INTERVAL: ${aspiration.interval}
HOURS PER WEEK: ${aspiration.hours_per_week ?? 3}

COMPLETED MILESTONES (do not regenerate these):
${preservedSummary}

Generate exactly ${remainingCount} new milestones starting at index ${startFromIndex}.
Each milestone: label, title, difficulty_tag, description, up to 2 focus_areas, exactly 2 action_items with effort and 1 resource each.
Acknowledge recalibration in cost_summary.notes if provided.

Return JSON with milestones array and optional updated cost_summary.`;
}

export async function regenerateRoadmapMilestones(
  input: RegenerateRoadmapInput
): Promise<RegenerateOutput> {
  const client = getClient();
  const format = zodOutputFormat(regenerateOutputSchema);

  const stream = client.messages.stream({
    model: resolveRoadmapModel(),
    max_tokens: 6_144,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format,
    },
    messages: [{ role: "user", content: buildRegeneratePrompt(input) }],
  });

  const message = await stream.finalMessage();

  if (message.parsed_output) {
    return message.parsed_output;
  }

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const candidate =
    start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;

  return regenerateOutputSchema.parse(JSON.parse(candidate));
}
