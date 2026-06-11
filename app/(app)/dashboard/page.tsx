import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardData } from "@/lib/dashboard/getDashboardData";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  return <DashboardView data={data} />;
}
