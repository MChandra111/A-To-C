export const CHECK_IN_INTERVALS = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type CheckInInterval = (typeof CHECK_IN_INTERVALS)[number];

export const HOURS_PER_WEEK_OPTIONS = [1, 3, 5, 10] as const;
export type HoursPerWeek = (typeof HOURS_PER_WEEK_OPTIONS)[number];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface MonthYear {
  month: number;
  year: number;
}

export interface MonthYearOption extends MonthYear {
  label: string;
}

export function getMinEndMonthYear(reference = new Date()): MonthYear {
  const d = new Date(reference);
  d.setMonth(d.getMonth() + 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function getMaxEndMonthYear(reference = new Date()): MonthYear {
  const d = new Date(reference);
  d.setFullYear(d.getFullYear() + 5);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function monthYearToValue({ month, year }: MonthYear): number {
  return year * 12 + month;
}

export function isValidEndMonthYear(
  month: number,
  year: number,
  reference = new Date()
): boolean {
  if (month < 1 || month > 12) return false;
  const value = monthYearToValue({ month, year });
  const min = monthYearToValue(getMinEndMonthYear(reference));
  const max = monthYearToValue(getMaxEndMonthYear(reference));
  return value >= min && value <= max;
}

export function generateMonthYearOptions(
  reference = new Date()
): MonthYearOption[] {
  const min = getMinEndMonthYear(reference);
  const max = getMaxEndMonthYear(reference);
  const options: MonthYearOption[] = [];

  let month = min.month;
  let year = min.year;
  const maxValue = monthYearToValue(max);

  while (monthYearToValue({ month, year }) <= maxValue) {
    options.push({
      month,
      year,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return options;
}

/** Last calendar day of the given month (month is 1–12). */
export function toEndDate(month: number, year: number): Date {
  return new Date(year, month, 0);
}

export function toEndDateString(month: number, year: number): string {
  const d = toEndDate(month, year);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

export function recommendInterval(
  months: number
): CheckInInterval {
  if (months <= 2) return "daily";
  if (months <= 12) return "weekly";
  if (months <= 36) return "biweekly";
  return "monthly";
}

export function getIntervalLabel(interval: CheckInInterval): string {
  switch (interval) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
  }
}

export function getIntervalNoun(interval: CheckInInterval): string {
  switch (interval) {
    case "daily":
      return "daily";
    case "weekly":
      return "weekly";
    case "biweekly":
      return "biweekly";
    case "monthly":
      return "monthly";
  }
}

export function getRecommendationCopy(
  months: number,
  selected: CheckInInterval
): string {
  const recommended = recommendInterval(months);
  const timeframe =
    months <= 1 ? "1-month" : `${months}-month`;

  if (selected === recommended) {
    return `For a ${timeframe} goal, ${getIntervalNoun(selected)} weigh-ins are usually most effective.`;
  }

  return `For a ${timeframe} goal, we recommend ${getIntervalNoun(recommended)} weigh-ins.`;
}

export function countCheckIns(
  start: Date,
  end: Date,
  interval: CheckInInterval
): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / msPerDay)
  );

  switch (interval) {
    case "daily":
      return days;
    case "weekly":
      return Math.ceil(days / 7);
    case "biweekly":
      return Math.ceil(days / 14);
    case "monthly": {
      let count = 0;
      const cursor = new Date(start);
      while (cursor <= end) {
        count++;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return Math.max(count, 1);
    }
  }
}

export function formatHoursLabel(hours: HoursPerWeek): string {
  return hours >= 10 ? "10+ hrs" : `${hours} hr${hours === 1 ? "" : "s"}`;
}

export function parseEndDateToMonthYear(
  endDate: string | null
): MonthYear | null {
  if (!endDate) return null;
  const d = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDurationSummary(
  endDate: string,
  interval: CheckInInterval
): string {
  const start = new Date();
  const end = new Date(`${endDate}T00:00:00`);
  const months = Math.max(1, monthsBetween(start, end));
  const checkIns = countCheckIns(start, end, interval);
  const intervalNoun = getIntervalNoun(interval);
  return `${months} month${months === 1 ? "" : "s"} and approximately ${checkIns} ${intervalNoun} weigh-in${checkIns === 1 ? "" : "s"}`;
}
