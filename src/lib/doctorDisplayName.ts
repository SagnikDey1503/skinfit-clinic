/** Trimmed name from `users.name`, or fallback for empty values. */
export function doctorDisplayName(raw: string | null | undefined): string {
  const n = (raw ?? "").trim();
  return n.length > 0 ? n : "Doctor";
}

/**
 * Title for “My calendar” rows sourced from `appointments` + doctor user.
 * Avoids awkward doubling if the type label already implies a visit.
 */
export function appointmentCalendarTitle(
  typeLabel: string,
  doctorName: string
): string {
  const dr = doctorDisplayName(doctorName);
  return `${typeLabel} with ${dr}`;
}
