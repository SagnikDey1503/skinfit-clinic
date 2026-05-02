export type VisitNoteAttachment = {
  fileName: string;
  mimeType: string;
  dataUri: string;
};

const MAX_ATTACHMENTS = 5;
export const MAX_VISIT_NOTE_ATTACHMENT_URI_LEN = 1_200_000;
const MAX_FILE_NAME_LEN = 200;
const MAX_NOTES_LEN = 16_000;

const ALLOWED_DATA_URI_PREFIXES = [
  "data:application/pdf",
  "data:image/jpeg",
  "data:image/jpg",
  "data:image/png",
  "data:image/webp",
  "data:image/gif",
  "data:text/plain",
] as const;

function mimeFromDataUri(uri: string): string | null {
  const m = /^data:([^;,]+)[;,]/.exec(uri);
  return m ? m[1].trim().toLowerCase() : null;
}

function isAllowedDataUri(uri: string): boolean {
  const lower = uri.slice(0, 64).toLowerCase();
  return ALLOWED_DATA_URI_PREFIXES.some((p) => lower.startsWith(p));
}

export function clampVisitNoteNotes(raw: string): string {
  return raw.trim().slice(0, MAX_NOTES_LEN);
}

export type ParsedVisitNoteAttachments =
  | { attachments: VisitNoteAttachment[] | null }
  | { error: string };

/** Validate clinician-submitted file payloads (data URIs). */
export function parseVisitNoteAttachmentsInput(
  raw: unknown
): ParsedVisitNoteAttachments {
  if (raw === undefined || raw === null) {
    return { attachments: null };
  }
  if (!Array.isArray(raw)) {
    return { error: "attachments must be an array." };
  }
  if (raw.length > MAX_ATTACHMENTS) {
    return { error: `At most ${MAX_ATTACHMENTS} files per note.` };
  }
  const out: VisitNoteAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid attachment entry." };
    }
    const o = item as Record<string, unknown>;
    const fileName =
      typeof o.fileName === "string" ? o.fileName.trim().slice(0, MAX_FILE_NAME_LEN) : "";
    const dataUri = typeof o.dataUri === "string" ? o.dataUri.trim() : "";
    if (!fileName || !dataUri) {
      return { error: "Each attachment needs fileName and dataUri." };
    }
    if (dataUri.length > MAX_VISIT_NOTE_ATTACHMENT_URI_LEN) {
      return { error: "One of the files is too large. Try a smaller PDF or image." };
    }
    if (!isAllowedDataUri(dataUri)) {
      return {
        error: "Only PDF, images (JPEG/PNG/WebP/GIF), or plain text files are allowed.",
      };
    }
    const mimeType = mimeFromDataUri(dataUri) ?? "application/octet-stream";
    out.push({ fileName, mimeType, dataUri });
  }
  return { attachments: out.length ? out : null };
}

export function finalVisitNoteNotesBody(
  notesTrimmed: string,
  hasAttachments: boolean
): string | { error: string } {
  if (notesTrimmed.length > 0) {
    return notesTrimmed;
  }
  if (hasAttachments) {
    return "Attached document(s) for your records.";
  }
  return { error: "Enter a note or attach at least one document." };
}
