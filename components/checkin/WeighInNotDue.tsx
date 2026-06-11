import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WeighInWindowState } from "@/lib/dashboard/weighInSchedule";

interface WeighInNotDueProps {
  aspirationTitle: string;
  scheduleMessage: string;
  nextDueLabel: string;
  state: WeighInWindowState;
}

export function WeighInNotDue({
  aspirationTitle,
  scheduleMessage,
  nextDueLabel,
  state,
}: WeighInNotDueProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          {aspirationTitle}
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          {state === "early"
            ? "Not time to weigh in yet"
            : "Weigh-in unavailable"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          {scheduleMessage}
        </p>
        <p className="mt-2 font-mono text-xs text-text-muted">
          Opens {nextDueLabel}
        </p>
        <p className="mt-6 text-xs text-text-muted">
          Weigh-ins follow your schedule — one reading per period. You can&apos;t
          skip ahead or batch multiple weeks.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
