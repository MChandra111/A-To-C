import { renderToBuffer } from "@react-pdf/renderer";
import { PerformanceReportDocument } from "@/lib/export/PerformanceReportDocument";
import { getPerformanceReportData } from "@/lib/export/getReportData";

export const runtime = "nodejs";

function buildFilename(
  data: NonNullable<Awaited<ReturnType<typeof getPerformanceReportData>>>
): string {
  const date = new Date().toISOString().slice(0, 10);
  if (data.type === "roadmap") {
    const slug = data.aspirationTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    return `a-to-c-${slug || "goal"}-${date}.pdf`;
  }
  return `a-to-c-dashboard-${date}.pdf`;
}

export async function GET(request: Request) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "dashboard";
  const roadmapId = searchParams.get("roadmap_id") ?? undefined;

  if (scope !== "dashboard" && scope !== "roadmap") {
    return Response.json({ error: "Invalid scope" }, { status: 400 });
  }

  if (scope === "roadmap" && !roadmapId) {
    return Response.json({ error: "roadmap_id is required" }, { status: 400 });
  }

  const data = await getPerformanceReportData(scope, roadmapId);

  if (!data) {
    return Response.json({ error: "Nothing to export" }, { status: 404 });
  }

  try {
    const buffer = await renderToBuffer(
      <PerformanceReportDocument data={data} />
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${buildFilename(data)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
