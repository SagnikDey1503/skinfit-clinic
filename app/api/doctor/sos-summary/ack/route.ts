import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/src/db";
import { chatMessages, chatThreads, doctorSosAcknowledgements } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";

const SOS_WINDOW_DAYS = 14;

export async function POST(req: Request) {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const messageId =
    body &&
    typeof body === "object" &&
    typeof (body as { chatMessageId?: unknown }).chatMessageId === "string"
      ? (body as { chatMessageId: string }).chatMessageId.trim()
      : "";

  if (!messageId) {
    return NextResponse.json({ error: "CHAT_MESSAGE_ID_REQUIRED" }, { status: 400 });
  }

  const since = subDays(new Date(), SOS_WINDOW_DAYS);

  const [row] = await db
    .select({ id: chatMessages.id })
    .from(chatMessages)
    .innerJoin(chatThreads, eq(chatMessages.threadId, chatThreads.id))
    .where(
      and(
        eq(chatMessages.id, messageId),
        eq(chatThreads.assistantId, "doctor"),
        eq(chatMessages.sender, "patient"),
        eq(chatMessages.isUrgent, true),
        gte(chatMessages.createdAt, since)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "MESSAGE_NOT_FOUND_OR_NOT_SOS" }, { status: 404 });
  }

  try {
    await db.insert(doctorSosAcknowledgements).values({
      staffUserId: staffId,
      chatMessageId: messageId,
    });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ success: true, alreadyAcknowledged: true });
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}
