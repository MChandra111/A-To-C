import { GURU_CHECKOUT_URL } from "@/lib/plans/constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserId(value: string): boolean {
  return UUID_RE.test(value);
}

/** Stripe Payment Link with client_reference_id for webhook user matching. */
export function buildGuruCheckoutUrl(userId: string): string {
  const url = new URL(GURU_CHECKOUT_URL);
  if (isValidUserId(userId)) {
    url.searchParams.set("client_reference_id", userId);
  }
  return url.toString();
}
