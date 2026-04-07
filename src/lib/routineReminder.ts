export type RoutineKind = "am" | "pm";

/** In-app chat from Clinic Support (clinic chatbot). */
export function buildRoutineReminderMessage(params: {
  kind: RoutineKind;
  remainingLabels: string[];
}): string {
  const { kind, remainingLabels } = params;
  if (remainingLabels.length === 0) {
    return "";
  }
  const list = remainingLabels.join(", ");
  if (kind === "am") {
    return `SkinnFit Clinic: morning routine reminder — you still have these AM steps left today: ${list}. Open your dashboard to check them off.`;
  }
  return `SkinnFit Clinic: evening routine reminder — you still have these PM steps left today: ${list}. Open your dashboard to check them off.`;
}
