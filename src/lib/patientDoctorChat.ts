import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { chatMessages, chatThreads } from "@/src/db/schema";

/** Patient-originated message on the doctor chat thread (e.g. questionnaire alerts, SOS). */
export async function postPatientDoctorThreadMessage(
  userId: string,
  text: string,
  isUrgent: boolean
): Promise<void> {
  const body = text.trim().slice(0, 12_000);
  if (!body) return;

  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(
      and(eq(chatThreads.userId, userId), eq(chatThreads.assistantId, "doctor"))
    )
    .orderBy(desc(chatThreads.createdAt))
    .limit(1);

  const threadId = thread?.id
    ? thread.id
    : (
        await db
          .insert(chatThreads)
          .values({ userId, assistantId: "doctor" })
          .returning({ id: chatThreads.id })
      )[0]?.id;

  if (!threadId) {
    throw new Error("THREAD_CREATE_FAILED");
  }

  await db.insert(chatMessages).values({
    threadId,
    sender: "patient",
    text: body,
    isUrgent,
  });
}
