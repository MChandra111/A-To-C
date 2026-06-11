import { redirect } from "next/navigation";
import { ResourceLibraryView } from "@/components/resources/ResourceLibraryView";
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

  const groups = await getResourceLibrary();

  return <ResourceLibraryView groups={groups} />;
}
