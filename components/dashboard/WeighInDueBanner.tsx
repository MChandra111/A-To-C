import Link from "next/link";
import { Scale } from "lucide-react";
import type { DashboardGoalCard } from "@/lib/dashboard/getDashboardData";

interface WeighInDueBannerProps {
  dueGoals: DashboardGoalCard[];
}

export function WeighInDueBanner({ dueGoals }: WeighInDueBannerProps) {
  if (dueGoals.length === 0) return null;

  const single = dueGoals.length === 1;
  const goal = dueGoals[0]!;

  if (single) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Weigh-in open
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-text-primary">
              {goal.aspiration.title}
            </p>
            <p className="mt-1 text-sm text-text-muted">{goal.scheduleMessage}</p>
          </div>
          <Link
            href={`/checkin/${goal.roadmap.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Scale className="h-4 w-4" aria-hidden />
            {goal.weighInState === "overdue" ? "Complete overdue weigh-in" : "Weigh in now"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-5 md:px-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {dueGoals.length} weigh-ins open
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Your schedule says it&apos;s time to step on the scale.
      </p>
      <ul className="mt-4 space-y-3">
        {dueGoals.map((g) => (
          <li
            key={g.aspiration.id}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-text-primary">{g.aspiration.title}</p>
              <p className="text-xs text-text-muted">{g.scheduleMessage}</p>
            </div>
            <Link
              href={`/checkin/${g.roadmap.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <Scale className="h-3.5 w-3.5" aria-hidden />
              Weigh in
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
