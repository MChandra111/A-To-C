"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, PenLine, Layers } from "lucide-react";
import { FileUploader, UploadedFilePreview } from "@/components/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiError, readApiJson } from "@/lib/utils/api";
import { runAsync } from "@/lib/utils/async";
import type { Capability } from "@/types";

interface CapabilitiesFormProps {
  initialUploads: Capability[];
  initialFreeText: string;
  initialTextCapabilityId: string | null;
}

export function CapabilitiesForm({
  initialUploads,
  initialFreeText,
  initialTextCapabilityId,
}: CapabilitiesFormProps) {
  const router = useRouter();

  const [uploads, setUploads] = useState(
    initialUploads.map((c) => ({
      id: c.id,
      fileName: c.file_name ?? "Uploaded file",
      content: c.content,
    }))
  );
  const [freeText, setFreeText] = useState(initialFreeText);
  const [textCapabilityId, setTextCapabilityId] = useState(initialTextCapabilityId);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const hasUploads = uploads.some((u) => u.content.trim().length > 0);
  const hasFreeText = freeText.trim().length > 0;
  const hasContent = hasUploads || hasFreeText;
  const isCombined = hasUploads && hasFreeText;

  async function persistCapabilities() {
    for (const upload of uploads) {
      if (!upload.content.trim()) continue;

      const response = await fetch(`/api/capabilities/${upload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: upload.content }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(response, `Failed to save ${upload.fileName}`)
        );
      }
    }

    if (hasFreeText) {
      const response = await fetch("/api/capabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: freeText }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Failed to save additional notes")
        );
      }

      const data = await readApiJson<{ capability_id: string }>(response);
      setTextCapabilityId(data.capability_id);
    } else if (textCapabilityId) {
      const response = await fetch(`/api/capabilities/${textCapabilityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Failed to clear additional notes")
        );
      }

      setTextCapabilityId(null);
    }
  }

  async function handleFilesSelected(files: File[]) {
    setError(null);
    setSavedMessage(null);
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/capabilities/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, "Upload failed"));
      }

      const data = await readApiJson<{
        capabilities: {
          capability_id: string;
          extracted_text: string;
          file_name: string;
        }[];
      }>(response);

      const newUploads = (data.capabilities as {
        capability_id: string;
        extracted_text: string;
        file_name: string;
      }[]).map((cap) => ({
        id: cap.capability_id,
        fileName: cap.file_name,
        content: cap.extracted_text,
      }));

      setUploads((prev) => [...prev, ...newUploads]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleUploadContentChange(id: string, content: string) {
    setSavedMessage(null);
    setUploads((prev) =>
      prev.map((upload) => (upload.id === id ? { ...upload, content } : upload))
    );
  }

  async function handleRemoveUpload(id: string) {
    setError(null);
    setSavedMessage(null);

    try {
      const response = await fetch(`/api/capabilities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await getApiError(response, "Failed to remove file"));
        return;
      }

      setUploads((prev) => prev.filter((upload) => upload.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove file");
    }
  }

  async function handleSaveDraft() {
    if (!hasContent) {
      setError("Add at least one document or additional notes to save.");
      return;
    }

    setError(null);
    setSavedMessage(null);
    setSaving(true);

    try {
      await persistCapabilities();
      setSavedMessage("Saved. You can come back and add more anytime.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    if (!hasContent) {
      setError("Add at least one document or additional notes to continue.");
      return;
    }

    setError(null);
    setSavedMessage(null);
    setSaving(true);

    try {
      await persistCapabilities();
      router.push("/onboard/aspiration");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {hasContent && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-text-primary">
                {isCombined
                  ? "Combined snapshot"
                  : hasUploads
                    ? "Document snapshot"
                    : "Written snapshot"}
              </p>
              <p className="text-sm text-text-muted">
                {isCombined ? (
                  <>
                    {uploads.filter((u) => u.content.trim()).length} document
                    {uploads.filter((u) => u.content.trim()).length === 1 ? "" : "s"}{" "}
                    + your additional notes will be used together for gap analysis.
                  </>
                ) : hasUploads ? (
                  <>
                    {uploads.filter((u) => u.content.trim()).length} document
                    {uploads.filter((u) => u.content.trim()).length === 1
                      ? ""
                      : "s"}{" "}
                    saved. Add notes below to combine with your uploads.
                  </>
                ) : (
                  "Your written notes are saved. Upload documents above to add more context."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Documents
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Resume, transcript, portfolio — up to 3 files. Add these alongside
              your written notes; both are included.
            </p>
          </div>
        </div>

        <FileUploader
          onFilesSelected={handleFilesSelected}
          currentCount={uploads.length}
          uploading={uploading}
          disabled={saving}
        />

        {uploads.length > 0 && (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <UploadedFilePreview
                key={upload.id}
                id={upload.id}
                fileName={upload.fileName}
                content={upload.content}
                onContentChange={handleUploadContentChange}
                onRemove={handleRemoveUpload}
                disabled={saving || uploading}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Additional notes
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Context that isn&apos;t in your documents — side projects, skills,
              goals, gaps. Combines with any uploads above.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="freeText">Background, skills, and experience</Label>
          <Textarea
            id="freeText"
            value={freeText}
            onChange={(e) => {
              setSavedMessage(null);
              setFreeText(e.target.value);
            }}
            disabled={saving}
            placeholder={`I'm a 3rd year business student. I know Excel, some Python, and have done one marketing internship. I have a 3.4 GPA and no research experience.`}
            className="min-h-[200px]"
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-decline" role="alert">
          {error}
        </p>
      )}
      {savedMessage && (
        <p className="text-sm text-success" role="status">
          {savedMessage}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => runAsync(handleSaveDraft, (err) => setError(err instanceof Error ? err.message : "Failed to save"))}
          disabled={saving || uploading || !hasContent}
        >
          Save for later
        </Button>
        <Button
          type="button"
          onClick={() => runAsync(handleSaveAndContinue, (err) => setError(err instanceof Error ? err.message : "Failed to save"))}
          disabled={saving || uploading || !hasContent}
        >
          {saving ? "Saving..." : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}
