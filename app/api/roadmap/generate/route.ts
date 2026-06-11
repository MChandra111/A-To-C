import { createClient } from "@/lib/supabase/server";
import { generateRoadmap } from "@/lib/claude/generateRoadmap";
import { assertGenerationAllowed } from "@/lib/roadmap/rateLimit";
import type { Aspiration, Capability } from "@/types";

export const maxDuration = 300;
export const runtime = "nodejs";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { aspiration_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aspirationId = body.aspiration_id?.trim();
  if (!aspirationId) {
    return new Response(JSON.stringify({ error: "aspiration_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: aspiration, error: aspirationError } = await supabase
    .from("aspirations")
    .select("*")
    .eq("id", aspirationId)
    .eq("user_id", user.id)
    .single();

  if (aspirationError || !aspiration) {
    return new Response(JSON.stringify({ error: "Aspiration not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!aspiration.end_date || !aspiration.interval) {
    return new Response(
      JSON.stringify({ error: "Complete the timeline step first" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: existingRoadmap } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("aspiration_id", aspirationId)
    .maybeSingle();

  if (existingRoadmap) {
    return new Response(
      JSON.stringify({
        error: "Roadmap already exists",
        roadmap_id: existingRoadmap.id,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await assertGenerationAllowed(supabase, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rate limit exceeded";
    return new Response(JSON.stringify({ error: message }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: capabilities } = await supabase
    .from("capabilities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      const heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() });
      }, 12_000);

      try {
        send("status", { message: "Analyzing your capabilities and aspiration…" });

        let roadmapOutput;

        try {
          roadmapOutput = await generateRoadmap(
            {
              aspiration: aspiration as Aspiration,
              capabilities: (capabilities ?? []) as Capability[],
            },
            {
              onChunk: (chunk) => send("chunk", { text: chunk }),
              onStatus: (message) => send("status", { message }),
            }
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Generation failed";
          send("error", { message });
          return;
        } finally {
          clearInterval(heartbeat);
        }

        send("status", { message: "Saving your roadmap…" });

        const today = new Date().toISOString().slice(0, 10);

        const { data: roadmap, error: insertError } = await supabase
          .from("roadmaps")
          .insert({
            aspiration_id: aspirationId,
            gap_analysis: roadmapOutput.gap_analysis,
            gap_score: roadmapOutput.gap_score,
            skills_needed: roadmapOutput.skills_needed,
            quick_wins: roadmapOutput.quick_wins,
            risk_factors: roadmapOutput.risk_factors,
            milestones: roadmapOutput.milestones,
            cost_summary: roadmapOutput.cost_summary,
            baseline_date: today,
          })
          .select("id")
          .single();

        if (insertError || !roadmap) {
          send("error", {
            message: insertError?.message ?? "Failed to save roadmap",
          });
          return;
        }

        const { error: scoreError } = await supabase
          .from("investment_scores")
          .insert({
            user_id: user.id,
            roadmap_id: roadmap.id,
            score: 0,
            checkin_id: null,
          });

        if (scoreError) {
          send("error", { message: scoreError.message });
          return;
        }

        send("done", { roadmap_id: roadmap.id });
      } catch (err) {
        clearInterval(heartbeat);
        const message = err instanceof Error ? err.message : "Unexpected error";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
