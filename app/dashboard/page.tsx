import React from "react";
import { redirect } from "next/navigation";
import { db } from "../../src/db";
import { scans, skinScans, dailyLogs, users } from "../../src/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { DashboardView } from "../../components/dashboard/DashboardView";
import { getSessionUserId } from "../../src/lib/auth/get-session";
import { AM_ROUTINE_ITEMS, PM_ROUTINE_ITEMS } from "../../src/lib/routine";
import { dateOnlyFromYmd, localCalendarYmd } from "../../src/lib/date-only";

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

  const latestDbScan = await db.query.scans.findFirst({
    where: eq(scans.userId, user.id),
    columns: {
      id: true,
      overallScore: true,
      acne: true,
      pigmentation: true,
      wrinkles: true,
      hydration: true,
      texture: true,
      aiSummary: true,
      createdAt: true,
    },
    orderBy: [desc(scans.createdAt)],
  });

  const latestScan = await db.query.skinScans.findFirst({
    where: eq(skinScans.userId, user.id),
    orderBy: [desc(skinScans.createdAt)],
  });

  const todayDateOnly = dateOnlyFromYmd(localCalendarYmd());
  const todayLog = await db.query.dailyLogs.findFirst({
    where: and(
      eq(dailyLogs.userId, user.id),
      eq(dailyLogs.date, todayDateOnly)
    ),
  });

  const scanMetrics = latestDbScan
    ? {
        acne: latestDbScan.acne,
        pigmentation: latestDbScan.pigmentation,
        wrinkles: latestDbScan.wrinkles,
        hydration: latestDbScan.hydration,
        texture: latestDbScan.texture,
        overallScore: latestDbScan.overallScore,
        createdAt: latestDbScan.createdAt,
      }
    : null;

  const analysis = (latestScan?.analysisResults ?? {}) as Record<string, number>;

  const hasMetrics = !!scanMetrics;

  const eczemaGuess = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((scanMetrics?.hydration ?? 50) + (100 - (scanMetrics?.acne ?? 35))) / 2
      )
    )
  );

  const params = hasMetrics
    ? [
        { label: "Acne", value: scanMetrics!.acne },
        { label: "Wrinkle", value: scanMetrics!.wrinkles },
        { label: "Pores", value: scanMetrics!.texture },
        { label: "Pigmentation", value: scanMetrics!.pigmentation },
        { label: "Hydration", value: scanMetrics!.hydration },
        {
          label: "Eczema",
          value:
            typeof analysis.eczema === "number" ? analysis.eczema : eczemaGuess,
        },
      ]
    : [
        { label: "Acne", value: 90 },
        { label: "Wrinkle", value: 84 },
        { label: "Pores", value: 43 },
        { label: "Pigmentation", value: 65 },
        { label: "Hydration", value: 65 },
        { label: "Eczema", value: 55 },
      ];

  const skinScore = scanMetrics?.overallScore ?? latestScan?.skinScore ?? 40;

  const latestScanForView = scanMetrics
    ? {
        skinScore,
        createdAt: scanMetrics.createdAt,
        analysisResults: scanMetrics,
      }
    : latestScan
      ? {
          skinScore: latestScan.skinScore,
          createdAt: latestScan.createdAt,
          analysisResults: latestScan.analysisResults,
        }
      : null;

  const amItems = [...AM_ROUTINE_ITEMS];
  const pmItems = [...PM_ROUTINE_ITEMS];

  const routineScore = 80;
  const weeklyChangePercent = 5;

  return (
    <DashboardView
      latestScan={latestScanForView}
      todayLog={todayLog ?? null}
      params={params}
      amItems={amItems}
      pmItems={pmItems}
      routineScore={routineScore}
      weeklyChangePercent={weeklyChangePercent}
      doctorFeedback=""
    />
  );
}
