import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";
import { parseDoctorRoutinePlanPatch } from "@/src/lib/routine";

export async function PATCH(
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
    columns: { id: true, onboardingComplete: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!patient.onboardingComplete) {
    return NextResponse.json(
      {
        error: "PATIENT_STILL_ONBOARDING",
        message: "Finish onboarding before assigning a routine plan.",
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = parseDoctorRoutinePlanPatch(body);
  if (parsed.kind === "error") {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.kind === "clear") {
    await db
      .update(users)
      .set({
        routinePlanAmItems: [],
        routinePlanPmItems: [],
        routinePlanClinicianLocked: false,
      })
      .where(eq(users.id, patientId));
    return NextResponse.json({ ok: true, cleared: true });
  }

  await db
    .update(users)
    .set({
      routinePlanAmItems: parsed.am,
      routinePlanPmItems: parsed.pm,
      routinePlanClinicianLocked: true,
    })
    .where(eq(users.id, patientId));

  return NextResponse.json({ ok: true });
}
