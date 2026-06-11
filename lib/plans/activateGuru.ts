import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUserId } from "@/lib/plans/checkoutUrl";
import { GURU_PRICE_USD } from "@/lib/plans/constants";
import { ensureRoadmapsUnlockedForUser } from "@/lib/plans/unlockRoadmaps";

export interface ActivateGuruInput {
  stripeEventId: string;
  stripeCheckoutSessionId: string;
  clientReferenceId?: string | null;
  customerEmail?: string | null;
  amountCents: number;
  currency: string;
}

export type ActivateGuruResult = {
  ok: boolean;
  userId?: string;
  alreadyGuru?: boolean;
  roadmapsUnlocked?: number;
  unlockErrors?: string[];
  error?: string;
};

export function isExpectedGuruPayment(
  amountCents: number,
  currency: string
): boolean {
  return (
    currency.toLowerCase() === "usd" &&
    amountCents === Math.round(GURU_PRICE_USD * 100)
  );
}

async function resolveUserId(
  clientReferenceId: string | null | undefined,
  customerEmail: string | null | undefined
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  if (clientReferenceId && isValidUserId(clientReferenceId)) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", clientReferenceId)
      .maybeSingle();

    if (profile?.id) return profile.id;
  }

  const email = customerEmail?.trim();
  if (!email) return null;

  const { data: userId, error } = await admin.rpc("user_id_for_email", {
    user_email: email,
  });

  if (error) {
    console.error("user_id_for_email failed:", error.message);
    return null;
  }

  return typeof userId === "string" ? userId : null;
}

export async function activateGuruPlan(
  input: ActivateGuruInput
): Promise<ActivateGuruResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Admin client not configured" };
  }

  if (!isExpectedGuruPayment(input.amountCents, input.currency)) {
    return {
      ok: false,
      error: `Unexpected payment amount: ${input.amountCents} ${input.currency}`,
    };
  }

  const userId = await resolveUserId(
    input.clientReferenceId,
    input.customerEmail
  );

  if (!userId) {
    return {
      ok: false,
      error: "No matching A-To-C account for this checkout",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { ok: false, error: "Profile not found" };
  }

  const wasAlreadyGuru = profile.plan_tier === "guru";

  if (!wasAlreadyGuru) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ plan_tier: "guru" })
      .eq("id", userId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { error: purchaseError } = await admin.from("guru_purchases").insert({
      user_id: userId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      customer_email: input.customerEmail ?? null,
      amount_cents: input.amountCents,
      currency: input.currency.toLowerCase(),
    });

    if (purchaseError && purchaseError.code !== "23505") {
      console.error("guru_purchases insert failed:", purchaseError.message);
    }
  }

  const unlock = await ensureRoadmapsUnlockedForUser(userId);

  return {
    ok: true,
    userId,
    alreadyGuru: wasAlreadyGuru,
    roadmapsUnlocked: unlock.unlocked,
    unlockErrors: unlock.errors.length > 0 ? unlock.errors : undefined,
  };
}
