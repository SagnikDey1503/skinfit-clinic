/** Default rows for `priority_reminders` (schedules page). */
export const DEFAULT_PRIORITY_REMINDERS = [
  { sortOrder: 1, title: "Complete AM Routine", priority: "high" as const },
  {
    sortOrder: 2,
    title: "Upload Weekly Progress Photo",
    priority: "high" as const,
  },
  { sortOrder: 3, title: "Complete PM Routine", priority: "medium" as const },
  {
    sortOrder: 4,
    title: "Apply retinol serum (PM)",
    priority: "medium" as const,
  },
] as const;

/**
 * Optional seed rows for `schedule_events`. Intentionally empty so “My calendar”
 * only shows real data (clinic/API or user-created events), not demo Saturdays.
 */
export function getDefaultScheduleEvents() {
  return [] as { ymd: string; title: string; timeHm: string }[];
}
