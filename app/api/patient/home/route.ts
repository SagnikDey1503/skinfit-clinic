import { NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/src/db";
import { dailyLogs, scans, skinScans, users } from "@/src/db/schema";
import { getSessionUserIdFromRequest } from "@/src/lib/auth/get-session";
import { dateOnlyFromYmd, parseYmdToDateOnly } from "@/src/lib/date-only";
import { getPatientDoctorSection } from "@/src/lib/patientDoctorSection";
import { patientRoutineListsForApi } from "@/src/lib/routine";
import { localYmdAndHm, normalizeIanaTimeZone } from "@/src/lib/timeZoneWallClock";

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export async function GET(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      streakCurrent: true,
      streakLongest: true,
      cycleTrackingEnabled: true,
      onboardingComplete: true,
      timezone: true,
      routinePlanAmItems: true,
      routinePlanPmItems: true,
      routinePlanClinicianLocked: true,
    },
  });
  if (!userRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const routinePlanAmItems = userRow.routinePlanAmItems;
  const routinePlanPmItems = userRow.routinePlanPmItems;

  const tz = normalizeIanaTimeZone(userRow.timezone);
  const todayYmdFromProfile =
    dateParam && parseYmdToDateOnly(dateParam)
      ? dateParam.slice(0, 10)
      : localYmdAndHm(new Date(), tz).ymd;
  const todayDateOnly = dateOnlyFromYmd(todayYmdFromProfile);
  const weekCut = subDays(todayDateOnly, 7);

  const [
    skinScanRows,
    todayLog,
    lastScans,
    recentLogs,
    doctorSection,
  ] = await Promise.all([
    db.query.skinScans.findMany({
      where: eq(skinScans.userId, userId),
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
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.date, todayDateOnly)
      ),
    }),
    db
      .select({
        overallScore: scans.overallScore,
        createdAt: scans.createdAt,
      })
      .from(scans)
      .where(eq(scans.userId, userId))
      .orderBy(desc(scans.createdAt))
      .limit(2),
    db
      .select()
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, weekCut))
      ),
    getPatientDoctorSection(userId),
  ]);

  const skinScanHistory = skinScanRows.map((r) => ({
    id: r.id,
    skinScore: r.skinScore,
    createdAt: r.createdAt.toISOString(),
    analysisResults: r.analysisResults,
  }));

  const todayLogOut = todayLog
    ? {
        journalEntry: todayLog.journalEntry,
        sleepHours: todayLog.sleepHours,
        stressLevel: todayLog.stressLevel,
        waterGlasses: todayLog.waterGlasses,
        mood: todayLog.mood,
        amRoutine: todayLog.amRoutine,
        pmRoutine: todayLog.pmRoutine,
        routineAmSteps: todayLog.routineAmSteps ?? null,
        routinePmSteps: todayLog.routinePmSteps ?? null,
        dietType: todayLog.dietType ?? null,
        sunExposure: todayLog.sunExposure ?? null,
        cycleDay: todayLog.cycleDay ?? null,
        comments: todayLog.comments ?? null,
      }
    : null;

  const kaiSkinScore =
    lastScans[0]?.overallScore ?? skinScanRows[0]?.skinScore ?? 0;

  let weeklyDeltaScore = 0;
  if (lastScans.length >= 2) {
    weeklyDeltaScore =
      lastScans[0].overallScore - lastScans[1].overallScore;
  }

  let amPmDays = 0;
  let sleepSum = 0;
  let waterSum = 0;
  let highSun = 0;
  for (const l of recentLogs) {
    const amS = l.routineAmSteps ?? [];
    const pmS = l.routinePmSteps ?? [];
    const am =
      amS.length > 0 && amS.length === amS.filter(Boolean).length;
    const pm =
      pmS.length > 0 && pmS.length === pmS.filter(Boolean).length;
    if (am && pm) amPmDays += 1;
    sleepSum += l.sleepHours ?? 0;
    waterSum += l.waterGlasses ?? 0;
    if (l.sunExposure === "high" || l.sunExposure === "moderate") {
      highSun += 1;
    }
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

  const onboardingComplete = userRow.onboardingComplete;

  const {
    doctorFeedback,
    doctorVoiceNotes,
    doctorArchivedVoiceNotes,
    doctorVoiceNoteIsNew,
  } = doctorSection;

  const { amItems, pmItems, routinePlanReady } = patientRoutineListsForApi({
    routinePlanAmItems,
    routinePlanPmItems,
    onboardingComplete,
  });

  return NextResponse.json({
    skinScanHistory,
    todayLog: todayLogOut,
    amItems,
    pmItems,
    routinePlanReady,
    kaiSkinScore: clampPct(kaiSkinScore),
    weeklyDeltaScore: Math.round(weeklyDeltaScore),
    lifestyleAlignmentScore,
    /** @deprecated use lifestyleAlignmentScore */
    routineScore: lifestyleAlignmentScore,
    /** @deprecated use weeklyDeltaScore */
    weeklyChangePercent: Math.round(weeklyDeltaScore),
    doctorFeedback,
    doctorVoiceNotes,
    doctorArchivedVoiceNotes,
    /** @deprecated first active note only — use doctorVoiceNotes */
    doctorVoiceNote: doctorVoiceNotes[0] ?? null,
    doctorVoiceNoteIsNew,
    /** Calendar date used for today’s log (patient profile timezone when `date` query omitted). */
    homeDateYmd: todayYmdFromProfile,
    streakCurrent: userRow.streakCurrent ?? 0,
    streakLongest: userRow.streakLongest ?? 0,
    cycleTrackingEnabled: userRow.cycleTrackingEnabled ?? false,
    onboardingComplete,
  });
}
