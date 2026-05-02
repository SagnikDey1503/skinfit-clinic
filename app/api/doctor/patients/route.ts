import { NextResponse } from "next/server";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/src/db";
import { chatMessages, chatThreads, users } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";

export async function GET(req: Request) {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const concern = url.searchParams.get("concern")?.trim() ?? "";
  const sosOnly = url.searchParams.get("sos") === "1";

  let restrictIds: string[] | null = null;
  if (sosOnly) {
    const since = subDays(new Date(), 14);
    const rows = await db
      .selectDistinct({ userId: chatThreads.userId })
      .from(chatMessages)
      .innerJoin(chatThreads, eq(chatMessages.threadId, chatThreads.id))
      .where(
        and(
          eq(chatThreads.assistantId, "doctor"),
          eq(chatMessages.sender, "patient"),
          eq(chatMessages.isUrgent, true),
          gte(chatMessages.createdAt, since)
        )
      );
    restrictIds = rows.map((r) => r.userId);
    if (restrictIds.length === 0) {
      return NextResponse.json({ success: true, patients: [] });
    }
  }

  const conditions = [eq(users.role, "patient")];
  if (restrictIds) {
    conditions.push(inArray(users.id, restrictIds));
  }
  if (concern) {
    conditions.push(eq(users.primaryConcern, concern));
  }
  if (q.length > 0) {
    const pattern = `%${q}%`;
    conditions.push(
      or(ilike(users.name, pattern), ilike(users.email, pattern))!
    );
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      primaryConcern: users.primaryConcern,
      onboardingComplete: users.onboardingComplete,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(200);

  return NextResponse.json({
    success: true,
    patients: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      primaryConcern: r.primaryConcern,
      onboardingComplete: r.onboardingComplete,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
