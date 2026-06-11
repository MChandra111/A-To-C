import Link from "next/link";
import type { DashboardGoalCard } from "@/lib/dashboard/getDashboardData";

interface ReEntryPromptProps {
  goal: DashboardGoalCard;
}

export function ReEntryPrompt({ goal }: ReEntryPromptProps) {
  if (!goal.showReEntryPrompt) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-sm leading-relaxed text-text-primary">
        You missed {goal.missedWeighIns} weigh-ins for{" "}
        <span className="font-medium">{goal.aspiration.title}</span>. Your
        Investment Score is now{" "}
        <span className="font-mono font-medium">{goal.investmentScore}</span>.
        {goal.canWeighIn
          ? " Your next scheduled weigh-in is open — one period at a time."
          : ` Your next weigh-in opens ${goal.nextDueLabel}.`}
      </p>
      {goal.canWeighIn && (
        <Link
          href={`/checkin/${goal.roadmap.id}`}
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Complete scheduled weigh-in →
        </Link>
      )}
    </div>
  );
}
