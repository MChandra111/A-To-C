import { getWeighInStatus } from "@/lib/dashboard/weighInSchedule";
import type { CheckInInterval } from "@/types";

export interface WeighInGateResult {
  allowed: boolean;
  status: ReturnType<typeof getWeighInStatus>;
  errorMessage?: string;
}

export function validateWeighInWindow(
  interval: CheckInInterval,
  lastWeighIn: Date | null,
  baselineDate: string | null,
  reference = new Date()
): WeighInGateResult {
  const status = getWeighInStatus(
    interval,
    lastWeighIn,
    baselineDate,
    reference
  );

  if (!status.canWeighIn) {
    return {
      allowed: false,
      status,
      errorMessage: status.scheduleMessage,
    };
  }

  return { allowed: true, status };
}
