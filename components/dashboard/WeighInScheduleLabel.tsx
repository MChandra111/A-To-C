import { cn } from "@/lib/utils";
import type { WeighInWindowState } from "@/lib/dashboard/weighInSchedule";

interface WeighInScheduleLabelProps {
  state: WeighInWindowState;
  scheduleMessage: string;
  nextDueLabel: string;
  className?: string;
}

export function WeighInScheduleLabel({
  state,
  scheduleMessage,
  nextDueLabel,
  className,
}: WeighInScheduleLabelProps) {
  return (
    <p
      className={cn(
        "text-sm text-text-muted",
        state === "overdue" && "text-warning",
        className
      )}
    >
      {scheduleMessage}
      {state === "early" && (
        <span className="mt-0.5 block font-mono text-xs text-text-muted/80">
          Opens {nextDueLabel}
        </span>
      )}
    </p>
  );
}
