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
 * Daily cron — runs once per day (Vercel Hobby limit).
 * Matches users by reminder day of week (UTC).
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
    .select("id, display_name, reminder_day_of_week")
    .eq("reminder_enabled", true)
    .eq("reminder_day_of_week", dayOfWeek);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let sent = 0;
  let failed = 0;
  const results: {
    user_id: string;
    email?: string;
    subject: string;
    status: "sent" | "failed" | "skipped";
    reason?: string;
  }[] = [];

  for (const profile of profiles ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;
    if (!email) {
      results.push({
        user_id: profile.id,
        subject: "",
        status: "skipped",
        reason: "No email on account",
      });
      continue;
    }

    const { data: aspirations } = await admin
      .from("aspirations")
      .select("id, title")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .limit(1);

    const aspiration = aspirations?.[0];
    if (!aspiration) {
      results.push({
        user_id: profile.id,
        email,
        subject: "",
        status: "skipped",
        reason: "No active aspiration",
      });
      continue;
    }

    const { data: roadmap } = await admin
      .from("roadmaps")
      .select("id")
      .eq("aspiration_id", aspiration.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!roadmap) {
      results.push({
        user_id: profile.id,
        email,
        subject: "",
        status: "skipped",
        reason: "No roadmap",
      });
      continue;
    }

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

    const outcome = await sendWeighInReminder(email, {
      displayName: profile.display_name ?? "there",
      investmentScore: score,
      aspirationTitle: aspiration.title,
      appUrl,
    });

    if (outcome.sent) {
      sent++;
      results.push({
        user_id: profile.id,
        email,
        subject,
        status: "sent",
      });
    } else {
      failed++;
      results.push({
        user_id: profile.id,
        email,
        subject,
        status: "failed",
        reason: outcome.reason,
      });
    }
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  return Response.json({
    ok: failed === 0 || sent > 0,
    day_of_week_utc: dayOfWeek,
    matched: profiles?.length ?? 0,
    sent,
    failed,
    resend_configured: resendConfigured,
    results,
  });
}
