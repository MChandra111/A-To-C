import { addInterval } from "@/lib/dashboard/weighInSchedule";
import type { CheckInInterval } from "@/types";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Count scheduled weigh-ins that passed without a check-in since the anchor. */
export function countMissedWeighIns(
  interval: CheckInInterval,
  lastCheckin: Date | null,
  baselineDate: string | null,
  reference = new Date()
): number {
  const anchor = lastCheckin
    ? startOfDay(lastCheckin)
    : baselineDate
      ? startOfDay(new Date(`${baselineDate}T00:00:00`))
      : startOfDay(reference);

  const today = startOfDay(reference);
  let missed = 0;
  let due = addInterval(anchor, interval);

  while (due.getTime() <= today.getTime()) {
    missed++;
    due = addInterval(due, interval);
  }

  return missed;
}

export function needsRecalibration(
  baselineDate: string,
  endDate: string,
  currentMilestoneIndex: number,
  totalMilestones: number,
  reference = new Date()
): boolean {
  if (totalMilestones <= 0) return false;

  const baseline = new Date(`${baselineDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const totalDays = Math.max(
    1,
    (end.getTime() - baseline.getTime()) / (24 * 60 * 60 * 1000)
  );
  const elapsedDays = Math.max(
    0,
    (reference.getTime() - baseline.getTime()) / (24 * 60 * 60 * 1000)
  );

  const progress = Math.min(1, elapsedDays / totalDays);
  const expectedIndex = Math.floor(progress * totalMilestones);
  const weeksPerMilestone = totalDays / 7 / totalMilestones;
  const milestonesBehind = expectedIndex - currentMilestoneIndex;

  if (milestonesBehind <= 0) return false;
  return milestonesBehind * weeksPerMilestone >= 4;
}
