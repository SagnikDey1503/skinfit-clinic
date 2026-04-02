import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { CLINIC_DOCTOR_EMAIL } from "@/src/lib/clinicDoctor";

export async function GET() {
  try {
    const doctors = await db.query.users.findMany({
      where: and(
        eq(users.role, "doctor"),
        eq(users.email, CLINIC_DOCTOR_EMAIL)
      ),
      columns: { id: true, name: true, email: true },
      orderBy: (t, { asc }) => asc(t.name),
    });

    return NextResponse.json({
      doctors: doctors.map((d) => ({
        ...d,
        name: (d.name ?? "").trim() || "Doctor",
      })),
    });
  } catch (err) {
    console.error("Clinic doctors API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

