import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuruCheckoutButton } from "@/components/plans/GuruCheckoutButton";
import { GURU_PRICE_LABEL, PLAN_LABELS } from "@/lib/plans/constants";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { ensureRoadmapsUnlockedForUser } from "@/lib/plans/unlockRoadmaps";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UpgradePageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/upgrade");

  const plan = await getUserPlan(supabase, user.id);
  let unlockMessage: string | null = null;

  if (checkout === "success" && isGuruPlan(plan)) {
    const unlock = await ensureRoadmapsUnlockedForUser(user.id);
    if (unlock.unlocked > 0) {
      unlockMessage = `Unlocked ${unlock.unlocked} roadmap${unlock.unlocked === 1 ? "" : "s"} with full intervals.`;
    } else if (unlock.errors.length > 0) {
      unlockMessage =
        "Guru is active. Your roadmap is still generating — refresh in a moment.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Plans
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Guru plan
        </h1>
        <p className="mt-2 text-text-muted">
          Your current plan:{" "}
          <span className="font-medium text-text-primary">
            {PLAN_LABELS[plan]}
          </span>
        </p>
      </div>

      {plan === "guru" ? (
        <Card>
          <CardHeader>
            <CardTitle>You are on Guru</CardTitle>
            <CardDescription>
              Full roadmaps, reminders, finish-early, and multiple goals are
              enabled on your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {checkout === "success" && (
            <div
              className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-text-primary"
              role="status"
            >
              {unlockMessage ??
                (isGuruPlan(plan)
                  ? "Payment received. Guru is active on your account."
                  : "Payment received. Guru is activating — refresh in a moment.")}
            </div>
          )}

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Guru — the full scale experience</CardTitle>
              <CardDescription>
                One-time payment · no subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="font-display text-4xl font-bold text-text-primary">
                  {GURU_PRICE_LABEL}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Pay once for lifetime Guru access on your account.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-text-muted">
                <li>Full AI roadmap — every interval, not just the first two</li>
                <li>Email weigh-in reminders</li>
                <li>Finish objectives early</li>
                <li>Recalibration, resource library, and cost summary</li>
                <li>More than one roadmap / aspiration</li>
              </ul>

              <GuruCheckoutButton
                userId={user.id}
                size="lg"
                className="w-full sm:w-auto"
              />

              <p className="text-xs text-text-muted">
                Secure checkout via Stripe. Guru unlocks automatically after
                payment — use the same email as your A-To-C account if prompted.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Free vs Guru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-muted">
              <p>
                <span className="font-medium text-text-primary">Free:</span> one
                roadmap, first two intervals generated, weigh-ins and Investment
                Score tracking.
              </p>
              <p>
                <span className="font-medium text-text-primary">Guru:</span>{" "}
                {GURU_PRICE_LABEL} one-time — full AI roadmap, reminders,
                finish-early, recalibration, and multiple goals.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
