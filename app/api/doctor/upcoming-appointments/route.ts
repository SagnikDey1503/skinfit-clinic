import { NextResponse } from "next/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/src/db";
import { appointments, users } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";

/** Next 14 days of scheduled visits for this doctor (all patients for admin). */
export async function GET() {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const staff = await db.query.users.findFirst({
    where: eq(users.id, staffId),
    columns: { role: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const base = and(
    eq(appointments.status, "scheduled"),
    gte(appointments.dateTime, start),
    lte(appointments.dateTime, end)
  );

  const scope =
    staff.role === "admin" ? base : and(base, eq(appointments.doctorId, staffId));

  const rows = await db
    .select({
      id: appointments.id,
      dateTime: appointments.dateTime,
      type: appointments.type,
      patientId: appointments.userId,
      patientName: users.name,
      patientEmail: users.email,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(scope)
    .orderBy(asc(appointments.dateTime))
    .limit(80);

  return NextResponse.json({
    success: true,
    items: rows.map((r) => ({
      appointmentId: r.id,
      patientId: r.patientId,
      patientName: r.patientName?.trim() || r.patientEmail || "Patient",
      dateTime: r.dateTime.toISOString(),
      type: r.type,
    })),
  });
}
