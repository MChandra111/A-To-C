import { notFound } from "next/navigation";
import { SharedRoadmapView } from "@/components/share/SharedRoadmapView";
import { getSharedRoadmapData } from "@/lib/share/getSharedRoadmapData";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const data = await getSharedRoadmapData(token);

  if (!data) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/50 px-4 py-3">
        <p className="mx-auto max-w-2xl font-display text-sm font-bold text-text-primary">
          A-To-C
        </p>
      </header>
      <SharedRoadmapView data={data} />
    </div>
  );
}
