import { addInterval } from "@/lib/dashboard/weighInSchedule";
import type { CheckInInterval } from "@/types";

export {
  type ActionCompletion,
  buildEarlyFinishMessage,
  getMilestoneByIndex,
  getMilestoneObjectiveProgress,
  getNextMilestone,
  isActionItemDoneEarly,
  isMilestoneFullyDone,
  resolveCurrentMilestoneIndex,
} from "@/lib/checkin/milestoneProgress";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** How many weigh-in windows have opened since baseline (schedule cap). */
export function countEligibleWeighInPeriods(
  baselineDate: string,
  interval: CheckInInterval,
  reference = new Date()
): number {
  const baseline = startOfDay(new Date(`${baselineDate}T00:00:00`));
  const today = startOfDay(reference);
  let count = 0;
  let due = addInterval(baseline, interval);

  while (due.getTime() <= today.getTime()) {
    count++;
    due = addInterval(due, interval);
  }

  return count;
}
