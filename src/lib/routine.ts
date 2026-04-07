/** Fixed AM/PM routine step labels — order matches DB `routine_am_steps` / `routine_pm_steps` arrays. */
export const AM_ROUTINE_ITEMS = [
  "Gentle Cleanser",
  "Toner",
  "Serum",
  "Moisturiser",
  "Spf",
] as const;

export const PM_ROUTINE_ITEMS = [
  "Oil Cleanser",
  "Toner",
  "Retinol",
  "Serum",
  "Night Cream",
] as const;

export const AM_ROUTINE_LEN = AM_ROUTINE_ITEMS.length;
export const PM_ROUTINE_LEN = PM_ROUTINE_ITEMS.length;

export function normalizeRoutineSteps(
  incoming: unknown,
  len: number,
  previous: boolean[] | null | undefined
): boolean[] {
  const raw = Array.isArray(incoming)
    ? incoming.map(Boolean)
    : previous && Array.isArray(previous)
      ? previous.map(Boolean)
      : [];
  return Array.from({ length: len }, (_, i) => Boolean(raw[i]));
}

/** Fraction of AM + PM routine steps checked (0–1). */
export function routineStepsProgress(am: boolean[], pm: boolean[]): number {
  const n = am.length + pm.length;
  if (n === 0) return 0;
  const done =
    am.filter(Boolean).length + pm.filter(Boolean).length;
  return Math.min(1, Math.max(0, done / n));
}
