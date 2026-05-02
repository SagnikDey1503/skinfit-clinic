import { NextResponse } from "next/server";
import { markPastAppointmentsCompleted } from "@/src/lib/markPastAppointmentsCompleted";
import { runAppointmentReminders } from "@/src/lib/runAppointmentReminders";
import { runRoutineReminders } from "@/src/lib/runRoutineReminders";
export const dynamic = "force-dynamic";

function authorizeCron(req: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (expected) {
    return auth === `Bearer ${expected}`;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { error: "CRON_SECRET must be set in production." },
      { status: 500 }
    );
  }

  try {
    await markPastAppointmentsCompleted();
    const appointments = await runAppointmentReminders();
    const routine = await runRoutineReminders();
    return NextResponse.json({
      ok: true,
      routinePlanSync: { updated: 0 },
      appointments,
      routine,
    });
  } catch (e) {
    console.error("appointment-reminders cron", e);
    return NextResponse.json({ error: "CRON_FAILED" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
