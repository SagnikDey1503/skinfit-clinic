import { NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/src/lib/auth/get-session";
import { markPastAppointmentsCompleted } from "@/src/lib/markPastAppointmentsCompleted";
import { runAppointmentReminders } from "@/src/lib/runAppointmentReminders";
import { runRoutineReminders } from "@/src/lib/runRoutineReminders";
export const dynamic = "force-dynamic";

/**
 * Lightweight trigger for due pre-visit Clinic Support reminders.
 * Called from the client (e.g. chat) because SPA navigations may not re-run the dashboard layout.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
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
    console.error("appointments/reminders/tick", e);
    return NextResponse.json({ error: "TICK_FAILED" }, { status: 500 });
  }
}
