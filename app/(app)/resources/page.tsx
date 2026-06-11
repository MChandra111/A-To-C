import { redirect } from "next/navigation";
import { ResourceLibraryPreview } from "@/components/resources/ResourceLibraryPreview";
import { ResourceLibraryView } from "@/components/resources/ResourceLibraryView";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { getResourceLibrary } from "@/lib/resources/getResourceLibrary";
import { createClient } from "@/lib/supabase/server";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(supabase, user.id);

  if (!isGuruPlan(plan)) {
    return <ResourceLibraryPreview />;
  }

  const groups = await getResourceLibrary();

  return <ResourceLibraryView groups={groups} />;
}
