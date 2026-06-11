const MAX_EXTRACTED_LENGTH = 50_000;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

const EXTENSION_MIME_MAP: Record<string, AllowedMimeType> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export function resolveMimeType(fileName: string, reportedMime: string): AllowedMimeType | null {
  if (isAllowedMimeType(reportedMime)) return reportedMime;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension && extension in EXTENSION_MIME_MAP) {
    return EXTENSION_MIME_MAP[extension];
  }

  return null;
}

function truncateText(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= MAX_EXTRACTED_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_EXTRACTED_LENGTH)}\n\n[Truncated — content exceeded ${MAX_EXTRACTED_LENGTH} characters]`;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return text ?? "";
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

function parseTxt(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: AllowedMimeType
): Promise<string> {
  let text = "";

  switch (mimeType) {
    case "application/pdf":
      text = await parsePdf(buffer);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await parseDocx(buffer);
      break;
    case "text/plain":
      text = parseTxt(buffer);
      break;
    default:
      throw new Error("Unsupported file type");
  }

  const trimmed = truncateText(text);
  if (!trimmed) {
    throw new Error("No text could be extracted from this file");
  }

  return trimmed;
}
