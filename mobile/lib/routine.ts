/** Matches web `src/lib/routine.ts` `normalizeRoutineSteps` for AM/PM checklist length. */

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

/** Fraction of AM + PM routine steps checked (0–1). Matches web `src/lib/routine.ts`. */
export function routineStepsProgress(am: boolean[], pm: boolean[]): number {
  const n = am.length + pm.length;
  if (n === 0) return 0;
  const done =
    am.filter(Boolean).length + pm.filter(Boolean).length;
  return Math.min(1, Math.max(0, done / n));
}
