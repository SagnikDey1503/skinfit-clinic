import React from "react";
import { db } from "../../src/db";
import { scans, skinScans, dailyLogs } from "../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { DashboardView } from "../../components/dashboard/DashboardView";

export default async function DashboardPage() {
  const user = await db.query.users.findFirst();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-10 text-zinc-800">
        <div className="text-xl font-bold text-red-600">Test User Not Found</div>
        <p className="text-zinc-600">
          Please run{" "}
          <code className="rounded bg-zinc-200 px-1 py-0.5 text-[#6B8E8E]">
            npm run db:seed
          </code>{" "}
          in your terminal to create the test data.
        </p>
      </div>
    );
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

  const todayLog = await db.query.dailyLogs.findFirst({
    where: eq(dailyLogs.userId, user.id),
    orderBy: [desc(dailyLogs.date)],
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

  const amItems = [
    "Gentle Cleanser",
    "Toner",
    "Serum",
    "Moisturiser",
    "Spf",
  ];
  const pmItems = [
    "Oil Cleanser",
    "Toner",
    "Retinol",
    "Serum",
    "Night Cream",
  ];

  const amChecked = todayLog?.amRoutine ?? false;
  const pmChecked = todayLog?.pmRoutine ?? false;

  const routineScore = 80;
  const weeklyChangePercent = 5;

  return (
    <DashboardView
      latestScan={latestScanForView}
      todayLog={todayLog ?? null}
      params={params}
      amItems={amItems}
      pmItems={pmItems}
      amChecked={amChecked}
      pmChecked={pmChecked}
      routineScore={routineScore}
      weeklyChangePercent={weeklyChangePercent}
      doctorFeedback=""
    />
  );
}
