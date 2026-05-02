import React from "react";
import { redirect } from "next/navigation";
import { db } from "../../src/db";
import { skinScans, dailyLogs, users, scans, weeklyReports } from "../../src/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { DashboardView } from "../../components/dashboard/DashboardView";
import { getSessionUserId } from "../../src/lib/auth/get-session";
import { getPatientDoctorSection } from "../../src/lib/patientDoctorSection";
import { patientRoutineListsForApi } from "../../src/lib/routine";
import { dateOnlyFromYmd } from "../../src/lib/date-only";
import { localYmdAndHm, normalizeIanaTimeZone } from "../../src/lib/timeZoneWallClock";

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function dailyFocusFromWeeklyAndScans(input: {
  weeklyRows: Array<{
    focusActionsJson: unknown;
    narrativeText: string | null;
    weeklyDelta: number | null;
  }>;
  latestOverall: number | null;
  prevOverall: number | null;
}): string {
  const latest = input.weeklyRows[0];
  if (latest && Array.isArray(latest.focusActionsJson)) {
    const first = latest.focusActionsJson.find(
      (x) => x && typeof x === "object" && typeof (x as { title?: unknown }).title === "string"
    ) as { title?: string; detail?: string } | undefined;
    if (first?.title?.trim()) return first.title.trim();
    if (first?.detail?.trim()) return first.detail.trim();
  }

  if (latest?.narrativeText?.trim()) {
    const sentence = latest.narrativeText
      .split(/[.!?]/)
      .map((s) => s.trim())
      .find((s) => s.length >= 20);
    if (sentence) return `${sentence}.`;
  }

  const scoreDelta =
    input.latestOverall != null && input.prevOverall != null
      ? input.latestOverall - input.prevOverall
      : null;

  if ((latest?.weeklyDelta ?? scoreDelta ?? 0) < 0) {
    return "Your weekly trend dipped slightly. Keep routine steps consistent today and avoid introducing a new active.";
  }
  if ((latest?.weeklyDelta ?? scoreDelta ?? 0) > 0) {
    return "Weekly trend improved. Keep your AM/PM routine steady today to lock in progress.";
  }
  return "Keep your AM and PM checklist consistent today to support stable skin progress.";
}

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
  const weekCut = subDays(todayDateOnly, 7);
  const [skinScanRows, todayLog, doctorSection, latestScans, recentLogs, weeklyRows] =
    await Promise.all([
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
    db
      .select({
        overallScore: scans.overallScore,
      })
      .from(scans)
      .where(eq(scans.userId, user.id))
      .orderBy(desc(scans.createdAt))
      .limit(2),
    db
      .select()
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, user.id), gte(dailyLogs.date, weekCut))
      ),
    db.query.weeklyReports.findMany({
      where: eq(weeklyReports.userId, user.id),
      orderBy: [desc(weeklyReports.createdAt)],
      limit: 3,
    }),
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

  const kaiSkinScore = latestScans[0]?.overallScore ?? skinScanRows[0]?.skinScore ?? 0;
  const weeklyProgressDelta =
    latestScans.length >= 2
      ? latestScans[0].overallScore - latestScans[1].overallScore
      : 0;

  let amPmDays = 0;
  let sleepSum = 0;
  let waterSum = 0;
  let highSun = 0;
  for (const l of recentLogs) {
    const amS = l.routineAmSteps ?? [];
    const pmS = l.routinePmSteps ?? [];
    const am = amS.length > 0 && amS.length === amS.filter(Boolean).length;
    const pm = pmS.length > 0 && pmS.length === pmS.filter(Boolean).length;
    if (am && pm) amPmDays += 1;
    sleepSum += l.sleepHours ?? 0;
    waterSum += l.waterGlasses ?? 0;
    if (l.sunExposure === "high" || l.sunExposure === "moderate") highSun += 1;
  }
  const n = Math.max(1, recentLogs.length);
  const routineCompletion7d = amPmDays / 7;
  const avgSleep = sleepSum / n;
  const avgWater = waterSum / n;
  const lifestyleAlignmentScore = clampPct(
    routineCompletion7d * 42 +
      Math.min(28, (avgSleep / 8) * 28) +
      Math.min(30, (avgWater / 8) * 30) -
      (highSun >= 4 ? 14 : highSun >= 2 ? 6 : 0)
  );

  const todayFocusMessage = dailyFocusFromWeeklyAndScans({
    weeklyRows: weeklyRows.map((w) => ({
      focusActionsJson: w.focusActionsJson,
      narrativeText: w.narrativeText,
      weeklyDelta: w.weeklyDelta,
    })),
    latestOverall: latestScans[0]?.overallScore ?? null,
    prevOverall: latestScans[1]?.overallScore ?? null,
  });

  return (
    <DashboardView
      skinScanHistory={skinScanHistory}
      todayLog={todayLog ?? null}
      amItems={amItems}
      pmItems={pmItems}
      kaiSkinScore={clampPct(kaiSkinScore)}
      weeklyProgressDelta={Math.round(weeklyProgressDelta)}
      lifestyleAlignmentScore={lifestyleAlignmentScore}
      todayFocusMessage={todayFocusMessage}
      streakCurrent={user.streakCurrent ?? 0}
      streakLongest={user.streakLongest ?? 0}
      doctorFeedback={doctorSection.doctorFeedback}
      doctorVoiceNotes={doctorSection.doctorVoiceNotes}
      doctorArchivedVoiceNotes={doctorSection.doctorArchivedVoiceNotes}
      doctorVoiceNoteIsNew={doctorSection.doctorVoiceNoteIsNew}
      onboardingComplete={doctorSection.onboardingComplete}
      routinePlanReady={routinePlanReady}
    />
  );
}
