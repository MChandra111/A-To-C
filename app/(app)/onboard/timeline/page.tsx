import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StepperNav } from "@/components/shared/StepperNav";
import { TimelineForm } from "@/components/onboard/TimelineForm";
import { findOnboardingAspiration } from "@/lib/supabase/draftAspiration";
import type { Aspiration } from "@/types";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aspirationId = await findOnboardingAspiration(supabase, user!.id);

  if (!aspirationId) {
    redirect("/onboard/aspiration");
  }

  const { data: aspiration } = await supabase
    .from("aspirations")
    .select("*")
    .eq("id", aspirationId)
    .single();

  if (!aspiration) {
    redirect("/onboard/aspiration");
  }

  return (
    <>
      <StepperNav currentStep={3} />

      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Your timeline
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          When &amp; how often
        </h1>
        <p className="mt-2 text-text-muted">
          Set your horizon and weigh-in rhythm. The roadmap is the meal plan —
          this is how often you step on the scale.
        </p>
      </div>

      <TimelineForm aspiration={aspiration as Aspiration} />
    </>
  );
}
