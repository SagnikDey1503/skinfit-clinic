import { NextResponse } from "next/server";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";
import { loadUnrepliedDoctorChatAlerts } from "@/src/lib/doctorPatientChatInbox";

function snippetFromMessage(text: string, maxLen = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export async function GET() {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await loadUnrepliedDoctorChatAlerts(25);
  const items = rows.map((r) => ({
    patientId: r.patientId,
    messageId: r.messageId,
    patientName: r.patientName,
    preview: snippetFromMessage(r.text),
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    count: items.length,
    items,
  });
}
