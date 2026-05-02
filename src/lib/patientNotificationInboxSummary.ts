/** Human-readable labels for patient dashboard bell + notifications page. */

export type InboxUnreadParts = {
  supportCount: number;
  doctorCount: number;
  voiceNoteGeneralCount: number;
  voiceNoteReportCount: number;
};

export function patientInboxTypeParts(b: InboxUnreadParts): string[] {
  const bits: string[] = [];
  if (b.supportCount > 0) {
    bits.push(
      b.supportCount === 1
        ? "Support chat"
        : `${b.supportCount} support messages`
    );
  }
  if (b.doctorCount > 0) {
    bits.push(
      b.doctorCount === 1
        ? "Doctor chat"
        : `${b.doctorCount} doctor messages`
    );
  }
  if (b.voiceNoteGeneralCount > 0) {
    bits.push(
      b.voiceNoteGeneralCount === 1
        ? "Doctor voice (home)"
        : `${b.voiceNoteGeneralCount} home voice notes`
    );
  }
  if (b.voiceNoteReportCount > 0) {
    bits.push(
      b.voiceNoteReportCount === 1
        ? "Voice on scan report"
        : `${b.voiceNoteReportCount} scan voice notes`
    );
  }
  return bits;
}

/** One line for UI (bell chip, page subtitle). */
export function patientInboxSummaryLine(b: InboxUnreadParts): string {
  const bits = patientInboxTypeParts(b);
  if (bits.length === 0) return "";
  if (bits.length === 1) return bits[0]!;
  if (bits.length === 2) return `${bits[0]!} · ${bits[1]!}`;
  return `${bits[0]!} · ${bits[1]!} +${bits.length - 2} more`;
}
