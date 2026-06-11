import { getIntervalNoun } from "@/lib/utils/dateHelpers";
import type { CheckInInterval } from "@/types";

export type WeighInWindowState = "early" | "due_today" | "overdue";

export interface WeighInStatus {
  nextDue: Date;
  overdueDays: number;
  isOverdue: boolean;
  /** True when today is on or past the scheduled weigh-in date. */
  canWeighIn: boolean;
  state: WeighInWindowState;
  scheduleMessage: string;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addInterval(date: Date, interval: CheckInInterval): Date {
  const d = new Date(date);
  switch (interval) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
}

function buildScheduleMessage(
  state: WeighInWindowState,
  nextDue: Date,
  overdueDays: number,
  intervalType: CheckInInterval,
  reference: Date
): string {
  const interval = getIntervalNoun(intervalType);

  switch (state) {
    case "due_today":
      return `Your ${interval} weigh-in is open today.`;
    case "overdue":
      return `Your ${interval} weigh-in is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.`;
    case "early":
      return `Next ${interval} weigh-in opens ${formatNextWeighIn(nextDue, reference)}.`;
  }
}

export function getWeighInStatus(
  interval: CheckInInterval,
  lastWeighIn: Date | null,
  baselineDate: string | null,
  reference = new Date()
): WeighInStatus {
  const anchor = lastWeighIn
    ? startOfDay(lastWeighIn)
    : baselineDate
      ? startOfDay(new Date(`${baselineDate}T00:00:00`))
      : startOfDay(reference);

  const nextDue = addInterval(anchor, interval);
  const today = startOfDay(reference);
  const dueDay = startOfDay(nextDue);

  const canWeighIn = today.getTime() >= dueDay.getTime();
  const overdueMs = today.getTime() - dueDay.getTime();
  const overdueDays =
    overdueMs > 0 ? Math.floor(overdueMs / (24 * 60 * 60 * 1000)) : 0;

  const state: WeighInWindowState = !canWeighIn
    ? "early"
    : overdueDays > 0
      ? "overdue"
      : "due_today";

  return {
    nextDue,
    overdueDays,
    isOverdue: overdueDays > 0,
    canWeighIn,
    state,
    scheduleMessage: buildScheduleMessage(
      state,
      nextDue,
      overdueDays,
      interval,
      reference
    ),
  };
}

export function formatNextWeighIn(due: Date, reference = new Date()): string {
  const today = startOfDay(reference);
  const dueDay = startOfDay(due);
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;

  return due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function daysSince(date: Date, reference = new Date()): number {
  const ms = startOfDay(reference).getTime() - startOfDay(date).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export function daysUntilEndDate(endDate: string, reference = new Date()): number {
  const end = startOfDay(new Date(`${endDate}T00:00:00`));
  const today = startOfDay(reference);
  const ms = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function monthsUntilEndDate(
  endDate: string,
  reference = new Date()
): number {
  const end = new Date(`${endDate}T00:00:00`);
  const months =
    (end.getFullYear() - reference.getFullYear()) * 12 +
    (end.getMonth() - reference.getMonth());
  return Math.max(0, months);
}
