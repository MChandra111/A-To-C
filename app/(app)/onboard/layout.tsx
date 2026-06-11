import { redirect } from "next/navigation";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { countUserRoadmaps } from "@/lib/plans/limits";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [plan, roadmapCount] = await Promise.all([
    getUserPlan(supabase, user.id),
    countUserRoadmaps(supabase, user.id),
  ]);

  if (!isGuruPlan(plan) && roadmapCount > 0) {
    redirect("/upgrade");
  }

  return <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>;
}
