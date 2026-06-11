"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";
const MAX_FILES = 3;

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  currentCount: number;
  uploading?: boolean;
}

export function FileUploader({
  onFilesSelected,
  disabled = false,
  currentCount,
  uploading = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const slotsRemaining = MAX_FILES - currentCount;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, slotsRemaining);
    if (files.length > 0) {
      void Promise.resolve(onFilesSelected(files)).catch(() => {
        // Parent handler is responsible for surfacing errors.
      });
    }
  }

  const isDisabled = disabled || uploading || slotsRemaining <= 0;

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDisabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!isDisabled) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated",
          isDisabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm font-medium text-text-primary">
          {uploading
            ? "Extracting text..."
            : slotsRemaining <= 0
              ? "Maximum files reached"
              : "Drop files here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          PDF, DOCX, or TXT · max 5MB each · {slotsRemaining} of {MAX_FILES} slots
          remaining
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        className="hidden"
        disabled={isDisabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface UploadedFilePreviewProps {
  id: string;
  fileName: string;
  content: string;
  onContentChange: (id: string, content: string) => void;
  onRemove: (id: string) => void | Promise<void>;
  disabled?: boolean;
}

export function UploadedFilePreview({
  id,
  fileName,
  content,
  onContentChange,
  onRemove,
  disabled = false,
}: UploadedFilePreviewProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-text-primary">{fileName}</p>
            <p className="text-xs text-text-muted">
              Extracted preview — edit anything that looks wrong
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-text-muted hover:text-decline"
          onClick={() => {
            void Promise.resolve(onRemove(id)).catch(() => {
              // Parent handler is responsible for surfacing errors.
            });
          }}
          disabled={disabled}
          aria-label={`Remove ${fileName}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(id, e.target.value)}
        disabled={disabled}
        className="min-h-[160px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
