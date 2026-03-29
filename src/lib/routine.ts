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
