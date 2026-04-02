/**
 * PostgreSQL `date` + JS `Date` round-trip: avoid local-midnight instants
 * (e.g. Asia/Singapore midnight → previous day in UTC → wrong DATE in DB).
 * Use UTC noon for a given calendar YYYY-MM-DD everywhere we read/write `daily_logs.date`.
 */

export function localCalendarYmd(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Valid YYYY-MM-DD → Date at 12:00 UTC (stable civil date for PG `date`). */
export function dateOnlyFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function parseYmdToDateOnly(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Serialize a PG `date` (or our UTC-noon Date) back to YYYY-MM-DD. */
export function ymdFromDateOnly(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

/**
 * Raw UTC calendar date + time from an instant (legacy / debugging).
 * For booked visits, prefer `utcInstantToClinicWallYmdHm` from
 * `clinicSlotUtcInstant.ts` when using `CLINIC_SLOT_UTC_OFFSET_MINUTES`.
 */
export function ymdAndHmFromUtcWallClock(dt: Date): {
  ymd: string;
  hm: string;
} {
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  return { ymd: `${y}-${mo}-${d}`, hm: `${hh}:${mm}` };
}
