import Anthropic from "@anthropic-ai/sdk";
import { resolveCheckinModel } from "@/lib/claude/models";

export interface CheckinNudgeInput {
  aspirationTitle: string;
  doneCount: number;
  partialCount: number;
  skippedCount: number;
  scoreBefore: number;
  scoreAfter: number;
}

export async function generateCheckinResponse(
  input: CheckinNudgeInput
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Your reading is recorded. Adjust next period based on what you marked.";
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a direct, honest coach. The user just completed a check-in for their goal: ${input.aspirationTitle}.
They marked: ${input.doneCount} as done, ${input.partialCount} as partial, ${input.skippedCount} as skipped.
Their Investment Score moved from ${input.scoreBefore} to ${input.scoreAfter}.
Write 2-3 sentences: one observation about their pattern, one specific tactical suggestion. Be direct. Do not use filler phrases like "Great job" or "Keep it up." Do not moralize.`;

  const message = await client.messages.create({
    model: resolveCheckinModel(),
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block?.type === "text") {
    return block.text.trim();
  }

  return "Your reading is recorded. Focus on the one action you skipped — start there next period.";
}
