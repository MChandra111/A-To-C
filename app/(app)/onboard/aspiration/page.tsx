import { createClient } from "@/lib/supabase/server";
import { StepperNav } from "@/components/shared/StepperNav";
import { AspirationForm } from "@/components/onboard/AspirationForm";
import { findOnboardingAspiration } from "@/lib/supabase/draftAspiration";
import type { Aspiration } from "@/types";

export default async function AspirationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aspirationId = await findOnboardingAspiration(supabase, user!.id);

  const { data: draftAspiration } = aspirationId
    ? await supabase.from("aspirations").select("*").eq("id", aspirationId).single()
    : { data: null };

  return (
    <>
      <StepperNav currentStep={2} />

      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Where you want to be
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          Your aspiration
        </h1>
        <p className="mt-2 text-text-muted">
          Define the destination clearly. This is what your Investment Score will
          measure dedication toward — not a to-do list, but a gap you&apos;re
          closing over time.
        </p>
      </div>

      <AspirationForm
        initialAspiration={(draftAspiration as Aspiration | null) ?? null}
      />
    </>
  );
}
