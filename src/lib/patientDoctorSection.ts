import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { doctorFeedbackVoiceNotes, users, visitNotes } from "@/src/db/schema";

export type PatientDoctorSection = {
  doctorFeedback: string;
  doctorVoiceNote: {
    id: string;
    audioDataUri: string;
    createdAt: string;
  } | null;
  doctorVoiceNoteIsNew: boolean;
  onboardingComplete: boolean;
};

export async function getPatientDoctorSection(
  userId: string
): Promise<PatientDoctorSection> {
  const [userRow, voiceRow, visitRow] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        doctorFeedbackViewedAt: true,
        onboardingComplete: true,
      },
    }),
    db
      .select({
        id: doctorFeedbackVoiceNotes.id,
        audioDataUri: doctorFeedbackVoiceNotes.audioDataUri,
        createdAt: doctorFeedbackVoiceNotes.createdAt,
      })
      .from(doctorFeedbackVoiceNotes)
      .where(
        and(
          eq(doctorFeedbackVoiceNotes.userId, userId),
          isNull(doctorFeedbackVoiceNotes.scanId)
        )
      )
      .orderBy(desc(doctorFeedbackVoiceNotes.createdAt))
      .limit(1),
    db
      .select({ notes: visitNotes.notes })
      .from(visitNotes)
      .where(eq(visitNotes.userId, userId))
      .orderBy(desc(visitNotes.createdAt))
      .limit(1),
  ]);

  const vn = voiceRow[0];
  const viewedAt = userRow?.doctorFeedbackViewedAt;
  const doctorVoiceNoteIsNew = Boolean(
    vn && (!viewedAt || vn.createdAt > viewedAt)
  );

  return {
    doctorFeedback: visitRow[0]?.notes?.trim() ?? "",
    doctorVoiceNote: vn
      ? {
          id: vn.id,
          audioDataUri: vn.audioDataUri,
          createdAt: vn.createdAt.toISOString(),
        }
      : null,
    doctorVoiceNoteIsNew,
    onboardingComplete: userRow?.onboardingComplete ?? true,
  };
}
