import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { dailyFocus, users } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";
import { dateOnlyFromYmd, parseYmdToDateOnly } from "@/src/lib/date-only";
import { localYmdAndHm, normalizeIanaTimeZone } from "@/src/lib/timeZoneWallClock";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ patientId: string }> }
) {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { patientId } = await ctx.params;
  if (!patientId) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const patient = await db.query.users.findFirst({
    where: and(eq(users.id, patientId), eq(users.role, "patient")),
    columns: { id: true, timezone: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    message?: string;
    sourceParam?: string;
    focusDateYmd?: string;
  } | null;

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "INVALID_MESSAGE" }, { status: 400 });
  }

  const sourceParamRaw =
    typeof body?.sourceParam === "string" ? body.sourceParam.trim() : "";
  const sourceParam = sourceParamRaw ? sourceParamRaw.slice(0, 64) : null;

  let ymd: string;
  if (body?.focusDateYmd && parseYmdToDateOnly(body.focusDateYmd)) {
    ymd = body.focusDateYmd.slice(0, 10);
  } else {
    ymd = localYmdAndHm(
      new Date(),
      normalizeIanaTimeZone(patient.timezone)
    ).ymd;
  }

  const focusDate = dateOnlyFromYmd(ymd);

  await db
    .insert(dailyFocus)
    .values({
      userId: patientId,
      focusDate,
      message,
      sourceParam,
    })
    .onConflictDoUpdate({
      target: [dailyFocus.userId, dailyFocus.focusDate],
      set: {
        message,
        sourceParam,
      },
    });

  return NextResponse.json({ ok: true, focusDateYmd: ymd });
}
