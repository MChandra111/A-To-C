import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildWeighInReminderSubject,
  sendWeighInReminder,
} from "@/lib/email/weighInReminder";
import { latestScoreForRoadmap } from "@/lib/utils/scoreTrend";
import type { InvestmentScoreRow } from "@/lib/utils/scoreTrend";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Daily cron scaffold — runs once per day (Vercel Hobby limit).
 * Matches users by reminder day of week (UTC). On Pro, switch vercel.json
 * to an hourly schedule and re-enable hour matching below.
 *
 * TODO: integrate with Resend or SendGrid via sendWeighInReminder().
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json(
      {
        error: "SUPABASE_SERVICE_ROLE_KEY required for cron",
        processed: 0,
      },
      { status: 503 }
    );
  }

  const dayOfWeek = new Date().getUTCDay();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, reminder_day_of_week, reminder_time")
    .eq("reminder_enabled", true)
    .eq("reminder_day_of_week", dayOfWeek);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let queued = 0;
  const previews: { subject: string; user_id: string }[] = [];

  for (const profile of profiles ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { data: aspirations } = await admin
      .from("aspirations")
      .select("id, title")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .limit(1);

    const aspiration = aspirations?.[0];
    if (!aspiration) continue;

    const { data: roadmap } = await admin
      .from("roadmaps")
      .select("id")
      .eq("aspiration_id", aspiration.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!roadmap) continue;

    const { data: scoreRows } = await admin
      .from("investment_scores")
      .select("roadmap_id, score, recorded_at")
      .eq("user_id", profile.id)
      .eq("roadmap_id", roadmap.id)
      .order("recorded_at", { ascending: true });

    const score = latestScoreForRoadmap(
      (scoreRows ?? []) as InvestmentScoreRow[],
      roadmap.id
    );

    const subject = buildWeighInReminderSubject(score);

    await sendWeighInReminder(email, {
      displayName: profile.display_name ?? "there",
      investmentScore: score,
      aspirationTitle: aspiration.title,
      appUrl,
    });

    previews.push({ subject, user_id: profile.id });
    queued++;
  }

  return Response.json({
    ok: true,
    queued,
    note: "Emails not sent — provider not configured. See sendWeighInReminder().",
    previews,
  });
}
