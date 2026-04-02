import { and, eq, lt } from "drizzle-orm";
import { db } from "@/src/db";
import { appointments } from "@/src/db/schema";

/** Sets `scheduled` → `completed` when visit time is in the past. */
export async function markPastAppointmentsCompleted(now: Date = new Date()) {
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(
      and(eq(appointments.status, "scheduled"), lt(appointments.dateTime, now))
    );
}
