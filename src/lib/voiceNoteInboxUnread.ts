import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { doctorFeedbackVoiceNotes, users } from "@/src/db/schema";

/** Voice notes created after the patient last marked doctor feedback as viewed. */
export async function countUnreadVoiceNotesForPatient(
  userId: string
): Promise<number> {
  const [u] = await db
    .select({ viewedAt: users.doctorFeedbackViewedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const viewedAt = u?.viewedAt ?? null;

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(doctorFeedbackVoiceNotes)
    .where(
      and(
        eq(doctorFeedbackVoiceNotes.userId, userId),
        isNull(doctorFeedbackVoiceNotes.scanId),
        viewedAt
          ? sql`${doctorFeedbackVoiceNotes.createdAt} > (${viewedAt}::timestamptz + interval '1 second')`
          : sql`true`
      )
    );

  return Math.min(99, Number(row?.n ?? 0));
}
