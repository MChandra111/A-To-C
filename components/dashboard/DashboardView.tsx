import Link from "next/link";
import { DriftAlert } from "@/components/score/DriftAlert";
import { AspirationCard } from "@/components/dashboard/AspirationCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { ReEntryPrompt } from "@/components/dashboard/ReEntryPrompt";
import { RecalibrationPrompt } from "@/components/dashboard/RecalibrationPrompt";
import { WeighInDueBanner } from "@/components/dashboard/WeighInDueBanner";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/dashboard/getDashboardData";

interface DashboardViewProps {
  data: DashboardData;
}

function GoalSection({
  title,
  description,
  goals,
  showWeighIn = true,
}: {
  title: string;
  description?: string;
  goals: DashboardData["activeGoals"];
  showWeighIn?: boolean;
}) {
  if (goals.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      <div className="grid gap-4">
        {goals.map((goal) => (
          <AspirationCard
            key={goal.aspiration.id}
            goal={goal}
            showWeighIn={showWeighIn}
          />
        ))}
      </div>
    </section>
  );
}

export function DashboardView({ data }: DashboardViewProps) {
  if (!data.hasAnyGoals) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Welcome, {data.displayName}
          </h1>
          <p className="mt-2 text-text-muted">
            Your scale is ready. Define where you are and where you want to go
            to get your first reading.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-display text-5xl font-bold text-text-muted/40">
            —
          </p>
          <p className="mt-4 text-sm text-text-muted">
            No Investment Score yet. Complete onboarding to generate your
            baseline reading.
          </p>
          <Button asChild className="mt-6">
            <Link href="/onboard/capabilities">Start onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Your scale
        </h1>
        <p className="mt-2 text-text-muted">
          Welcome back, {data.displayName}. Here is where you stand today.
        </p>
      </header>

      {data.dueWeighIns.length > 0 && (
        <WeighInDueBanner dueGoals={data.dueWeighIns} />
      )}

      {data.driftAlert && <DriftAlert alert={data.driftAlert} />}

      {data.activeGoals.some((g) => g.showReEntryPrompt) && (
        <div className="space-y-3">
          {data.activeGoals
            .filter((g) => g.showReEntryPrompt)
            .map((goal) => (
              <ReEntryPrompt key={`reentry-${goal.aspiration.id}`} goal={goal} />
            ))}
        </div>
      )}

      {data.activeGoals.some((g) => g.showRecalibrationOffer) && (
        <div className="space-y-3">
          {data.activeGoals
            .filter((g) => g.showRecalibrationOffer)
            .map((goal) => (
              <RecalibrationPrompt
                key={`recal-${goal.aspiration.id}`}
                goal={goal}
              />
            ))}
        </div>
      )}

      <DashboardHero
        overallScore={data.overallScore}
        trends={data.trends}
        streak={data.streak}
        nextWeighInLabel={data.nextWeighInLabel}
      />

      <GoalSection
        title="Active goals"
        description="Weigh-ins open on your schedule — one reading per period."
        goals={data.activeGoals}
        showWeighIn
      />

      {data.activeGoals.length === 0 && data.hasAnyGoals && (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
          <p className="text-sm text-text-muted">
            No active goals right now.{" "}
            <Link
              href="/onboard/capabilities"
              className="text-primary hover:underline"
            >
              Start a new aspiration
            </Link>
          </p>
        </div>
      )}

      <GoalSection
        title="Completed goals"
        description="Historical readings — the number you earned."
        goals={data.completedGoals}
        showWeighIn={false}
      />

      <GoalSection
        title="Archived goals"
        goals={data.archivedGoals}
        showWeighIn={false}
      />
    </div>
  );
}
