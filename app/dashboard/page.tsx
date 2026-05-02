import React from "react";
import { redirect } from "next/navigation";
import { db } from "../../src/db";
import { skinScans, dailyLogs, users } from "../../src/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { DashboardView } from "../../components/dashboard/DashboardView";
import { getSessionUserId } from "../../src/lib/auth/get-session";
import { getPatientDoctorSection } from "../../src/lib/patientDoctorSection";
import { patientRoutineListsForApi } from "../../src/lib/routine";
import { dateOnlyFromYmd } from "../../src/lib/date-only";
import { localYmdAndHm, normalizeIanaTimeZone } from "../../src/lib/timeZoneWallClock";
export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    redirect("/login");
  }

  const routinePlanAmItems = user.routinePlanAmItems;
  const routinePlanPmItems = user.routinePlanPmItems;

  const { ymd: todayYmd } = localYmdAndHm(
    new Date(),
    normalizeIanaTimeZone(user.timezone)
  );
  const todayDateOnly = dateOnlyFromYmd(todayYmd);
  const [skinScanRows, todayLog, doctorSection] = await Promise.all([
    db.query.skinScans.findMany({
      where: eq(skinScans.userId, user.id),
      orderBy: [desc(skinScans.createdAt)],
      columns: {
        id: true,
        skinScore: true,
        createdAt: true,
        analysisResults: true,
      },
    }),
    db.query.dailyLogs.findFirst({
      where: and(
        eq(dailyLogs.userId, user.id),
        eq(dailyLogs.date, todayDateOnly)
      ),
    }),
    getPatientDoctorSection(user.id),
  ]);

  const skinScanHistory = skinScanRows.map((r) => ({
    id: r.id,
    skinScore: r.skinScore,
    createdAt: r.createdAt.toISOString(),
    analysisResults: r.analysisResults,
  }));

  const { amItems, pmItems, routinePlanReady } = patientRoutineListsForApi({
    routinePlanAmItems,
    routinePlanPmItems,
    onboardingComplete: user.onboardingComplete,
  });

  const routineScore = 80;
  const weeklyChangePercent = 5;

  return (
    <DashboardView
      skinScanHistory={skinScanHistory}
      todayLog={todayLog ?? null}
      amItems={amItems}
      pmItems={pmItems}
      routineScore={routineScore}
      weeklyChangePercent={weeklyChangePercent}
      doctorFeedback={doctorSection.doctorFeedback}
      doctorVoiceNotes={doctorSection.doctorVoiceNotes}
      doctorArchivedVoiceNotes={doctorSection.doctorArchivedVoiceNotes}
      doctorVoiceNoteIsNew={doctorSection.doctorVoiceNoteIsNew}
      onboardingComplete={doctorSection.onboardingComplete}
      routinePlanReady={routinePlanReady}
    />
  );
}
