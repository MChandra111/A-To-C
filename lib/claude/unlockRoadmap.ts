import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { resolveRoadmapModel } from "@/lib/claude/models";
import { milestoneSchema } from "@/lib/claude/roadmapSchema";
import { formatMonthYear, monthsBetween } from "@/lib/utils/dateHelpers";
import type {
  Aspiration,
  Capability,
  RoadmapCostSummary,
  RoadmapMilestone,
} from "@/types";

const costSummarySchema = z.object({
  free_path_estimate: z.string(),
  paid_path_estimate: z.string(),
  recommended_path_cost: z.string(),
  notes: z.string(),
});

function createUnlockOutputSchema(
  milestoneCount: number,
  requireCostSummary: boolean
) {
  return z.object({
    milestones: z.array(milestoneSchema).length(milestoneCount),
    cost_summary: requireCostSummary
      ? costSummarySchema
      : costSummarySchema.optional(),
  });
}

export type UnlockRoadmapOutput = {
  milestones: RoadmapMilestone[];
  cost_summary?: RoadmapCostSummary;
};

export interface UnlockRoadmapInput {
  aspiration: Aspiration;
  capabilities: Capability[];
  existingMilestones: RoadmapMilestone[];
  totalMilestoneCount: number;
  startFromIndex: number;
  includeCostSummary: boolean;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey });
}

function buildUnlockPrompt(input: UnlockRoadmapInput): string {
  const {
    aspiration,
    capabilities,
    existingMilestones,
    totalMilestoneCount,
    startFromIndex,
    includeCostSummary,
  } = input;
  const remainingCount = totalMilestoneCount - startFromIndex;
  const start = new Date();
  const end = new Date(`${aspiration.end_date}T00:00:00`);
  const months = Math.max(1, monthsBetween(start, end));
  const interval = aspiration.interval ?? "weekly";

  const capabilitiesText =
    capabilities.length > 0
      ? capabilities
          .map((c) => c.content)
          .join("\n\n")
          .slice(0, 4_000)
      : "No capabilities on file.";

  const existingSummary = existingMilestones
    .sort((a, b) => a.index - b.index)
    .map((m) => `- [${m.index}] ${m.label}: ${m.title} (${m.difficulty_tag})`)
    .join("\n");

  const costBlock = includeCostSummary
    ? "\n- cost_summary: estimates for the FULL journey (free path, paid path, recommended cost, brief notes)"
    : "";

  return `You are extending a learning roadmap after a user upgraded to a paid plan. They already received the first ${startFromIndex} interval(s) on the free plan. Generate the remaining portion of the same journey — do not recalibrate or rewrite what they already have.

CAPABILITIES:
${capabilitiesText}

ASPIRATION:
${aspiration.description.slice(0, 2_000)}

TIMEFRAME: ${months} months (${formatMonthYear(start)} → ${formatMonthYear(end)})
CHECK-IN INTERVAL: ${interval}
HOURS PER WEEK: ${aspiration.hours_per_week ?? 3}
TOTAL MILESTONES IN JOURNEY: ${totalMilestoneCount}

EXISTING MILESTONES (already delivered — continue from here):
${existingSummary || "None"}

Generate exactly ${remainingCount} new milestones with indices ${startFromIndex} through ${totalMilestoneCount - 1}.
Group ${interval} periods in labels (e.g. "Weeks 5–8"). Each milestone: label, title, difficulty_tag (Foundation|Building|Advanced|Final Push), brief description, up to 2 focus_areas, exactly 2 action_items with effort and 1 resource each (mark free or paid with cost).
Match tone and difficulty progression from the existing milestones.${costBlock}

Return JSON only.`;
}

async function generateCostSummaryOnly(
  input: UnlockRoadmapInput
): Promise<UnlockRoadmapOutput> {
  const client = getClient();
  const schema = z.object({ cost_summary: costSummarySchema });
  const format = zodOutputFormat(schema);
  const existingSummary = input.existingMilestones
    .sort((a, b) => a.index - b.index)
    .map((m) => `- ${m.label}: ${m.title}`)
    .join("\n");

  const prompt = `Estimate learning costs for this full roadmap journey.

ASPIRATION: ${input.aspiration.description.slice(0, 1_500)}
MILESTONES:
${existingSummary}

Return JSON with cost_summary: free_path_estimate, paid_path_estimate, recommended_path_cost, notes.`;

  const message = await client.messages.create({
    model: resolveRoadmapModel(),
    max_tokens: 1_024,
    thinking: { type: "disabled" },
    output_config: { effort: "low", format },
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const candidate =
    start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  const parsed = schema.parse(JSON.parse(candidate));
  return { milestones: [], cost_summary: parsed.cost_summary };
}

export async function unlockRemainingMilestones(
  input: UnlockRoadmapInput
): Promise<UnlockRoadmapOutput> {
  const remainingCount = input.totalMilestoneCount - input.startFromIndex;
  if (remainingCount <= 0) {
    if (input.includeCostSummary) {
      return generateCostSummaryOnly(input);
    }
    return { milestones: [] };
  }

  const client = getClient();
  const schema = createUnlockOutputSchema(
    remainingCount,
    input.includeCostSummary
  );
  const format = zodOutputFormat(schema);

  const stream = client.messages.stream({
    model: resolveRoadmapModel(),
    max_tokens: 8_192,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format,
    },
    messages: [{ role: "user", content: buildUnlockPrompt(input) }],
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

  return schema.parse(JSON.parse(candidate));
}
