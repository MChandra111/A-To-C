import { createClient } from "@/lib/supabase/server";
import { StepperNav } from "@/components/shared/StepperNav";
import { CapabilitiesForm } from "@/components/onboard/CapabilitiesForm";

export default async function CapabilitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: capabilities } = await supabase
    .from("capabilities")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const uploads = (capabilities ?? []).filter((c) => c.source_type === "upload");
  const textCapability = (capabilities ?? []).find((c) => c.source_type === "text");

  return (
    <>
      <StepperNav currentStep={1} />

      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Where you are today
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          Your capabilities
        </h1>
        <p className="mt-2 text-text-muted">
          Build your starting snapshot from documents, your own words, or both
          together. Everything you add is combined when we analyze your gap.
        </p>
      </div>

      <CapabilitiesForm
        initialUploads={uploads}
        initialFreeText={textCapability?.content ?? ""}
        initialTextCapabilityId={textCapability?.id ?? null}
      />
    </>
  );
}
