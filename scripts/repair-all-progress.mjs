/**
 * One-off repair: reset bogus check-in progress for all roadmaps.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: node scripts/repair-all-progress.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function repairRoadmap(roadmapId, userId, baselineDate) {
  await supabase
    .from("investment_scores")
    .delete()
    .eq("roadmap_id", roadmapId);

  await supabase.from("completions").delete().eq("roadmap_id", roadmapId);
  await supabase.from("checkins").delete().eq("roadmap_id", roadmapId);

  await supabase.from("investment_scores").insert({
    user_id: userId,
    roadmap_id: roadmapId,
    score: 0,
    checkin_id: null,
  });

  console.log(`Repaired roadmap ${roadmapId} (baseline ${baselineDate}) → milestone Week 1`);
}

const { data: roadmaps, error } = await supabase
  .from("roadmaps")
  .select("id, baseline_date, aspirations(user_id)")
  .order("generated_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

for (const r of roadmaps ?? []) {
  const aspiration = r.aspirations;
  if (!aspiration?.user_id) continue;
  await repairRoadmap(r.id, aspiration.user_id, r.baseline_date);
}

await supabase
  .from("streaks")
  .update({ current_streak: 0, longest_streak: 0, last_checkin_date: null })
  .neq("user_id", "00000000-0000-0000-0000-000000000000");

console.log("Done. Refresh your dashboard.");
