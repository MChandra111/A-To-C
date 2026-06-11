import type { DriftAlertData } from "@/lib/utils/scoreTrend";

interface DriftAlertProps {
  alert: DriftAlertData;
}

export function DriftAlert({ alert }: DriftAlertProps) {
  const goalCopy =
    alert.monthsToGoal !== null
      ? ` Your goal date is in ${alert.monthsToGoal} month${alert.monthsToGoal === 1 ? "" : "s"}.`
      : "";

  return (
    <div
      className="rounded-xl border border-warning/30 bg-warning/5 px-5 py-4"
      role="status"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
        Drift detected
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-primary">
        Your Investment Score has dropped from{" "}
        <span className="font-mono font-medium">{alert.scoreFrom}</span> to{" "}
        <span className="font-mono font-medium">{alert.scoreTo}</span> over the
        last two weeks.{goalCopy}
      </p>
    </div>
  );
}
