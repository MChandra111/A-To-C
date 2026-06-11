import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseDocument, resolveMimeType } from "@/lib/utils/parseDocument";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_REQUEST = 3;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES_PER_REQUEST} files per upload` },
      { status: 400 }
    );
  }

  const { count: existingUploadCount } = await supabase
    .from("capabilities")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source_type", "upload");

  const uploadSlotsRemaining = MAX_FILES_PER_REQUEST - (existingUploadCount ?? 0);
  if (files.length > uploadSlotsRemaining) {
    return NextResponse.json(
      {
        error: `You can have at most ${MAX_FILES_PER_REQUEST} uploaded files. Remove one before adding more.`,
      },
      { status: 400 }
    );
  }

  const results: {
    capability_id: string;
    extracted_text: string;
    file_name: string;
  }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 5MB limit` },
        { status: 400 }
      );
    }

    const mimeType = resolveMimeType(file.name, file.type || "application/octet-stream");
    if (!mimeType) {
      return NextResponse.json(
        { error: `"${file.name}" is not a supported type. Use PDF, DOCX, or TXT.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText: string;
    try {
      extractedText = await parseDocument(buffer, mimeType);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse file";
      return NextResponse.json({ error: `"${file.name}": ${message}` }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("capabilities")
      .insert({
        user_id: user.id,
        content: extractedText,
        source_type: "upload",
        file_name: file.name,
      })
      .select("id, content, file_name")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    results.push({
      capability_id: data.id,
      extracted_text: data.content,
      file_name: data.file_name ?? file.name,
    });
  }

  return NextResponse.json({ capabilities: results });
}
