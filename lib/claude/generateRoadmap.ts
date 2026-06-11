import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { resolveRoadmapModel } from "@/lib/claude/models";
import {
  createRoadmapOutputSchema,
  parseRoadmapJson,
  type RoadmapOutput,
} from "@/lib/claude/roadmapSchema";
import { getMilestoneCount, MAX_MILESTONES } from "@/lib/roadmap/milestoneCount";
import { formatMonthYear, monthsBetween } from "@/lib/utils/dateHelpers";
import type { Aspiration, Capability } from "@/types";

export interface GenerateRoadmapInput {
  aspiration: Aspiration;
  capabilities: Capability[];
  /** How many milestone intervals Claude should generate (defaults to full plan). */
  milestonesToGenerate?: number;
  /** Full roadmap length for prompt context when generating a partial roadmap. */
  totalMilestoneCount?: number;
}

export interface GenerateRoadmapCallbacks {
  onChunk?: (text: string) => void;
  onStatus?: (message: string) => void;
}

const MAX_ACTION_ITEMS = 2;
const MAX_CAPABILITY_CHARS = 5_000;
const MAX_REQUIREMENTS_CHARS = 2_000;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Truncated — full text is saved in your profile]`;
}

function buildCapabilitiesText(capabilities: Capability[]): string {
  if (!capabilities.length) {
    return "No capabilities provided. Infer from aspiration context only.";
  }

  const combined = capabilities
    .map((cap, index) => {
      const label =
        cap.source_type === "upload" && cap.file_name
          ? `Document: ${cap.file_name}`
          : cap.source_type === "text"
            ? "Free-text background"
            : `Source ${index + 1}`;
      return `--- ${label} ---\n${cap.content}`;
    })
    .join("\n\n");

  return truncate(combined, MAX_CAPABILITY_CHARS);
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local."
    );
  }
  return new Anthropic({ apiKey });
}

export function buildRoadmapPrompt(input: GenerateRoadmapInput): string {
  const { aspiration, capabilities } = input;
  const start = new Date();
  const end = new Date(`${aspiration.end_date}T00:00:00`);
  const months = Math.max(1, monthsBetween(start, end));
  const interval = aspiration.interval ?? "weekly";
  const hours = aspiration.hours_per_week ?? 3;
  const totalMilestoneCount =
    input.totalMilestoneCount ?? getMilestoneCount(months);
  const milestoneCount =
    input.milestonesToGenerate ?? totalMilestoneCount;
  const isPartial = milestoneCount < totalMilestoneCount;
  const milestoneScope = isPartial
    ? `exactly ${milestoneCount} milestones for the FIRST ${milestoneCount} intervals of a ${totalMilestoneCount}-milestone journey (intervals 1–${milestoneCount} only; do not generate later periods)`
    : `exactly ${milestoneCount} milestones spanning the full timeframe`;

  const urlBlock = aspiration.scraped_requirements
    ? `\nTarget page requirements:\n${truncate(aspiration.scraped_requirements, MAX_REQUIREMENTS_CHARS)}`
    : "";

  return `You are an expert career coach and learning path architect. Bridge the gap between the user's current state and their aspiration.

CAPABILITIES:
${buildCapabilitiesText(capabilities)}

ASPIRATION:
${truncate(aspiration.description, 2_000)}${urlBlock}

TIMEFRAME: ${months} months (${formatMonthYear(start)} → ${formatMonthYear(end)})
CHECK-IN INTERVAL: ${interval}
HOURS PER WEEK: ${hours}

Requirements:
- gap_analysis: 2 short paragraphs, direct and honest
- gap_score: overall 0–100 plus exactly 3–4 dimensions with scores and one-sentence notes
- skills_needed: up to 10 specific skills
- quick_wins: exactly 3 actions for the next 48 hours
- risk_factors: 2–3 risks with mitigations
- milestones: ${milestoneScope}. Group ${interval} periods (e.g. "Weeks 1–4"). Each milestone: index starting at 0, label, title, difficulty_tag (Foundation|Building|Advanced|Final Push), brief description, up to 2 focus_areas, exactly ${MAX_ACTION_ITEMS} action_items with effort estimates and 1 resource each (mark free or paid with cost)
- cost_summary: free path, paid path, recommended cost, brief notes

Be concise. Prefer quality over quantity.`;
}

export async function generateRoadmap(
  input: GenerateRoadmapInput,
  callbacks: GenerateRoadmapCallbacks = {}
): Promise<RoadmapOutput> {
  const client = getClient();
  const prompt = buildRoadmapPrompt(input);
  const end = new Date(`${input.aspiration.end_date}T00:00:00`);
  const months = Math.max(1, monthsBetween(new Date(), end));
  const totalMilestoneCount =
    input.totalMilestoneCount ?? getMilestoneCount(months);
  const milestoneCount =
    input.milestonesToGenerate ?? totalMilestoneCount;
  const format = zodOutputFormat(createRoadmapOutputSchema(milestoneCount));

  callbacks.onStatus?.("Generating your gap analysis and roadmap…");

  const stream = client.messages.stream({
    model: resolveRoadmapModel(),
    max_tokens: 8_192,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format,
    },
    messages: [{ role: "user", content: prompt }],
  });

  stream.on("text", (text) => callbacks.onChunk?.(text));

  const message = await stream.finalMessage();

  if (message.parsed_output) {
    callbacks.onStatus?.("Roadmap validated.");
    return message.parsed_output;
  }

  callbacks.onStatus?.("Validating response…");
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseRoadmapJson(text, milestoneCount);
}

export { getMilestoneCount, MAX_MILESTONES };
