/** localStorage: read cursor for Clinic Support thread (clinic-originated messages). */
export const CLINIC_SUPPORT_INBOX_LAST_SEEN_KEY = "skinfit.clinicSupportLastSeenAt";

/** localStorage: read cursor for Dr. Ruby (doctor assistant) thread. */
export const DOCTOR_CHAT_INBOX_LAST_SEEN_KEY = "skinfit.doctorChatLastSeenAt";

export const CLINIC_SUPPORT_INBOX_EVENT = "skinfit-clinic-support-inbox-seen";

/** Fire after server adds a Clinic Support message so the nav bell updates without waiting for poll. */
export const CLINIC_SUPPORT_INBOX_REFRESH_EVENT = "skinfit-clinic-support-inbox-refresh";

function dispatchInboxUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLINIC_SUPPORT_INBOX_EVENT));
}

export function getClinicSupportInboxLastSeenIso(): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return (
    window.localStorage.getItem(CLINIC_SUPPORT_INBOX_LAST_SEEN_KEY) ??
    new Date(0).toISOString()
  );
}

export function getDoctorInboxLastSeenIso(): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return (
    window.localStorage.getItem(DOCTOR_CHAT_INBOX_LAST_SEEN_KEY) ??
    new Date(0).toISOString()
  );
}

/** Advance read cursor to at least server max or “now” so the nav badge clears. */
export function markClinicSupportInboxSeenFromServer(iso?: string | null) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const from = iso ? Date.parse(iso) : NaN;
  const ms = Math.max(Number.isNaN(from) ? 0 : from, now);
  window.localStorage.setItem(
    CLINIC_SUPPORT_INBOX_LAST_SEEN_KEY,
    new Date(ms).toISOString()
  );
  dispatchInboxUpdated();
}

/** @deprecated use markClinicSupportInboxSeenFromServer */
export function setClinicSupportInboxLastSeenIso(iso: string) {
  markClinicSupportInboxSeenFromServer(iso);
}

export function markDoctorInboxSeenFromServer(iso?: string | null) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const from = iso ? Date.parse(iso) : NaN;
  const ms = Math.max(Number.isNaN(from) ? 0 : from, now);
  window.localStorage.setItem(
    DOCTOR_CHAT_INBOX_LAST_SEEN_KEY,
    new Date(ms).toISOString()
  );
  dispatchInboxUpdated();
}

