import Link from "next/link";
import type { DashboardGoalCard } from "@/lib/dashboard/getDashboardData";

interface RecalibrationPromptProps {
  goal: DashboardGoalCard;
}

export function RecalibrationPrompt({ goal }: RecalibrationPromptProps) {
  if (!goal.showRecalibrationOffer) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-sm leading-relaxed text-text-primary">
        Your timeline for{" "}
        <span className="font-medium">{goal.aspiration.title}</span> may need
        adjusting — you&apos;re more than 4 weeks behind where you planned to be.
        Want Claude to recalculate from where you are now?
      </p>
      <Link
        href={`/roadmap/${goal.roadmap.id}?recalibrate=1`}
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        Recalculate roadmap →
      </Link>
    </div>
  );
}
