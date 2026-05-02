import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { doctorFeedbackVoiceNotes, users } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";
import { notifyPatientDoctorVoiceNote } from "@/src/lib/expoPush";

const MAX_AUDIO_URI_LEN = 1_800_000;

export async function POST(req: Request) {
  const doctorId = await getDoctorPortalUserId();
  if (!doctorId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as {
    patientId?: unknown;
    audioDataUri?: unknown;
    scanId?: unknown;
  };

  const patientId = typeof b.patientId === "string" ? b.patientId.trim() : "";
  const audioDataUri =
    typeof b.audioDataUri === "string" ? b.audioDataUri.trim() : "";
  const scanId =
    typeof b.scanId === "number" && Number.isFinite(b.scanId)
      ? b.scanId
      : typeof b.scanId === "string" && /^\d+$/.test(b.scanId)
        ? parseInt(b.scanId, 10)
        : null;

  if (!patientId || !audioDataUri) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "patientId and audioDataUri required." },
      { status: 400 }
    );
  }

  if (
    !audioDataUri.startsWith("data:audio/") &&
    !audioDataUri.startsWith("data:application/octet-stream")
  ) {
    return NextResponse.json(
      {
        error: "INVALID_AUDIO",
        message: "audioDataUri must be a data:audio/... or octet-stream URI.",
      },
      { status: 400 }
    );
  }

  if (audioDataUri.length > MAX_AUDIO_URI_LEN) {
    return NextResponse.json(
      {
        error: "AUDIO_TOO_LARGE",
        message: "Recording is too large. Try a shorter voice note.",
      },
      { status: 400 }
    );
  }

  const [patient] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, patientId))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: "PATIENT_NOT_FOUND" }, { status: 404 });
  }

  const [inserted] = await db
    .insert(doctorFeedbackVoiceNotes)
    .values({
      userId: patientId,
      doctorId,
      scanId: scanId ?? undefined,
      audioDataUri,
    })
    .returning({
      id: doctorFeedbackVoiceNotes.id,
      createdAt: doctorFeedbackVoiceNotes.createdAt,
    });

  void notifyPatientDoctorVoiceNote(patientId);

  return NextResponse.json({
    success: true,
    voiceNote: inserted
      ? {
          id: inserted.id,
          createdAt: inserted.createdAt.toISOString(),
        }
      : null,
  });
}
