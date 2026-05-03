/**
 * Optional mirror write-back to Google Sheet after Skinfit processes CRM webhook.
 * Deploy the same Apps Script web app with `kind: "skinfit_row_sync"` handler, then set:
 *   CLINIC_SHEET_SYNC_WEBHOOK_URL=https://script.google.com/macros/s/.../exec?secret=...
 * Uses the same secret as other sheet webhooks.
 */
export async function notifyClinicSheetRowMirrored(opts: {
  externalRef: string | null | undefined;
  skinfitStatus: "pending" | "confirmed" | "cancelled" | "declined";
  confirmedIso?: string | null;
  notes?: string | null;
  /** Same-day end `HH:mm` in clinic wall time (optional). */
  confirmedSlotEndTimeHm?: string | null;
  patientClinicNote?: string | null;
  patientClinicNoteAt?: string | null;
}): Promise<void> {
  const urlRaw = process.env.CLINIC_SHEET_SYNC_WEBHOOK_URL?.trim();
  const secret = process.env.CLINIC_SHEET_WEBHOOK_SECRET?.trim();
  const ref = opts.externalRef?.trim();
  if (!urlRaw || !secret || !ref) return;

  try {
    const outbound = new URL(urlRaw);
    if (!outbound.searchParams.get("secret")) {
      outbound.searchParams.set("secret", secret);
    }
    await fetch(outbound.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-skinfit-sheet-secret": secret,
      },
      body: JSON.stringify({
        kind: "skinfit_row_sync",
        externalRef: ref,
        skinfitStatus: opts.skinfitStatus,
        confirmedIso: opts.confirmedIso ?? null,
        notes: opts.notes ?? null,
        confirmedSlotEndTimeHm: opts.confirmedSlotEndTimeHm ?? null,
        patientClinicNote: opts.patientClinicNote ?? null,
        patientClinicNoteAt: opts.patientClinicNoteAt ?? null,
      }),
    });
  } catch (e) {
    console.warn("[clinicSheetRowSync] mirror failed", e);
  }
}
