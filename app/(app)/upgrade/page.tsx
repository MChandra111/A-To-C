import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GuruUpsell } from "@/components/plans/GuruUpsell";
import { PLAN_LABELS } from "@/lib/plans/constants";
import { getUserPlan } from "@/lib/plans/getUserPlan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plan = user ? await getUserPlan(supabase, user.id) : "free";

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
          <GuruUpsell
            title="Guru — the full scale experience"
            description="Unlock every interval of your roadmap, email weigh-in reminders, finish objectives early, and create more than one goal. Billing integration is coming soon."
          />

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
                <span className="font-medium text-text-primary">Guru:</span> full
                AI roadmap, reminders, finish-early, recalibration, and multiple
                goals.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
