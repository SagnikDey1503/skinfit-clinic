import { ymdFromDateOnly, parseYmdToDateOnly } from "@/src/lib/date-only";
import { normalizeSlotHm } from "@/src/lib/slotTimeHm";

const HM_STRICT = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Default IST (+5:30). Slot HH:mm matches clinic wall clock + Google Calendar in India. */
export const DEFAULT_CLINIC_SLOT_UTC_OFFSET_MINUTES = 330;

/**
 * Minutes to add to a UTC instant to recover clinic "wall clock" (e.g. IST = +330).
 * Slot HH:mm in the DB is interpreted in that zone, then converted to a real UTC instant.
 *
 * Default **330** (IST) so `11:30` slots store as `06:00Z` → Google shows **11:30 AM** local, not 5:00 PM.
 * Set `CLINIC_SLOT_UTC_OFFSET_MINUTES=0` if your slot times are literal UTC (legacy).
 */
export function getClinicSlotUtcOffsetMinutes(): number {
  const raw = process.env.CLINIC_SLOT_UTC_OFFSET_MINUTES?.trim();
  if (raw === undefined || raw === "") return DEFAULT_CLINIC_SLOT_UTC_OFFSET_MINUTES;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : DEFAULT_CLINIC_SLOT_UTC_OFFSET_MINUTES;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * PG `date` + slot `HH:mm` (clinic wall) → absolute `Date` (UTC instant).
 */
export function slotDateAndHmToUtcInstant(
  slotDate: Date | string,
  slotTimeHm: string
): Date | null {
  const ymd = ymdFromDateOnly(slotDate);
  const n = normalizeSlotHm(slotTimeHm);
  if (!n) return null;
  const m = HM_STRICT.exec(n);
  if (!m) return null;
  const [y, mo, d] = ymd.split("-").map(Number);
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const treatedAsUtcMs = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const offset = getClinicSlotUtcOffsetMinutes();
  return new Date(treatedAsUtcMs - offset * 60 * 1000);
}

export function ymdHmStringsToUtcInstant(ymd: string, hm: string): Date | null {
  const slotDate = parseYmdToDateOnly(ymd);
  if (!slotDate) return null;
  return slotDateAndHmToUtcInstant(slotDate, hm);
}

/**
 * Stored appointment instant → clinic wall `YYYY-MM-DD` + `HH:mm` (matches slot keys / UI).
 */
export function utcInstantToClinicWallYmdHm(dt: Date): { ymd: string; hm: string } {
  const offset = getClinicSlotUtcOffsetMinutes();
  const wallMs = dt.getTime() + offset * 60 * 1000;
  const w = new Date(wallMs);
  const y = w.getUTCFullYear();
  const mo = pad2(w.getUTCMonth() + 1);
  const d = pad2(w.getUTCDate());
  const hh = pad2(w.getUTCHours());
  const mm = pad2(w.getUTCMinutes());
  return { ymd: `${y}-${mo}-${d}`, hm: `${hh}:${mm}` };
}

/** Match `slotKeyFromSlotDateAndHm` for a stored appointment row. */
export function slotKeyFromStoredAppointmentInstant(dt: Date): string {
  const { ymd, hm } = utcInstantToClinicWallYmdHm(dt);
  return `${ymd}T${hm}`;
}
